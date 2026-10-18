// promises.js - promise version of the same stages (Task 5)

function checkCapacityPromise(ids) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      var problem = capacityProblem(ids);
      if (problem) {
        reject(new Error(problem));
      } else {
        resolve({ ids: ids });
      }
    }, 800);
  });
}

function approvalPromise(ids) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      if (settings.failApproval) {
        reject(new Error("Approval was declined by the registrar"));
      } else {
        resolve({ approvedBy: "Registrar Office" });
      }
    }, 1000);
  });
}

function confirmationPromise(ids) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve({ reference: newReference() });
    }, settings.confirmDelay);
  });
}

// promise chain, returns a promise
function registerWithPromises(ids, log) {
  log("Checking capacity...");
  return checkCapacityPromise(ids)
    .then(function () {
      log("Capacity OK");
      log("Waiting for approval...");
      return approvalPromise(ids);
    })
    .then(function (approval) {
      log("Approved by " + approval.approvedBy);
      log("Generating confirmation...");
      return confirmationPromise(ids);
    })
    .then(function (confirmation) {
      log("Confirmation ready: " + confirmation.reference);
      return { ids: ids, reference: confirmation.reference };
    })
    .catch(function (err) {
      log("Registration stopped: " + err.message);
      // pass the error on so the caller can show it
      throw err;
    });
}