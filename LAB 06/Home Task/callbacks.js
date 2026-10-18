// callbacks.js - error-first callbacks and nested flow (Tasks 3 and 4)

// Task 3: delayed capacity check
function checkCapacityCb(ids, callback) {
  setTimeout(function () {
    var problem = capacityProblem(ids);
    if (problem) {
      callback(new Error(problem));
      return;
    }
    callback(null, { ids: ids });
  }, 800);
}

function approvalCb(ids, callback) {
  setTimeout(function () {
    if (settings.failApproval) {
      callback(new Error("Approval was declined by the registrar"));
      return;
    }
    callback(null, { approvedBy: "Registrar Office" });
  }, 1000);
}

function confirmationCb(ids, callback) {
  setTimeout(function () {
    callback(null, { reference: newReference() });
  }, settings.confirmDelay);
}

// Task 4: capacity -> approval -> confirmation, each stage inside the previous one
function registerWithCallbacks(ids, log, done) {
  log("Checking capacity...");
  checkCapacityCb(ids, function (err1, capacity) {
    if (err1) {
      log("Capacity check failed: " + err1.message);
      done(err1);
      return;
    }
    log("Capacity OK");
    log("Waiting for approval...");
    approvalCb(ids, function (err2, approval) {
      if (err2) {
        log("Approval failed: " + err2.message);
        done(err2);
        return;
      }
      log("Approved by " + approval.approvedBy);
      log("Generating confirmation...");
      confirmationCb(ids, function (err3, confirmation) {
        if (err3) {
          log("Confirmation failed: " + err3.message);
          done(err3);
          return;
        }
        log("Confirmation ready: " + confirmation.reference);
        done(null, { ids: ids, reference: confirmation.reference });
      });
    });
  });
}