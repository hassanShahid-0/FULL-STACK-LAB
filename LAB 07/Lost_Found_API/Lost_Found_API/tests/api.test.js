// Integration tests: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { SMTPServer } = require('smtp-server');
const { createApp } = require('../server');

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const validItem = (over = {}) => ({
  title: 'Black wallet', category: 'Accessories', location: 'Library',
  status: 'lost', contactName: 'Ali', ...over
});

async function start({ smtpPort = 1 } = {}) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'lf-'));
  const dataDir = path.join(tmp, 'data');
  const uploadDir = path.join(tmp, 'uploads');
  const app = createApp({ dataDir, uploadDir, smtpPort });
  await new Promise(r => app.server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const post = (p, body, raw = false) => fetch(base + p, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: raw ? body : JSON.stringify(body)
  });
  const close = async () => { await new Promise(r => app.server.close(r)); await fs.rm(tmp, { recursive: true, force: true }); };
  return { ...app, base, post, dataDir, uploadDir, close };
}

test('GET /api/items works when the data file does not exist yet', async () => {
  const t = await start();
  const r = await fetch(t.base + '/api/items');
  assert.equal(r.status, 200);
  assert.deepEqual((await r.json()).items, []);
  await t.close();
});

test('POST valid item -> 201, stored in NDJSON, visible via GET, filter and count', async () => {
  const t = await start();
  const r = await t.post('/api/items', validItem());
  assert.equal(r.status, 201);
  const { item } = await r.json();
  assert.equal(typeof item.id, 'string');
  assert.ok(item.createdAt);

  const lines = (await fs.readFile(path.join(t.dataDir, 'items.ndjson'), 'utf8')).trim().split('\n');
  assert.equal(lines.length, 1);
  assert.equal(JSON.parse(lines[0]).id, item.id);

  await t.post('/api/items', validItem({ title: 'Keys', status: 'found' }));
  const lost = await (await fetch(t.base + '/api/items?status=lost')).json();
  assert.equal(lost.items.length, 1);
  const count = await (await fetch(t.base + '/api/items/count')).json();
  assert.equal(count.count, 2);
  const countFound = await (await fetch(t.base + '/api/items/count?status=found')).json();
  assert.equal(countFound.count, 1);
  await t.close();
});

test('items survive a server restart', async () => {
  const t = await start();
  await t.post('/api/items', validItem({ title: 'Umbrella' }));
  await new Promise(r => t.server.close(r));

  const app2 = createApp({ dataDir: t.dataDir, uploadDir: t.uploadDir });
  await new Promise(r => app2.server.listen(0, '127.0.0.1', r));
  const res = await fetch(`http://127.0.0.1:${app2.server.address().port}/api/items`);
  const { items } = await res.json();
  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'Umbrella');
  await new Promise(r => app2.server.close(r));
  await fs.rm(path.dirname(t.dataDir), { recursive: true, force: true });
});

test('validation failures return 400', async () => {
  const t = await start();
  const cases = [
    validItem({ title: undefined }),
    validItem({ title: '   ' }),
    validItem({ status: 'stolen' }),
    validItem({ description: 'x'.repeat(501) }),
    validItem({ title: 'x'.repeat(101) })
  ];
  for (const c of cases) assert.equal((await t.post('/api/items', c)).status, 400);
  assert.equal((await t.post('/api/items', '{bad json', true)).status, 400);
  assert.equal((await t.post('/api/items', '[1,2]', true)).status, 400);
  assert.equal((await fetch(t.base + '/api/items?status=zzz')).status, 400);
  await assert.rejects(fs.readFile(path.join(t.dataDir, 'items.ndjson')));   // nothing saved
  await t.close();
});

test('unknown path -> 404 JSON', async () => {
  const t = await start();
  const r = await fetch(t.base + '/api/nothing');
  assert.equal(r.status, 404);
  assert.equal((await r.json()).error, 'Not found');
  await t.close();
});

test('item:created is emitted only after the item is persisted', async () => {
  const t = await start();
  let seen = null;
  t.events.on('item:created', async item => {
    seen = { item, lines: (await fs.readFile(t.store.itemsPath, 'utf8')).trim().split('\n') };
  });
  await t.post('/api/items', validItem());
  await sleep(100);
  assert.ok(seen);
  assert.equal(JSON.parse(seen.lines[0]).id, seen.item.id);
  const audit = await fs.readFile(path.join(t.dataDir, 'audit.log'), 'utf8');
  assert.match(audit, /item:created/);
  await t.close();
});

test('found item sends an offline email; SMTP down does not break saving', async () => {
  let raw = '';
  const smtp = new SMTPServer({
    authOptional: true, disabledCommands: ['STARTTLS'],
    onData(stream, s, cb) { stream.on('data', c => { raw += c; }); stream.on('end', cb); }
  });
  await new Promise(r => smtp.listen(0, '127.0.0.1', r));
  const t = await start({ smtpPort: smtp.server.address().port });

  assert.equal((await t.post('/api/items', validItem({ title: 'Blue Bottle', status: 'found' }))).status, 201);
  await sleep(500);
  assert.match(raw, /Blue Bottle/);

  raw = '';
  await t.post('/api/items', validItem({ status: 'lost' }));          // lost -> no mail
  await sleep(300);
  assert.equal(raw, '');
  await new Promise(r => smtp.close(r));

  assert.equal((await t.post('/api/items', validItem({ status: 'found' }))).status, 201);  // SMTP now down
  await sleep(300);
  assert.equal((await (await fetch(t.base + '/api/items/count')).json()).count, 3);
  await t.close();
});

function uploadForm(bytes, name, type) {
  const fd = new FormData();
  fd.append('attachment', new Blob([bytes], { type }), name);
  return fd;
}

test('attachments: valid PNG, bad type, fake content, missing field, too large, JSON body', async () => {
  const t = await start();
  const up = body => fetch(t.base + '/api/attachments', { method: 'POST', body });

  let r = await up(uploadForm(PNG, 'proof.png', 'image/png'));
  assert.equal(r.status, 201);
  const { attachment } = await r.json();
  assert.equal(attachment.mimeType, 'image/png');
  assert.equal(attachment.path, undefined);                       // no filesystem path leaked

  assert.equal((await up(uploadForm('hello', 'a.txt', 'text/plain'))).status, 400);
  assert.equal((await up(uploadForm('not really a png', 'fake.png', 'image/png'))).status, 400);
  const empty = new FormData(); empty.append('other', 'x');
  assert.equal((await up(empty)).status, 400);
  const big = Buffer.concat([PNG, Buffer.alloc(3 * 1024 * 1024)]);
  assert.equal((await up(uploadForm(big, 'big.png', 'image/png'))).status, 413);
  assert.equal((await t.post('/api/attachments', {})).status, 415);

  assert.equal((await fs.readdir(t.uploadDir)).length, 1);       // rejected files were removed

  // item referencing the attachment ID
  assert.equal((await t.post('/api/items', validItem({ attachmentId: attachment.attachmentId }))).status, 201);
  assert.equal((await t.post('/api/items', validItem({ attachmentId: '11111111-1111-4111-8111-111111111111' }))).status, 404);
  assert.equal((await t.post('/api/items', validItem({ attachmentId: '../etc/passwd' }))).status, 400);
  await t.close();
});
