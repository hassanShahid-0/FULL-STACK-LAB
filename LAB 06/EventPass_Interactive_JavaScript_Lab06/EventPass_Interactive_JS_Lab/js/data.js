/** Data for a browser-only teaching simulation. Edit this file in the exercises. */
export const EVENT = {
  title: "Neon Nights Live",
  subtitle: "One night. One stage. Your front-row moment.",
  date: "Saturday, 14 November 2026",
  time: "7:30 PM",
  venue: "The Studio Arena",
};

const ROW_PRICES = { A: 1600, B: 1250, C: 900, D: 900 };

export const SEATS = Object.entries(ROW_PRICES).flatMap(([row, price]) =>
  Array.from({ length: 6 }, (_, index) => ({
    id: `${row}${index + 1}`,
    row,
    price,
  }))
);

// Seats already reserved before this demonstration starts.
export const INITIAL_BOOKED = ["A2", "B4", "C6"];

// Milliseconds. Change these in the 'Slow Connection' lab challenge.
export const DELAYS = { verify: 850, payment: 1000, ticket: 700 };
