// selection.js - selecting workshops with ES6 features (Task 2)

var MAX_SELECTION = 2;

// returns an object with the new selection and a message
function addToSelection(selected, id) {
  if (!findWorkshop(id)) {
    return { selection: selected, message: "Invalid workshop: " + id };
  }
  if (selected.includes(id)) {
    return { selection: selected, message: "Already selected: " + id };
  }
  if (selected.length >= MAX_SELECTION) {
    return { selection: selected, message: "You can select at most " + MAX_SELECTION + " workshops" };
  }
  // spread creates a new array instead of changing the old one
  return { selection: [...selected, id], message: "" };
}

function removeFromSelection(selected, id) {
  return selected.filter(function (item) {
    return item !== id;
  });
}

// rest parameter: accepts any number of workshop ids
function addMany(selected, ...ids) {
  var current = selected;
  var messages = [];
  ids.forEach(function (id) {
    var result = addToSelection(current, id);
    current = result.selection;
    if (result.message) {
      messages.push(result.message);
    }
  });
  return { selection: current, message: messages.join(", ") };
}

// rest parameter again: total fee of any number of workshops
function totalFee(...ids) {
  var total = 0;
  ids.forEach(function (id) {
    total += findWorkshop(id).fee;
  });
  return total;
}