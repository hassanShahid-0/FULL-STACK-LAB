const http = require("http"),
  fs = require("fs/promises"),
  path = require("path"),
  { randomUUID } = require("crypto"),
  EventEmitter = require("events");
const { logActivity } = require("./logger"),
  { sendUrgentEmail } = require("./notifier");
const PORT = 3001,
  FILE = path.join(__dirname, "data", "requests.json"),
  events = new EventEmitter();
async function read() {
  return JSON.parse(await fs.readFile(FILE, "utf8"));
}
async function save(data) {
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}
function send(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj, null, 2));
}
function getBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch {
        reject(Error("Malformed JSON."));
      }
    });
    req.on("error", reject);
  });
}
events.on("request:saved", (r) => {
  logActivity(r).catch((e) => console.error("Log error:", e.message));
  if (r.priority === "urgent")
    sendUrgentEmail(r).catch((e) =>
      console.error("Email unavailable; request remains saved:", e.message),
    );
});
const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/api/requests")
      return send(res, 200, { data: await read() });
    if (req.method === "POST" && req.url === "/api/requests") {
      let b;
      try {
        b = await getBody(req);
      } catch (e) {
        return send(res, 400, { message: e.message });
      }
      if (
        typeof b.studentName !== "string" ||
        !b.studentName.trim() ||
        typeof b.category !== "string" ||
        !b.category.trim() ||
        typeof b.description !== "string" ||
        b.description.trim().length < 5 ||
        !["normal", "urgent"].includes(b.priority)
      )
        return send(res, 400, {
          message:
            "Provide studentName, category, description (5+ chars), and priority normal or urgent.",
        });
      const data = await read(),
        created = {
          id: "REQ-" + randomUUID().slice(0, 8).toUpperCase(),
          studentName: b.studentName.trim(),
          category: b.category.trim(),
          description: b.description.trim(),
          priority: b.priority,
          createdAt: new Date().toISOString(),
        };
      data.push(created);
      await save(data);
      events.emit("request:saved", created);
      return send(res, 201, { message: "Request saved.", data: created });
    }
    return send(res, 404, { message: "Route not found." });
  } catch (e) {
    console.error(e);
    return send(res, 500, { message: "Internal server error." });
  }
});
server.listen(PORT, () =>
  console.log(`Notification API at http://localhost:${PORT}`),
);
