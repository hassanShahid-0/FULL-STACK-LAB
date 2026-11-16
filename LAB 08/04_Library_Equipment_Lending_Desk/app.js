const { readInventory, createLoan } = require("./inventory");
async function main() {
  const [command, id, qty] = process.argv.slice(2);
  try {
    if (!command || command === "list") {
      console.table(await readInventory());
      console.log("Loan: node app.js loan LAP-001 2");
      return;
    }
    if (command === "loan") {
      console.log("Loan saved:", await createLoan(id, Number(qty)));
      return;
    }
    console.log("Use: node app.js list OR node app.js loan ITEM_ID QUANTITY");
  } catch (e) {
    console.error("Error:", e.message);
    process.exitCode = 1;
  }
}
main();
