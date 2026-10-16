import { EVENT, SEATS, INITIAL_BOOKED } from "./data.js";
import {
  checkoutWithCallbacks,
  checkoutWithPromises,
  checkoutWithAsyncAwait,
} from "./flows.js";

// State belongs here; service functions in flows.js never edit the interface.
let booked = [...INITIAL_BOOKED];
let selected = [];
let running = false;
let mode = "callbacks";
let traceNumber = 0;

const $ = (selector) => document.querySelector(selector);
const seatGrid = $("#seatGrid");
const statusLine = $("#statusLine");
const priceLine = $("#priceLine");
const countLine = $("#countLine");
const trace = $("#trace");
const ticketCard = $("#ticketCard");
const modeButtons = [...document.querySelectorAll("[data-mode]")];
const stageCards = [...document.querySelectorAll("[data-stage]")];

const currency = (amount) => `Rs ${amount.toLocaleString("en-PK")}`;
const total = (ids) => ids.reduce((sum, id) => {
  const seat = SEATS.find((item) => item.id === id);
  return sum + (seat?.price ?? 0);
}, 0);

const MODE_INFO = {
  callbacks: {
    name: "Nested callbacks",
    summary: "Each next step is started from inside the previous callback.",
    code: `verifySeats(context, (error) => {\n  if (error) return handleError(error);\n  pay(context, (error) => {\n    if (error) return handleError(error);\n    issueTicket(context, (error, ticket) => {\n      if (error) return handleError(error);\n      showTicket(ticket);\n    });\n  });\n});`,
  },
  promises: {
    name: "Promise chain",
    summary: "Each .then() returns another Promise; .catch() receives an error.",
    code: `verifySeatsPromise(context)\n  .then(() => paymentPromise(context))\n  .then(() => issueTicketPromise(context))\n  .then((ticket) => showTicket(ticket))\n  .catch((error) => handleError(error));`,
  },
  async: {
    name: "Async / await",
    summary: "await pauses this async function until each Promise settles.",
    code: `async function book(context) {\n  try {\n    await verifySeatsPromise(context);\n    await paymentPromise(context);\n    const ticket = await issueTicketPromise(context);\n    showTicket(ticket);\n  } catch (error) {\n    handleError(error);\n  }\n}`,
  },
};

function writeTrace(message, type = "normal") {
  traceNumber += 1;
  const item = document.createElement("li");
  item.className = `trace-${type}`;
  const number = document.createElement("span");
  number.className = "trace-num";
  number.textContent = String(traceNumber).padStart(2, "0");
  const text = document.createElement("span");
  text.textContent = message;
  item.append(number, text);
  trace.appendChild(item);
  trace.scrollTop = trace.scrollHeight;
}

function announce(message, kind = "normal") {
  statusLine.textContent = message;
  statusLine.dataset.kind = kind;
}

