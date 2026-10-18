// asyncawait.js - async/await version using the same promise stages (Task 5)

async function registerWithAsync(ids, log) {
  try {
    log("Checking capacity...");
    await checkCapacityPromise(ids);
    log("Capacity OK");

    log("Waiting for approval...");
    var approval = await approvalPromise(ids);
    log("Approved by " + approval.approvedBy);

    log("Generating confirmation...");
    var confirmation = await confirmationPromise(ids);
    log("Confirmation ready: " + confirmation.reference);

    return { ids: ids, reference: confirmation.reference };
  } catch (err) {
    log("Registration stopped: " + err.message);
    throw err;
  }
}