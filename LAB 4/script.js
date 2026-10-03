/*
//setting title
document.title = "Student Result Dashboard..";

// comments
/* comments */


/*
//hoisting
console.log(name);
//error
console.log(marks);
console.log(university)

var name = "Hassan";
let marks = 80;
const university = "Air University";

{
    console.log(name);
    var name = "abc";
}
console.log(marks);
console.log(name);
console.log(marks);




//Objects
const student = {
    id: 1,
    name: "Hassan",
    subject: "Full Stack WD",
    marks: 90
}

//Array of Objects
const students = [{
    name: "Ali",
    marks: 40
},
{
    name: "Fahad",
    marks: 80
}]

console.log(students[0].marks);


/*
//for in loop (used with objects)
for(const a in student){
    //prints key
    console.log(a);
    //prints key value
    console.log(student[a]);
}


//for of loop (used with arrays, strings, other iterable objects)
for(const b of students){
    for(const a in student){
        console.log(a);
        console.log(student[a]);
    }
}


class Studentss{
    constructor(id,name,subject,marks){
        this.id = id;
        this.name = name;
        this.subject = subject;
        this.marks = marks
    }

    getStatus(){
        return this.mark>= 50 ? "pass" : "fail";
    }
}

const student1 = new Studentss(1, "Hassan", "FSWD", 90);
student1.getStatus();
const {name, subject, marks,} = student1;

console.log("Hello " + name+ ", your marks are " + , marks)
*/





/* =========================================================
   STUDENT RESULT DASHBOARD
   Reference script for JavaScript Fundamentals (Lab 04)
   Every major concept is labelled with a comment so it can
   be traced back to the matching section of the lab manual.
   ========================================================= */

/* ---------------------------------------------------------
   1. VARIABLES & SYNTAX
   var / let / const, plus basic statement syntax.
   --------------------------------------------------------- */
const DASHBOARD_TITLE = "Student Result Dashboard"; // const: value never reassigned
let currentFilter = "all";                          // let: value changes over time
let searchTerm = "";
var sortAscending = true;                            // var: function/global scoped (shown for comparison)

/* ---------------------------------------------------------
   2. HOISTING
   var declarations are hoisted and initialised as undefined.
   let/const are hoisted too, but stay in the "temporal dead
   zone" until their declaration line runs.
   --------------------------------------------------------- */
console.log(hoistedVar); // undefined — declaration is hoisted, assignment is not
var hoistedVar = "I am hoisted";

// console.log(hoistedLet); // Would throw: Cannot access 'hoistedLet' before initialization
let hoistedLet = "I am only usable after this line";

/* ---------------------------------------------------------
   3. OBJECTS
   Plain data as an array of objects (this is the "database"
   for the whole dashboard).
   --------------------------------------------------------- */
const studentsData = [
  { id: 1, name: "Ayesha Khan",  subject: "Web Development", marks: 88 },
  { id: 2, name: "Bilal Ahmed",  subject: "Web Development", marks: 45 },
  { id: 3, name: "Sara Malik",   subject: "Web Development", marks: 72 },
  { id: 4, name: "Hamza Tariq",  subject: "Web Development", marks: 38 },
  { id: 5, name: "Zainab Riaz",  subject: "Web Development", marks: 95 },
  { id: 6, name: "Usman Ali",    subject: "Web Development", marks: 60 },
];

/* ---------------------------------------------------------
   4. ES6 CLASSES
   Wraps each plain object in a Student instance that carries
   its own behaviour (getStatus, getGrade).
   --------------------------------------------------------- */
class Student {
  constructor(id, name, subject, marks) {
    this.id = id;
    this.name = name;
    this.subject = subject;
    this.marks = marks;
  }

  // CONDITIONS + TERNARY OPERATOR
  getStatus() {
    return this.marks >= 50 ? "pass" : "fail"; // ternary operator
  }

  // CONDITIONS: if / else if / else
  getGrade() {
    if (this.marks >= 90) {
      return "A";
    } else if (this.marks >= 75) {
      return "B";
    } else if (this.marks >= 50) {
      return "C";
    } else {
      return "F";
    }
  }
}

/* ---------------------------------------------------------
   5. ARRAY METHODS — map()
   ARROW FUNCTIONS used throughout for compact syntax.
   Converts plain objects into Student class instances.
   --------------------------------------------------------- */
let studentList = studentsData.map(
  (s) => new Student(s.id, s.name, s.subject, s.marks)
);

/* ---------------------------------------------------------
   6. FOR...IN LOOP
   Iterates over an object's own property names — useful for
   logging or debugging a single record.
   --------------------------------------------------------- */
function logStudentDetails(student) {
  console.log(`--- Details for ${student.name} ---`);
  for (const key in student) {
    console.log(`${key}: ${student[key]}`);
  }
}
logStudentDetails(studentsData[0]);

/* ---------------------------------------------------------
   7. CLASSIC FOR LOOP
   Simple index-based loop, printed to the console.
   --------------------------------------------------------- */
