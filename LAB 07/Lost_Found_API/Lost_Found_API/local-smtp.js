// Offline SMTP receiver for demos. Listens on 127.0.0.1:2525 ONLY - never expose it.
const { SMTPServer } = require('smtp-server');

const server = new SMTPServer({
  authOptional: true,
  disabledCommands: ['STARTTLS'],
  onData(stream, session, callback) {
    let raw = '';
    stream.on('data', c => { raw += c; });
    stream.on('end', () => {
      console.log('\n========== EMAIL RECEIVED (local only) ==========');
      console.log(raw);
      console.log('=================================================\n');
      callback();
    });
  }
});

server.on('error', err => console.error('[SMTP ERROR]', err.message));
server.listen(2525, '127.0.0.1', () => console.log('Local SMTP inbox on 127.0.0.1:2525'));
