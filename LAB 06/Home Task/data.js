// data.js - workshop data and registration state (Task 1)

var workshops = [
  { id: "ui", name: "UI Design", fee: 500, capacity: 3, registered: 1 },
  { id: "frontend", name: "Frontend Basics", fee: 0, capacity: 5, registered: 2 },
  { id: "python", name: "Python Foundations", fee: 800, capacity: 2, registered: 2 }
];

// confirmed registrations are kept only in memory
var registrations = [];

// settings used by the simulated stages
var settings = {
  failApproval: false,
  confirmDelay: 1500
};

function findWorkshop(id) {
  return workshops.find(function (w) {
    return w.id === id;
  });
}

function availableSpaces(workshop) {
  return workshop.capacity - workshop.registered;
}

// returns an error message if the ids can not be registered, otherwise null
function capacityProblem(ids) {
  for (var i = 0; i < ids.length; i++) {
    var workshop = findWorkshop(ids[i]);
    if (!workshop) {
      return "Unknown workshop: " + ids[i];
    }
    if (availableSpaces(workshop) <= 0) {
      return workshop.name + " is full";
    }
  }
  return null;
}

var referenceCounter = 100;

function newReference() {
  referenceCounter++;
  return "WS-" + referenceCounter;
}

// called only after all stages succeeded
function recordRegistration(ids, reference) {
  ids.forEach(function (id) {
    findWorkshop(id).registered++;
  });
  registrations.push({ reference: reference, ids: ids });
}