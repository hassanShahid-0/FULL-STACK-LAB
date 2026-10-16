/**
 * Same three simulated operations, expressed in three different async styles.
 * They do not contact a server or charge actual money.
 */
import { DELAYS } from "./data.js";

// --- Low-level callback services ---
export function verifySeatsCallback(context, callback) {
  setTimeout(() => {
    if (context.failAt === "verify") {
      callback(new Error("Seat conflict: another visitor reserved a seat first."));
      return;
    }
    const taken = context.ids.find((id) => context.booked.includes(id));
    if (taken) {
      callback(new Error(`${taken} has already been reserved.`));
      return;
    }
    callback(null, { valid: true });
  }, DELAYS.verify);
}

export function paymentCallback(context, callback) {
  setTimeout(() => {
    if (context.failAt === "payment") {
      callback(new Error("Payment declined. No seats have been booked."));
      return;
    }
    callback(null, { paymentId: "DEMO-PAID" });
  }, DELAYS.payment);
}

export function issueTicketCallback(context, callback) {
  setTimeout(() => {
    callback(null, {
      reference: `EVT-${String(Date.now()).slice(-6)}`,
      seats: [...context.ids],
      total: context.total,
      event: context.eventTitle,
    });
  }, DELAYS.ticket);
}

// 1. Nested callbacks: step 2 lives inside the callback for step 1.
export function checkoutWithCallbacks(context, hooks, finished) {
  hooks.start("verify");
  verifySeatsCallback(context, (verifyError) => {
    if (verifyError) {
      hooks.fail("verify", verifyError.message);
      finished(verifyError);
      return;
    }
    hooks.done("verify");
    hooks.start("payment");
    paymentCallback(context, (paymentError) => {
      if (paymentError) {
        hooks.fail("payment", paymentError.message);
        finished(paymentError);
        return;
      }
      hooks.done("payment");
      hooks.start("ticket");
      issueTicketCallback(context, (ticketError, ticket) => {
        if (ticketError) {
          hooks.fail("ticket", ticketError.message);
          finished(ticketError);
          return;
        }
        hooks.done("ticket");
        finished(null, ticket);
      });
    });
  });
}

// --- Promise wrappers: turn each callback service into a Promise. ---
function fromCallback(callService, context) {
  return new Promise((resolve, reject) => {
    callService(context, (error, value) => {
      if (error) reject(error);
      else resolve(value);
    });
  });
}

export const verifySeatsPromise = (context) =>
  fromCallback(verifySeatsCallback, context);
export const paymentPromise = (context) =>
  fromCallback(paymentCallback, context);
export const issueTicketPromise = (context) =>
  fromCallback(issueTicketCallback, context);

function tracked(stageName, operation, hooks) {
  hooks.start(stageName);
  return operation().then(
    (result) => {
      hooks.done(stageName);
      return result;
    },
    (error) => {
      hooks.fail(stageName, error.message);
      throw error;
    }
  );
}

// 2. A Promise chain: each .then() returns the next asynchronous task.
export function checkoutWithPromises(context, hooks) {
  return tracked("verify", () => verifySeatsPromise(context), hooks)
    .then(() => tracked("payment", () => paymentPromise(context), hooks))
    .then(() => tracked("ticket", () => issueTicketPromise(context), hooks));
}

// 3. async / await: the same Promise-based operations, sequentially.
export async function checkoutWithAsyncAwait(context, hooks) {
  await tracked("verify", () => verifySeatsPromise(context), hooks);
  await tracked("payment", () => paymentPromise(context), hooks);
  const ticket = await tracked("ticket", () => issueTicketPromise(context), hooks);
  return ticket;
}
