# Problem 5 — Student Support Request API
Start with `node server.js` (port 3000).
- GET `/api/requests` — all records
- GET `/api/requests/:id` — one record
- POST `/api/requests` — create record
POST JSON fields: `studentName` string, `category` one of classroom repair / ID card / course schedule / equipment, `description` at least 5 characters, `priority` low / normal / high / urgent. Accepted records persist in `data/requests.json`. Status codes: 200, 201, 400, 404, 500.
