const names = ["Warehouse check", "Rider assignment", "Delivery confirmation"],
  steps = [...document.querySelectorAll("li")];
const logBox = document.querySelector("#log"),
  status = document.querySelector("#status"),
  button = document.querySelector("#start");
function log(s) {
  logBox.textContent += s + "\n";
}
function mark(i, state) {
  steps[i].className = state;
}
function finish(error) {
  button.disabled = false;
  status.textContent = error
    ? "Error: " + error.message
    : "Parcel delivered successfully!";
  log(error ? "STOPPED: " + error.message : "All stages completed in order.");
}
function callbackStage(i, failure, done) {
  setTimeout(() => {
    log(names[i] + " started.");
    if (failure === ["warehouse", "rider"][i]) {
      mark(i, "failed");
      done(new Error(names[i] + " failed."));
      return;
    }
    mark(i, "done");
    done(null);
  }, 900);
}
function runCallbacks(f) {
  callbackStage(0, f, (e) => {
    if (e) return finish(e);
    callbackStage(1, f, (e2) => {
      if (e2) return finish(e2);
      callbackStage(2, f, (e3) => finish(e3));
    });
  });
}
function stage(i, f) {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      log(names[i] + " started.");
      if (f === ["warehouse", "rider"][i]) {
        mark(i, "failed");
        reject(new Error(names[i] + " failed."));
      } else {
        mark(i, "done");
        resolve();
      }
    }, 900),
  );
}
function runPromises(f) {
  stage(0, f)
    .then(() => stage(1, f))
    .then(() => stage(2, f))
    .then(() => finish(null))
    .catch(finish);
}
async function runAsync(f) {
  try {
    await stage(0, f);
    await stage(1, f);
    await stage(2, f);
    finish(null);
  } catch (e) {
    finish(e);
  }
}
button.addEventListener("click", () => {
  button.disabled = true;
  steps.forEach((s) => (s.className = ""));
  logBox.textContent = "";
  status.textContent = "Delivery started...";
  const method = document.querySelector("#method").value,
    f = document.querySelector("#failure").value;
  if (method === "callback") runCallbacks(f);
  if (method === "promise") runPromises(f);
  if (method === "async") runAsync(f);
});
