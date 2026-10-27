// Responsibility: persistence. Items live in an NDJSON file (one JSON object per line).

const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

function createStore(dataDir) {
  const itemsPath = path.join(dataDir, 'items.ndjson');

  // Missing file is NOT an error: it simply means "no items yet".
  async function readAll() {
    let text;
    try {
      text = await fs.readFile(itemsPath, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
    const items = [];
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      try { items.push(JSON.parse(line)); }
      catch { console.warn('[STORE] Skipping corrupt line in items.ndjson'); }
    }
    return items;
  }

  async function listItems(status = null) {
    const items = await readAll();
    return status ? items.filter(i => i.status === status) : items;
  }

  async function countItems(status = null) {
    return (await listItems(status)).length;
  }

  async function saveItem(fields) {
    const record = {
      id: crypto.randomUUID(),
      ...fields,
      createdAt: new Date().toISOString()
    };
    await fs.mkdir(dataDir, { recursive: true });
    await fs.appendFile(itemsPath, `${JSON.stringify(record)}\n`, 'utf8');
    return record;
  }

  return { listItems, countItems, saveItem, itemsPath };
}

module.exports = { createStore };
