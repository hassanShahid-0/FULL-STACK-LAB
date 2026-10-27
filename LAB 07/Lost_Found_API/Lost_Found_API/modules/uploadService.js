// Responsibility: private evidence uploads (PDF / PNG / JPG) using Formidable.
// Files are stored under a server-generated name; callers only get metadata.

const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { formidable } = require('formidable');
const { httpError } = require('./httpHelpers');
const { UUID_RE } = require('./validator');

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const TYPES = {
  '.pdf':  { mime: 'application/pdf', magic: Buffer.from('%PDF-') },
  '.png':  { mime: 'image/png',       magic: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  '.jpg':  { mime: 'image/jpeg',      magic: Buffer.from([0xff, 0xd8, 0xff]) },
  '.jpeg': { mime: 'image/jpeg',      magic: Buffer.from([0xff, 0xd8, 0xff]) }
};

async function readHead(filePath, n = 8) {
  const fh = await fs.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(n);
    const { bytesRead } = await fh.read(buf, 0, n, 0);
    return buf.subarray(0, bytesRead);
  } finally { await fh.close(); }
}

function createUploadService(uploadDir) {
  async function saveUpload(req) {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
      throw httpError(415, 'Use multipart/form-data with a file field named "attachment"');
    }
    await fs.mkdir(uploadDir, { recursive: true });

    const form = formidable({
      uploadDir,
      maxFiles: 1,
      maxFileSize: MAX_SIZE,
      maxTotalFileSize: MAX_SIZE,
      allowEmptyFiles: false
    });

    let files;
    try {
      [, files] = await form.parse(req);
    } catch (err) {
      if (err.httpCode === 413 || /maxFileSize|maxTotalFileSize/.test(err.message)) {
        throw httpError(413, 'File is larger than 2 MB');
      }
      throw httpError(400, 'Invalid multipart upload');
    }

    const file = files.attachment && files.attachment[0];
    if (!file) throw httpError(400, 'File field "attachment" is required');

    const reject = async (message) => {
      await fs.rm(file.filepath, { force: true });  // delete rejected file
      throw httpError(400, message);
    };

    const ext = path.extname(file.originalFilename || '').toLowerCase();
    const rule = TYPES[ext];
    if (!rule) return reject('Only PDF, PNG and JPG files are allowed');
    if (file.mimetype !== rule.mime) return reject('File type does not match its extension');

    const head = await readHead(file.filepath, rule.magic.length);
    if (!head.equals(rule.magic)) return reject('File content does not match its type');

    const attachmentId = crypto.randomUUID();
    await fs.rename(file.filepath, path.join(uploadDir, `${attachmentId}${ext}`));

    // metadata only - never the filesystem path
    return {
      attachmentId,
      originalName: path.basename(file.originalFilename),
      mimeType: rule.mime,
      size: file.size
    };
  }

  // Does an uploaded attachment with this ID exist? (used when an item references it)
  async function attachmentExists(id) {
    if (!UUID_RE.test(id)) return false;
    try {
      const names = await fs.readdir(uploadDir);
      return names.some(n => n.startsWith(`${id}.`));
    } catch { return false; }
  }

  return { saveUpload, attachmentExists };
}

module.exports = { createUploadService, MAX_SIZE };
