const http = require("http"),
  fs = require("fs/promises"),
  path = require("path"),
  crypto = require("crypto"),
  formidable = require("formidable");
const PORT = 3002,
  PUBLIC = path.join(__dirname, "public"),
  UPLOAD = path.join(__dirname, "private_uploads"),
  LIMIT = 1024 * 1024;
function send(res, code, data) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data, null, 2));
}
function signatureOK(file, buffer) {
  if (file.mimetype === "application/pdf")
    return buffer.subarray(0, 5).toString() === "%PDF-";
  if (file.mimetype === "image/png")
    return buffer
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return false;
}
async function upload(req, res) {
  await fs.mkdir(UPLOAD, { recursive: true });
  const form = formidable({
    uploadDir: UPLOAD,
    keepExtensions: false,
    maxFiles: 1,
    maxFileSize: LIMIT,
    maxTotalFileSize: LIMIT,
    allowEmptyFiles: false,
    minFileSize: 1,
    filter: (part) =>
      part.name === "document" &&
      ["application/pdf", "image/png"].includes(part.mimetype),
  });
  let files;
  try {
    [, files] = await form.parse(req);
  } catch (e) {
    return send(res, e.httpCode === 413 || e.code === 1009 ? 413 : 400, {
      success: false,
      message: e.message || "Upload rejected.",
    });
  }
  const raw = files.document,
    file = Array.isArray(raw) ? raw[0] : raw;
  if (!file || !file.filepath || file.size === 0)
    return send(res, 400, {
      success: false,
      message: "A non-empty PDF or PNG is required.",
    });
  const ext = path.extname(file.originalFilename || "").toLowerCase(),
    expected = file.mimetype === "application/pdf" ? ".pdf" : ".png";
  if (ext !== expected) {
    await fs.unlink(file.filepath).catch(() => {});
    return send(res, 400, {
      success: false,
      message: "Extension does not match MIME type.",
    });
  }
  const data = await fs.readFile(file.filepath);
  if (!signatureOK(file, data)) {
    await fs.unlink(file.filepath).catch(() => {});
    return send(res, 400, {
      success: false,
      message: "File content is not a valid PDF or PNG signature.",
    });
  }
  const stored = crypto.randomUUID() + expected;
  await fs.rename(file.filepath, path.join(UPLOAD, stored));
  return send(res, 201, {
    success: true,
    message: "File uploaded.",
    file: {
      originalName: path.basename(file.originalFilename || "document"),
      storedName: stored,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    },
  });
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === "POST" && url.pathname === "/api/upload")
    return upload(req, res);
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(await fs.readFile(path.join(PUBLIC, "index.html")));
  }
  // private_uploads is never exposed as a static/public route.
  return send(res, 404, { success: false, message: "Route not found." });
});
server.listen(PORT, () =>
  console.log(`Upload app at http://localhost:${PORT}`),
);
