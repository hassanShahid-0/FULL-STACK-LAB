// app.js - page logic, DOM updates and demonstrations (Tasks 1, 2 and 6)

var selected = [];
var busy = false;

var workshopList = document.getElementById("workshopList");
var summary = document.getElementById("summary");
var selectionMessage = document.getElementById("selectionMessage");
var statusBox = document.getElementById("status");
var logList = document.getElementById("log");
var registrationList = document.getElementById("registrations");

// Task 1: show workshop cards (destructuring + template literals)
function renderWorkshops() {
  workshopList.innerHTML = "";
  workshops.forEach(function (workshop) {
    var { id, name, fee, capacity } = workshop;
    var spaces = availableSpaces(workshop);
    var card = document.createElement("div");
    card.className = "card";
    if (spaces <= 0) card.className += " full";
    if (selected.includes(id)) card.className += " selected";
    card.innerHTML = `
      <strong>${name}</strong><br>
      Fee: ${fee === 0 ? "Free" : "Rs. " + fee}<br>
      Available spaces: ${spaces} of ${capacity}${spaces <= 0 ? " (FULL)" : ""}<br>
    `;
    var button = document.createElement("button");
    button.textContent = selected.includes(id) ? "Remove" : "Select";
    button.onclick = function () {
      toggleSelect(id);
    };
    card.appendChild(button);
    workshopList.appendChild(card);
  });
}

function renderSummary() {
  if (selected.length === 0) {
    summary.textContent = "Nothing selected.";
    return;
  }
  var names = selected.map(function (id) {
    return findWorkshop(id).name;
  });
  summary.textContent = `Selected (${selected.length}/${MAX_SELECTION}): ${names.join(", ")} | Total fee: Rs. ${totalFee(...selected)}`;
}

function renderRegistrations() {
  registrationList.innerHTML = "";
  if (registrations.length === 0) {
    registrationList.innerHTML = "<li>None yet</li>";
    return;
  }
  registrations.forEach(function (r) {
    var names = r.ids.map(function (id) {
      return findWorkshop(id).name;
    });
    var li = document.createElement("li");
    li.textContent = `${r.reference}: ${names.join(", ")}`;
    registrationList.appendChild(li);
  });
}

function refresh() {
  renderWorkshops();
  renderSummary();
  renderRegistrations();
}

function toggleSelect(id) {
  if (busy) return;
  if (selected.includes(id)) {
    selected = removeFromSelection(selected, id);
    selectionMessage.textContent = "";
  } else {
    var result = addToSelection(selected, id);
    selected = result.selection;
    selectionMessage.textContent = result.message;
  }
  refresh();
}

function log(text) {
  var li = document.createElement("li");
  var time = new Date().toLocaleTimeString();
  li.textContent = `[${time}] ${text}`;
  logList.appendChild(li);
}

function setStatus(text, isError) {
  statusBox.textContent = text;
  statusBox.className = isError ? "error" : "ok";
}

function readSettings() {
  settings.failApproval = document.getElementById("failApproval").checked;
  settings.confirmDelay = Number(document.getElementById("confirmDelay").value) || 0;
}

function setBusy(value) {
  busy = value;
  var buttons = document.querySelectorAll("button");
  buttons.forEach(function (b) {
    b.disabled = value;
  });
}

function onSuccess(result) {
  // the registration is saved only here, after every stage succeeded
  recordRegistration(result.ids, result.reference);
  selected = [];
  setStatus("Registration confirmed. Reference: " + result.reference, false);
  setBusy(false);
  refresh();
}

function onFailure(err) {
  setStatus("Registration failed: " + err.message, true);
  setBusy(false);
  refresh();
}

function startRegistration() {
  if (busy) return;
  if (selected.length === 0) {
    setStatus("Select at least one workshop first", true);
    return;
  }
  readSettings();
  logList.innerHTML = "";
  setStatus("Registering, please wait...", false);
  setBusy(true);

  var ids = [...selected];
  var method = document.getElementById("method").value;
  log("Method: " + method);

  if (method === "callbacks") {
    registerWithCallbacks(ids, log, function (err, result) {
      if (err) onFailure(err);
      else onSuccess(result);
    });
  } else if (method === "promises") {
    registerWithPromises(ids, log).then(onSuccess).catch(onFailure);
  } else {
    registerWithAsync(ids, log).then(onSuccess).catch(onFailure);
  }
}

// Task 6: demonstrations
function setOptions(failApproval, delay) {
  document.getElementById("failApproval").checked = failApproval;
  document.getElementById("confirmDelay").value = delay;
}

function runDemo(id, failApproval, delay) {
  if (busy) return;
  selected = [];
  selected = addMany(selected, id).selection;
  setOptions(failApproval, delay);
  refresh();
  startRegistration();
}

document.getElementById("registerBtn").onclick = startRegistration;
document.getElementById("clearBtn").onclick = function () {
  if (busy) return;
  selected = [];
  selectionMessage.textContent = "";
  refresh();
};

document.getElementById("demoSuccess").onclick = function () {
  runDemo("ui", false, 1500);
};
document.getElementById("demoFull").onclick = function () {
  runDemo("python", false, 1500);
};
document.getElementById("demoApproval").onclick = function () {
  runDemo("frontend", true, 1500);
};
document.getElementById("demoDelay").onclick = function () {
  runDemo("frontend", false, 4000);
};

// runs both versions on the same input (no saving) and compares the outcome
document.getElementById("demoCompare").onclick = async function () {
  if (busy) return;
  setBusy(true);
  logList.innerHTML = "";
  var cases = [
    { label: "available workshop", ids: ["frontend"], fail: false },
    { label: "full workshop", ids: ["python"], fail: false },
    { label: "approval failure", ids: ["ui"], fail: true }
  ];
  for (var c of cases) {
    settings.failApproval = c.fail;
    settings.confirmDelay = 300;
    var outcomes = [];
    for (var fn of [registerWithPromises, registerWithAsync]) {
      try {
        await fn(c.ids, function () {});
        outcomes.push("success");
      } catch (err) {
        outcomes.push("error: " + err.message);
      }
    }
    var same = outcomes[0] === outcomes[1];
    log(`${c.label}: promise = ${outcomes[0]} | async = ${outcomes[1]} -> ${same ? "SAME" : "DIFFERENT"}`);
  }
  readSettings();
  setStatus("Comparison finished (nothing was saved)", false);
  setBusy(false);
};

refresh();