// Responsibility: everything about talking HTTP (read JSON body, send JSON reply).

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

// Reads the request body and parses it as a JSON object.
// Rejects with status 400 (malformed / not an object) or 413 (too large).
function readJson(req, limit = 100 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooBig = false;

    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) { tooBig = true; return; } // keep draining, drop data
      chunks.push(chunk);
    });
    req.on('error', reject);
    req.on('end', () => {
      if (tooBig) return reject(httpError(413, 'Request body too large'));
      try {
        const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          return reject(httpError(400, 'JSON body must be an object'));
        }
        resolve(parsed);
      } catch {
        reject(httpError(400, 'Malformed JSON'));
      }
    });
  });
}

module.exports = { sendJson, readJson, httpError };
