# EventPass — Interactive JavaScript Async Lab

A small **browser-only** ticket booking simulation for teaching nested callbacks, Promises, and async/await. No real payment, backend, API, database, package installation, or Node.js is used.

## Run it

1. Extract the folder and open it in VS Code.
2. Start the **Live Server** extension on `index.html` (or any simple static file server).
3. In your browser, open Developer Tools to watch code and debug.

**Important:** ES Modules use `type="module"`, so most browsers will block imports when `index.html` is opened using `file://`. Use Live Server and its `http://127.0.0.1:5500/...` URL.

## 90-second tour

1. Select 1–4 available seats (or click **Quick-pick two**).
2. Choose **Callbacks**, **Promises**, or **Async / await**.
3. Select **Successful booking**, **Seat conflict**, or **Payment declined**.
4. Click **Book selected seats** and watch the three-stage booking pipeline and execution timeline.
5. Success creates a simulated e-ticket and marks seats booked; a failure preserves the selection without booking anything.
6. **Reset demo** returns every seat to its starting condition.

## Where students should look

- `js/data.js`: event details, seat prices, initially booked seats, and stage delays.
- `js/flows.js`: actual asynchronous functions in all three styles, with timers and error paths.
- `js/app.js`: seat selection, `...spread`, `...rest` in `selectGroup`, display updates, and trace messages.
- `index.html`: visible structure; `styles.css`: styling.

The compact code preview on the webpage demonstrates each **pattern**, not a literal line-for-line copy of `flows.js` (which contains the progress tracking and error hooks).

## Teaching sequence

Mini console example → student predicts result → run it → relate to booking pipeline → student makes a scenario-based change → test success and failure.

1. Callback: a function passed to another; demonstrate `setTimeout` ordering.
2. Nested callbacks: verify seats → payment → ticket. Stop on errors.
3. Promise chain: write sequential `.then()` steps and handle `.catch()`.
4. Async/await: read the same flow top-to-bottom inside `try/catch`.
5. Bonus: spot ES6 spread, rest parameters, and imports in the working application.

## Troubleshooting

- Blank screen: check you're using Live Server (not `file://`) and open browser Console.
- No booking action: select at least one available seat.
- No ticket: disable the failure simulation, or check the highlighted failed step.
- Already booked seat cannot be clicked: this is intentional; press Reset demo.
- Console error after modifying functions: check export/import names match and all braces are balanced.

## Integrity note

The app is a deterministic learning simulation using local timers. It **does not reserve real seats, contact a network, store data across refreshes, or charge payments**. It intentionally demonstrates asynchronous control flow before students learn APIs and servers.
