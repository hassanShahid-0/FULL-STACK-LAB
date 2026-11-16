import { seats, MAX_SELECTION } from "./seats-data.js";

let selected = [];

// Restore previously booked seats
const bookedSeats = JSON.parse(localStorage.getItem("bookedSeats") || "[]");

// Mark previously booked seats as sold
seats.forEach((seat) => {
  if (bookedSeats.includes(seat.id)) {
    seat.sold = true;
  }
});

const grid = document.querySelector("#seats");
const message = document.querySelector("#message");

const getSeat = (id) => seats.find((s) => s.id === id);

// Update selected seats and total price
function update() {
  const chosen = selected.map(getSeat);

  const names = chosen.map(({ id }) => id);

  const total = chosen.reduce((sum, { price }) => sum + price, 0);

  document.querySelector("#chosen").textContent =
    names.join(", ") || "No seats selected";

  document.querySelector("#total").textContent = total.toLocaleString();
}

// Display all seats
function render() {
  grid.innerHTML = "";

  seats.forEach(({ id, price, sold }) => {
    const b = document.createElement("button");

    b.className = "seat " + (selected.includes(id) ? "selected" : "");

    b.textContent = id + " - Rs." + price;

    b.disabled = sold;

    b.title = sold ? "Already booked" : "Available";

    b.addEventListener("click", () => toggle(id));

    grid.append(b);
  });

  update();
}

// Select or deselect a seat
function toggle(id) {
  const seat = getSeat(id);

  if (!seat || seat.sold) {
    message.textContent = "This seat is already booked.";
    return;
  }

  if (selected.includes(id)) {
    selected = selected.filter((x) => x !== id);

    message.textContent = "Seat removed.";
  } else if (selected.length >= MAX_SELECTION) {
    message.textContent = "Maximum four seats allowed.";
    return;
  } else {
    selected = [...selected, id];

    message.textContent = "Seat selected.";
  }

  render();
}

// Add group of two seats
document.querySelector("#group").addEventListener("click", () => {
  const group = seats
    .filter((s) => !s.sold && !selected.includes(s.id))
    .slice(0, 2);

  if (group.length > MAX_SELECTION - selected.length) {
    message.textContent = "Group would exceed four-seat limit.";
    return;
  }

  if (!group.length) {
    message.textContent = "No more seats available.";
    return;
  }

  selected = [...selected, ...group.map(({ id }) => id)];

  message.textContent = "Two seats added.";

  render();
});

// BOOK SELECTED SEATS
document.querySelector("#book").addEventListener("click", () => {
  // Check whether seats are selected
  if (selected.length === 0) {
    message.textContent = "Please select seats before booking.";
    return;
  }

  // Mark selected seats as sold
  selected.forEach((id) => {
    const seat = getSeat(id);

    if (seat && !seat.sold) {
      seat.sold = true;
    }
  });

  // Save booked seats in localStorage
  const allBooked = seats.filter((seat) => seat.sold).map((seat) => seat.id);

  localStorage.setItem("bookedSeats", JSON.stringify(allBooked));

  // Store booking information before clearing selection
  const booked = [...selected];

  // Clear selection
  selected = [];

  // Show confirmation
  message.textContent = "Successfully booked seats: " + booked.join(", ");

  // Refresh seat layout
  render();
});

// Remove all selected seats
document.querySelector("#clear").addEventListener("click", () => {
  selected = [];

  message.textContent = "Selection cleared.";

  render();
});

// Initial rendering
render();
