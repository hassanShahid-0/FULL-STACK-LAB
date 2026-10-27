// Responsibility: offline notice to the LOCAL SMTP receiver (127.0.0.1:2525 by default).
// Nothing here reaches a real inbox.

const nodemailer = require('nodemailer');

function createNotifier({ host = '127.0.0.1', port = 2525 } = {}) {
  const transport = nodemailer.createTransport({
    host, port,
    secure: false,
    ignoreTLS: true,          // localhost demo only
    connectionTimeout: 2000,
    greetingTimeout: 2000,
    socketTimeout: 5000
  });

  async function sendFoundNotice(item) {
    return transport.sendMail({
      from: 'lostfound@campus.test',
      to: 'student-affairs@campus.test',
      subject: `Found item reported: ${item.title}`,
      text: [
        'A found item was submitted.',
        `ID: ${item.id}`,
        `Title: ${item.title}`,
        `Category: ${item.category}`,
        `Location: ${item.location}`,
        `Contact: ${item.contactName}`,
        `Reported at: ${item.createdAt}`
      ].join('\n')
    });
  }

  return { sendFoundNotice };
}

module.exports = { createNotifier };
