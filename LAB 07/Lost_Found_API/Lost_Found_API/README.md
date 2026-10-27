# Campus Lost & Found API (Lab 7 – Case Study)

Plain Node.js (core `http` / `fs`, no Express, no database).
Dependencies: `formidable` (uploads), `nodemailer` + `smtp-server` (offline email).

## Run
```
npm install
npm test          # 8 automated integration tests
npm start         # API on http://localhost:3000
npm run smtp      # (2nd terminal) offline inbox on 127.0.0.1:2525
```

## Folder structure
```
Lost_Found_API/
├── server.js                 routing + event wiring
├── local-smtp.js             offline SMTP receiver (prints raw email)
├── package.json / package-lock.json
├── README.md
├── modules/
│   ├── itemStore.js          NDJSON file store
│   ├── validator.js          validation rules
│   ├── httpHelpers.js        readJson / sendJson / httpError
│   ├── emailService.js       Nodemailer -> local SMTP
│   └── uploadService.js      Formidable private uploads
├── data/                     items.ndjson, audit.log (created at runtime)
├── uploads/                  private attachments (never served)
├── tests/api.test.js
└── postman/Lost_Found.postman_collection.json
```

## Task 1 – Item shape and module responsibilities
```json
{ "id": "uuid", "title": "Black wallet", "category": "Accessories",
  "location": "Library", "status": "lost|found", "contactName": "Ali",
  "description": "(optional)", "attachmentId": "(optional uuid)",
  "createdAt": "ISO date" }
```
| Module | Responsibility |
|---|---|
| `itemStore.js` | Only place that touches `items.ndjson`: append, read, filter, count. |
| `validator.js` | Pure business rules (required fields, status, length limits). No I/O. |
| `httpHelpers.js` | HTTP plumbing: parse JSON body (400/413), send JSON replies. |
| `emailService.js` | Sends the offline notice to localhost:2525. |
| `uploadService.js` | Parses multipart, checks size/extension/MIME/magic bytes, stores privately. |
| `server.js` | Routes requests, calls the modules, emits events. |

## Task 2 – NDJSON persistence
`appendFile` writes one JSON object per line. `readAll()` treats a missing file (`ENOENT`) as an empty list and skips corrupt lines, so the server never crashes. Data survives restarts because it is in a file.

## Task 3 – Endpoints
| Request | Result |
|---|---|
| `GET /api/health` | 200 |
| `GET /api/items` | 200 `{items:[...]}` |
| `GET /api/items?status=lost` | 200 filtered; invalid status -> 400 |
| `GET /api/items/count[?status=]` | 200 `{status,count}` |
| `POST /api/items` | 201 created; 400 missing title / bad status / text too long / malformed JSON; 404 unknown attachmentId |
| any other path | 404 `{error:"Not found"}` |

Limits: title 100, category 50, location 100, contactName 60, description 500 chars.

## Task 4 – `item:created` event
`server.js` saves first (`await store.saveItem`) and only then calls `events.emit('item:created', item)`.
Listeners: (1) console message, (2) async audit line in `data/audit.log`, (3) email for found items.
**Why persistence comes before emit():** `emit()` is synchronous and does not wait for async listeners. If the event were emitted first, listeners could announce/audit/email an item that then fails to save. Saving first guarantees that every announcement refers to a real, stored item, and a failing listener (e.g. SMTP down) can never undo or block the save.

## Task 5 – Offline email for found items
When `status === "found"`, `emailService.sendFoundNotice` sends to the local receiver on `127.0.0.1:2525` (no auth/TLS, localhost only, never exposed). If SMTP is stopped, the API logs `[MAIL WARNING]` and still returns 201.

## Task 6 – Private evidence upload
`POST /api/attachments` (multipart, field `attachment`):
2 MB limit; allowed `.pdf .png .jpg .jpeg`; extension, MIME type and magic bytes must all match; rejected files are deleted. The file is stored as `uploads/<uuid>.<ext>` and the response contains only metadata (`attachmentId, originalName, mimeType, size`) – no filesystem path and no download route.
Codes: 201 ok, 400 wrong type / fake content / missing field, 413 too large, 415 not multipart.
**Linking to a record:** the client sends `"attachmentId": "<uuid>"` in `POST /api/items`; the server validates the UUID format and checks the file exists (404 otherwise), then stores the ID in the item record.

## Task 7 – Postman
Import `postman/Lost_Found.postman_collection.json` (18 requests, test scripts on every request, variable `baseUrl`). For requests 12, 13, 15 choose a file in Body > form-data > `attachment`.

## Task 8 – Demo checklist
1. `npm start` and `npm run smtp` in two terminals.
2. POST valid item -> **201**.
3. Open `data/items.ndjson` -> new line appears.
4. `GET /api/items` -> item listed.
5. Ctrl+C, `npm start` again, `GET /api/items` -> item still there.
6. POST without title -> **400**.
7. POST a *found* item -> email text appears in the SMTP terminal.
8. Upload a PNG/PDF -> **201** metadata; file appears in `uploads/`.
