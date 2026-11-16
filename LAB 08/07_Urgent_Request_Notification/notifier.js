const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: "127.0.0.1",
  port: 1025,
  secure: false,
  tls: { rejectUnauthorized: false },
});
async function sendUrgentEmail(r) {
  return transporter.sendMail({
    from: "helpdesk@university.local",
    to: "office@university.local",
    subject: `URGENT request ${r.id}`,
    text: `Student: ${r.studentName}\nCategory: ${r.category}\nIssue: ${r.description}`,
  });
}
module.exports = { sendUrgentEmail };
