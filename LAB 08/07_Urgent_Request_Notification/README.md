# Problem 7 — Urgent Request Notification
Run `npm install`. Terminal 1: `npm run smtp`. Terminal 2: `npm run api`. API port 3001; local SMTP port 1025.
POST `http://localhost:3001/api/requests` with JSON such as `{"studentName":"Hassan","category":"equipment","description":"Keyboard is damaged","priority":"normal"}`. Change priority to `urgent` to trigger a local email. Stop SMTP and submit urgent again: the API still saves first and returns 201; email failure is logged. Activity logging and notification are separate modules. No real credentials or external recipients are used.
