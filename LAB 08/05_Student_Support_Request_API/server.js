const http = require("http"),
  fs = require("fs/promises"),
  path = require("path"),
  { randomUUID } = require("crypto");
const PORT = 3000,
  FILE = path.join(__dirname, "data", "requests.json");
async function read() {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
}
async function save(data) {
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}
function send(res, code, data) {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data, null, 2));
}
function body(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 100000) reject(Error("Body too large"));
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch {
        reject(Error("Malformed JSON body."));
      }
    });
    req.on("error", reject);
  });
}
function validate(b) {
  if (!b || typeof b !== "object" || Array.isArray(b))
    return "Body must be an object.";
  if (typeof b.studentName !== "string" || !b.studentName.trim())
    return "studentName must be non-empty text.";
  if (
    !["classroom repair", "ID card", "course schedule", "equipment"].includes(
      b.category,
    )
  )
    return "category is invalid.";
  if (typeof b.description !== "string" || b.description.trim().length < 5)
    return "description must have at least 5 characters.";
  if (!["low", "normal", "high", "urgent"].includes(b.priority))
    return "priority is invalid.";
  return null;
}
const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (req.method === "GET" && url.pathname === "/api/requests") {
      const data = await read();
      return send(res, 200, { success: true, count: data.length, data });
    }
    const match = url.pathname.match(/^\/api\/requests\/([^/]+)$/);
    if (req.method === "GET" && match) {
      const found = (await read()).find(
        (x) => x.id === decodeURIComponent(match[1]),
      );
      return found
        ? send(res, 200, { success: true, data: found })
        : send(res, 404, { success: false, message: "Request not found." });
    }
    if (req.method === "POST" && url.pathname === "/api/requests") {
      let b;
      try {
        b = await body(req);
      } catch (e) {
        return send(res, 400, { success: false, message: e.message });
      }
      const error = validate(b);
      if (error) return send(res, 400, { success: false, message: error });
      const data = await read(),
        created = {
          id: "REQ-" + randomUUID().slice(0, 8).toUpperCase(),
          studentName: b.studentName.trim(),
          category: b.category,
          description: b.description.trim(),
          priority: b.priority,
          status: "open",
          createdAt: new Date().toISOString(),
        };
      data.push(created);
      await save(data);
      return send(res, 201, {
        success: true,
        message: "Request created.",
        data: created,
      });
    }
    return send(res, 404, { success: false, message: "Route not found." });
  } catch (e) {
    console.error(e);
    return send(res, 500, {
      success: false,
      message: "Internal server error.",
    });
  }
});
server.listen(PORT, () =>
  console.log(`API running at http://localhost:${PORT}`),
);
