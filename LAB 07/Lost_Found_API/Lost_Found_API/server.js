// Responsibility: routing + event wiring. Business rules live in modules/.

const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { EventEmitter } = require('node:events');

const { createStore } = require('./modules/itemStore');
const { validateItem, validateStatusFilter } = require('./modules/validator');
const { sendJson, readJson } = require('./modules/httpHelpers');
const { createNotifier } = require('./modules/emailService');
const { createUploadService } = require('./modules/uploadService');

function createApp(options = {}) {
  const dataDir   = options.dataDir   || path.join(__dirname, 'data');
  const uploadDir = options.uploadDir || path.join(__dirname, 'uploads');
  const smtpPort  = options.smtpPort  || 2525;

  const store = createStore(dataDir);
  const uploads = createUploadService(uploadDir);
  const notifier = createNotifier({ port: smtpPort });
  const events = new EventEmitter();

  // ---- Task 4: listeners run AFTER the item is safely saved ----
  events.on('item:created', item => {
    console.log(`[EVENT] item:created  ${item.status.toUpperCase()}  "${item.title}"  (${item.id})`);
  });

  events.on('item:created', item => {                       // optional audit trail
    const line = `${new Date().toISOString()} item:created ${item.id} ${item.status}\n`;
    fs.mkdir(dataDir, { recursive: true })
      .then(() => fs.appendFile(path.join(dataDir, 'audit.log'), line, 'utf8'))
      .catch(err => console.error('[AUDIT WARNING]', err.message));
  });

  // ---- Task 5: found items -> offline notice (failure must not affect the item) ----
  events.on('item:created', item => {
    if (item.status !== 'found') return;
    Promise.resolve()
      .then(() => notifier.sendFoundNotice(item))
      .then(() => console.log(`[MAIL] Notice for ${item.id} accepted by local SMTP`))
      .catch(err => console.error('[MAIL WARNING] Item still saved:', err.message));
  });

  async function handle(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname.replace(/\/+$/, '') || '/';
    const method = req.method;

    if (method === 'GET' && pathname === '/api/health') {
      return sendJson(res, 200, { status: 'ok' });
    }

    if (method === 'GET' && pathname === '/api/items') {
      const f = validateStatusFilter(url.searchParams.get('status'));
      if (f.error) return sendJson(res, f.status, { error: f.error });
      return sendJson(res, 200, { items: await store.listItems(f.value) });
    }

    if (method === 'GET' && pathname === '/api/items/count') {
      const f = validateStatusFilter(url.searchParams.get('status'));
      if (f.error) return sendJson(res, f.status, { error: f.error });
      return sendJson(res, 200, { status: f.value || 'all', count: await store.countItems(f.value) });
    }

    if (method === 'POST' && pathname === '/api/items') {
      const data = await readJson(req);
      const v = validateItem(data);
      if (v.error) return sendJson(res, v.status, { error: v.error });

      if (v.value.attachmentId && !(await uploads.attachmentExists(v.value.attachmentId))) {
        return sendJson(res, 404, { error: 'Attachment not found' });
      }

      const item = await store.saveItem(v.value);   // 1) persist first
      events.emit('item:created', item);            // 2) then announce
      return sendJson(res, 201, { message: 'Item saved', item });
    }

    if (method === 'POST' && pathname === '/api/attachments') {
      const meta = await uploads.saveUpload(req);
      return sendJson(res, 201, { message: 'Attachment stored privately', attachment: meta });
    }

    return sendJson(res, 404, { error: 'Not found' });
  }

  const server = http.createServer((req, res) => {
    handle(req, res).catch(err => {
      if (res.headersSent) return res.end();
      const status = err.status || 500;
      if (status === 500) console.error('[SERVER ERROR]', err);
      sendJson(res, status, { error: status === 500 ? 'Internal server error' : err.message });
    });
  });

  return { server, events, store };
}

if (require.main === module) {
  const PORT = Number(process.env.PORT) || 3000;
  const { server } = createApp();
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`Lost & Found API: http://localhost:${PORT}`);
  });
}

module.exports = { createApp };
