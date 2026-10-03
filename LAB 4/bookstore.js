// Task 1 - Model the Catalog and Orders

// var example
var storeName = "PageTurner Online Books";

// catalog
const books = [
  { id: 1, title: "Clean Code",                author: "Robert C. Martin",  price: 22.5, stock: 10, category: "Programming" },
  { id: 2, title: "The Pragmatic Programmer",  author: "Hunt & Thomas",     price: 28.0, stock: 4,  category: "Programming" },
  { id: 3, title: "JavaScript: The Good Parts",author: "Douglas Crockford", price: 18.0, stock: 3,  category: "Programming" },
  { id: 4, title: "Atomic Habits",             author: "James Clear",       price: 16.0, stock: 12, category: "Self-Help" },
  { id: 5, title: "Deep Work",                 author: "Cal Newport",       price: 15.0, stock: 2,  category: "Self-Help" },
  { id: 6, title: "Dune",                      author: "Frank Herbert",     price: 14.0, stock: 6,  category: "Fiction" },
  { id: 7, title: "1984",                      author: "George Orwell",     price: 10.0, stock: 1,  category: "Fiction" },
  { id: 8, title: "The Hobbit",                author: "J.R.R. Tolkien",    price: 12.0, stock: 8,  category: "Fiction" },
];

// incoming orders
const orders = [
  { orderId: 1, bookId: 1,  quantity: 2 },  
  { orderId: 2, bookId: 3,  quantity: 2 },  
  { orderId: 3, bookId: 99, quantity: 1 },  // book does not exist
  { orderId: 4, bookId: 5,  quantity: 5 },  // not enough stock
  { orderId: 5, bookId: 7,  quantity: 1 },  
  { orderId: 6, bookId: 4,  quantity: 0 },  // invalid quantity
  { orderId: 7, bookId: 2,  quantity: 1 },  
];

// order counter
let totalOrdersProcessed = 0;

console.log(`===== ${storeName} =====`);
console.log(`Catalog: ${books.length} books | Incoming orders: ${orders.length}\n`);

// Task 2 - Validate a Single Order

function validateOrder(order, catalog) {
  const book = catalog.find((b) => b.id === order.bookId);

  const bookExists = book !== undefined;
  const quantityValid = order.quantity > 0;
  const enoughStock = bookExists && book.stock >= order.quantity;
  const canFulfil = bookExists && quantityValid && enoughStock;

  let reason = "";
  if (!bookExists) {
    reason = "book not found";
  } else if (!quantityValid) {
    reason = "quantity must be greater than zero";
  } else if (!enoughStock) {
    reason = `only ${book.stock} in stock, ${order.quantity} requested`;
  }

  const message = canFulfil
    ? `Order #${order.orderId} can be fulfilled.`
    : `Order #${order.orderId} rejected: ${reason}.`;

  return { canFulfil, message, reason, book };
}

console.log("--- Task 2: Validate a single order ---");
console.log(validateOrder(orders[0], books).message);
console.log(validateOrder(orders[2], books).message);
console.log();

// Task 3 - Process a Batch of Orders

function processOrders(orderList, catalog) {
  const results = [];

  for (const order of orderList) {
    const { canFulfil, reason, book } = validateOrder(order, catalog);
    totalOrdersProcessed++;

    if (canFulfil) {
      book.stock -= order.quantity;
      results.push({
        orderId: order.orderId,
        title: book.title,
        status: "fulfilled",
        total: book.price * order.quantity,
      });
    } else {
      results.push({
        orderId: order.orderId,
        title: book ? book.title : "Unknown book",
        status: "rejected",
        total: 0,
        note: reason,
      });
    }
  }

  const report = results.map((r) =>
    r.status === "fulfilled"
      ? `Order #${r.orderId}: FULFILLED — ${r.title} ($${r.total.toFixed(2)})`
      : `Order #${r.orderId}: REJECTED  — ${r.note}`
  );

  const revenue = results
    .filter((r) => r.status === "fulfilled")
    .reduce((sum, r) => sum + r.total, 0);

  return { report, revenue };
}

console.log("--- Task 3: Process a batch of orders ---");
const { report, revenue } = processOrders(orders, books);
report.forEach((line) => console.log(line));
console.log(`Total revenue (fulfilled only): $${revenue.toFixed(2)}`);
console.log(`Orders processed: ${totalOrdersProcessed}\n`);

// Task 4 - Organize the System with a Class

class Book {
  constructor(id, title, author, price, stock, category) {
    this.id = id;
    this.title = title;
    this.author = author;
    this.price = price;
    this.stock = stock;
    this.category = category;
  }

  stockStatus() {
    return this.stock < 5 ? "Low stock" : "Stock OK";
  }
}

// Convert books into Book objects
const bookObjects = books.map(
  ({ id, title, author, price, stock, category }) =>
    new Book(id, title, author, price, stock, category)
);

function printConfirmation(order, book) {
  const { title, price } = book;
  const total = (price * order.quantity).toFixed(2);
  return `Order confirmed: ${order.quantity} x ${title} — $${total} total.`;
}

console.log("--- Task 4: Book class & confirmation ---");
bookObjects.forEach((b) => console.log(`${b.title}: ${b.stock} left → ${b.stockStatus()}`));

console.log(printConfirmation(orders[0], bookObjects[0]));
console.log();

// Task 5 - Low-Stock and Category Reporting

function lowStockReport(bookList, category, threshold) {
  return bookList
    .filter((b) => b.stock < threshold && b.category === category)
    .sort((a, b) => a.stock - b.stock);
}

function runReport(category, threshold) {
  console.log(`Report: category "${category}", stock below ${threshold}`);
  const result = lowStockReport(bookObjects, category, threshold);
  if (result.length === 0) {
    console.log("  (no books match)");
  }
  result.forEach((b) => console.log(`  ${b.title} — ${b.stock} left`));
}

console.log("--- Task 5: Low-stock & category reporting ---");
runReport("Programming", 5);
runReport("Fiction", 5);
runReport("Fiction", 7);
runReport("Programming", 10);