for (let i = 0; i < studentList.length; i++) {
  console.log(`${i + 1}. ${studentList[i].name} — ${studentList[i].marks} marks`);
}

/* ---------------------------------------------------------
   8. FUNCTIONS: declaration, expression and arrow function
   --------------------------------------------------------- */

// Function declaration (hoisted, can be called before it is defined)
function formatMarks(marks) {
  return `${marks} / 100`;
}

// Function expression (not hoisted the same way)
const isTopScorer = function (student, highest) {
  return student.id === highest.id;
};

// Arrow function (short syntax, used heavily below)
const toPercentage = (marks) => `${marks}%`;

/* ---------------------------------------------------------
   9. ARRAY METHODS — reduce(), filter()
   OPERATORS: arithmetic (+ , /), comparison (>, >=)
   --------------------------------------------------------- */
function calculateSummary(list) {
  const total = list.reduce((sum, s) => sum + s.marks, 0);       // reduce: running total
  const average = list.length ? (total / list.length).toFixed(2) : "0.00";

  const highest = list.reduce(
    (max, s) => (s.marks > max.marks ? s : max),
    list[0] || { name: "-", marks: 0 }
  );

  const passCount = list.filter((s) => s.getStatus() === "pass").length; // filter
  const failCount = list.length - passCount;

  // Returned as an object so the caller can destructure it
  return { average, highest, passCount, failCount };
}

/* ---------------------------------------------------------
   10. DESTRUCTURING (objects) + TEMPLATE LITERALS
   --------------------------------------------------------- */
function renderSummary(list) {
  const summaryEl = document.getElementById("summary");
  const { average, highest, passCount, failCount } = calculateSummary(list); // destructuring

  summaryEl.innerHTML = `
    <div class="summary-box">Average: ${average}</div>
    <div class="summary-box">Top Scorer: ${highest.name} (${highest.marks})</div>
    <div class="summary-box">Passed: ${passCount}</div>
    <div class="summary-box">Failed: ${failCount}</div>
  `;
}

/* ---------------------------------------------------------
   11. CREATING A CARD
   Destructuring + template literals + ternary operator.
   --------------------------------------------------------- */
function createCard(student) {
  const { name, subject, marks } = student; // object destructuring
  const status = student.getStatus();
  const grade = student.getGrade();

  const card = document.createElement("div");
  card.className = `student-card ${status}`;
  card.innerHTML = `
    <h3>${name}</h3>
    <p>${subject}</p>
    <p class="marks">Marks: ${formatMarks(marks)}</p>
    <span class="badge ${status}">${status === "pass" ? "Pass" : "Fail"}</span>
    <span class="grade">Grade: ${grade} (${toPercentage(marks)})</span>
  `;
  return card;
}

/* ---------------------------------------------------------
   12. FOR...OF LOOP
   Iterates over array values (not indexes) to build the grid.
   --------------------------------------------------------- */
function renderCards(list) {
  const cardGrid = document.getElementById("cardGrid");
  cardGrid.innerHTML = "";

  for (const student of list) {
    const card = createCard(student);
    cardGrid.appendChild(card);
  }
}

/* ---------------------------------------------------------
   13. ARRAY METHODS — filter() combined with LOGICAL OPERATORS
   --------------------------------------------------------- */
function applyFilters() {
  let filtered = studentList;

  if (currentFilter === "pass") {
    filtered = filtered.filter((s) => s.getStatus() === "pass");
  } else if (currentFilter === "fail") {
    filtered = filtered.filter((s) => s.getStatus() === "fail");
  }

  // Logical AND (&&): only apply the search filter when there is a term
  if (searchTerm && searchTerm.length > 0) {
    filtered = filtered.filter((s) =>
      s.name.toLowerCase().includes(searchTerm)
    );
  }

  renderCards(filtered);
  renderSummary(filtered);
}

/* ---------------------------------------------------------
   14. ARRAY METHODS — forEach()
   Attaches a click listener to every filter button.
   --------------------------------------------------------- */
const filterButtons = document.querySelectorAll(".filter-btn");

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active")); // forEach again
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    applyFilters();
  });
});

/* ---------------------------------------------------------
   15. SEARCH INPUT — event handling with an arrow function
   --------------------------------------------------------- */
document.getElementById("searchInput").addEventListener("input", (e) => {
  searchTerm = e.target.value.toLowerCase();
  applyFilters();
});

/* ---------------------------------------------------------
   16. ARRAY METHODS — sort()
   Sorts a copy of the array using the spread operator so the
   original studentList order is never lost by accident.
   --------------------------------------------------------- */
document.getElementById("sortBtn").addEventListener("click", () => {
  studentList = [...studentList].sort((a, b) =>
    sortAscending ? a.marks - b.marks : b.marks - a.marks
  );
  sortAscending = !sortAscending; // logical NOT
  applyFilters();
});

/* ---------------------------------------------------------
   17. INITIAL RENDER
   --------------------------------------------------------- */
document.title = DASHBOARD_TITLE;
applyFilters();