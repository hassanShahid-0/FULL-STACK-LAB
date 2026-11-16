const fs = require("fs/promises"),
  path = require("path");
const FILE = path.join(__dirname, "logs", "activity.log");
async function logActivity(r) {
  await fs.appendFile(
    FILE,
    `${new Date().toISOString()} | ${r.id} | ${r.priority.toUpperCase()} | ${r.studentName} | ${r.description}\n`,
  );
}
module.exports = { logActivity };