function renderSeats() {
  seatGrid.replaceChildren();
  for (const seat of SEATS) {
    const isBooked = booked.includes(seat.id);
    const isSelected = selected.includes(seat.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "seat";
    if (isBooked) button.classList.add("is-booked");
    if (isSelected) button.classList.add("is-selected");
    button.textContent = seat.id;
    button.title = `${seat.id} — ${currency(seat.price)}${isBooked ? " — booked" : ""}`;
    button.setAttribute("aria-pressed", String(isSelected));
    button.setAttribute("aria-label", `${seat.id}, ${currency(seat.price)}, ${isBooked ? "booked" : isSelected ? "selected" : "available"}`);
    button.dataset.seatId = seat.id;
    button.disabled = isBooked || running;
    seatGrid.appendChild(button);
  }
}

function renderSummary() {
  countLine.textContent = `${selected.length} selected`;
  priceLine.textContent = currency(total(selected));
  const tags = $("#selectedTags");
  tags.replaceChildren();
  if (!selected.length) {
    const placeholder = document.createElement("span");
    placeholder.className = "muted";
    placeholder.textContent = "Select up to 4 available seats";
    tags.appendChild(placeholder);
  } else {
    for (const seat of selected) {
      const chip = document.createElement("span");
      chip.className = "seat-chip";
      chip.textContent = seat;
      tags.appendChild(chip);
    }
  }
  $("#bookedTotal").textContent = `${booked.length} / ${SEATS.length} reserved`;
  $("#confirmBtn").disabled = running || selected.length === 0;
  $("#autoPickBtn").disabled = running;
  $("#clearSelectionBtn").disabled = running || selected.length === 0;
  $("#failureSelect").disabled = running;
  $("#resetBtn").disabled = running;
  for (const button of modeButtons) button.disabled = running;
}

function render() {
  renderSeats();
  renderSummary();
}

// ES6 spread creates a new selection array instead of editing it in-place.
function toggleSeat(id) {
  if (running || booked.includes(id)) return;
  if (selected.includes(id)) selected = selected.filter((seat) => seat !== id);
  else if (selected.length < 4) selected = [...selected, id];
  else {
    announce("Maximum 4 seats per booking. Remove one first.", "warning");
    return;
  }
  ticketCard.hidden = true;
  announce("Your selection is ready. Choose an async style and book.");
  render();
}

// ES6 rest parameters collect an arbitrary number of seat IDs.
function selectGroup(...ids) {
  const additions = ids.filter((id) =>
    SEATS.some((seat) => seat.id === id) &&
    !booked.includes(id) && !selected.includes(id)
  );
  selected = [...selected, ...additions].slice(0, 4);
  ticketCard.hidden = true;
  announce("Group seats added using rest parameters and spread.");
  render();
}

function autoPickTwo() {
  const choices = SEATS
    .filter((seat) => !booked.includes(seat.id) && !selected.includes(seat.id))
    .slice(0, Math.max(0, 4 - selected.length))
    .slice(0, 2)
    .map((seat) => seat.id);
  if (!choices.length) {
    announce("No room to add more seats.", "warning");
    return;
  }
  selectGroup(...choices);
  writeTrace(`Quick pick added: ${choices.join(", ")}.`);
}

function resetStages() {
  for (const stage of stageCards) stage.dataset.status = "idle";
}

function stageLabel(id) {
  return { verify: "Seat verification", payment: "Payment", ticket: "Ticket creation" }[id];
}

const hooks = {
  start(id) {
    const card = stageCards.find((item) => item.dataset.stage === id);
    card.dataset.status = "running";
    writeTrace(`${stageLabel(id)} started...`);
  },
  done(id) {
    const card = stageCards.find((item) => item.dataset.stage === id);
    card.dataset.status = "done";
    writeTrace(`${stageLabel(id)} completed.`, "success");
  },
  fail(id, message) {
    const card = stageCards.find((item) => item.dataset.stage === id);
    card.dataset.status = "error";
    writeTrace(`${stageLabel(id)} failed: ${message}`, "error");
  },
};

function showTicket(ticket) {
  $("#ticketReference").textContent = ticket.reference;
  $("#ticketSeats").textContent = ticket.seats.join(" · ");
  $("#ticketTotal").textContent = currency(ticket.total);
  ticketCard.hidden = false;
}

function finish(error, ticket, snapshot) {
  running = false;
  if (error) {
    announce(error.message + " Your seats remain selected; try again.", "error");
    writeTrace("Checkout stopped; selection was not booked.", "error");
  } else {
    booked = [...booked, ...snapshot.ids];
    selected = [];
    showTicket(ticket);
    announce(`Booking successful. ${ticket.seats.length} seat(s) reserved.`, "success");
    writeTrace("Ticket visible. Only now are seats marked booked.", "success");
  }
  render();
}

function startBooking() {
  if (running || selected.length === 0) return;
  running = true;
  resetStages();
  trace.replaceChildren();
  traceNumber = 0;
  ticketCard.hidden = true;
  const snapshot = {
    ids: [...selected],
    booked: [...booked],
    total: total(selected),
    failAt: $("#failureSelect").value,
    eventTitle: EVENT.title,
  };
  announce("Booking in progress: follow the timeline below.");
  writeTrace(`User clicked Book: ${snapshot.ids.join(", ")}.`);
  writeTrace("Synchronous JavaScript finishes; the first timer is pending.");
  render();
  const done = (error, ticket) => finish(error, ticket, snapshot);
  if (mode === "callbacks") {
    checkoutWithCallbacks(snapshot, hooks, done);
  } else if (mode === "promises") {
    checkoutWithPromises(snapshot, hooks).then((ticket) => done(null, ticket)).catch((error) => done(error));
  } else {
    checkoutWithAsyncAwait(snapshot, hooks).then((ticket) => done(null, ticket)).catch((error) => done(error));
  }
}

function setMode(nextMode) {
  if (running || !MODE_INFO[nextMode]) return;
  mode = nextMode;
  for (const button of modeButtons) {
    const chosen = button.dataset.mode === nextMode;
    button.classList.toggle("active", chosen);
    button.setAttribute("aria-pressed", String(chosen));
  }
  const info = MODE_INFO[mode];
  $("#codeTitle").textContent = info.name;
  $("#codeDescription").textContent = info.summary;
  $("#codeSnippet").textContent = info.code;
  announce(`Mode: ${info.name}. Select seats and start the booking.`);
}

seatGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-seat-id]");
  if (button) toggleSeat(button.dataset.seatId);
});
for (const button of modeButtons) {
  button.addEventListener("click", () => setMode(button.dataset.mode));
}
$("#confirmBtn").addEventListener("click", startBooking);
$("#autoPickBtn").addEventListener("click", autoPickTwo);
$("#clearSelectionBtn").addEventListener("click", () => {
  selected = [];
  ticketCard.hidden = true;
  announce("Selection cleared.");
  render();
});
$("#resetBtn").addEventListener("click", () => {
  booked = [...INITIAL_BOOKED];
  selected = [];
  ticketCard.hidden = true;
  $("#failureSelect").value = "none";
  resetStages();
  trace.replaceChildren();
  traceNumber = 0;
  writeTrace("Demo reset. All temporary bookings are cleared.");
  announce("Demo reset. Choose seats to begin.");
  render();
});

$("#eventTitle").textContent = EVENT.title;
$("#eventSubtitle").textContent = EVENT.subtitle;
$("#eventDate").textContent = EVENT.date;
$("#eventTime").textContent = EVENT.time;
$("#eventVenue").textContent = EVENT.venue;
setMode("callbacks");
resetStages();
writeTrace("Ready. Select seats, predict what happens, then click Book.");
render();
