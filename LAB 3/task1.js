console.log("Connected to script.js");
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");
const errorMessage = document.getElementById("errorMessage");

const value = taskInput.value;
console.log(value);

<li>
  <span>Java Script</span>
  <button>Delete</button>
</li>;

function createTaskElement(text) {
  const li = document.createElement("li");
  const span = document.createElement("span");
  const deletebtn = document.createElement("button");

  span.textContent = text;
  deletebtn.textContent = "Delete";
  deletebtn.className = "delete-btn";

  li.appendChild(span);
  li.appendChild(deletebtn);

  return li;
}

const li = createTaskElement("Java Script");
taskList.appendChild(li);

addBtn.addEventListener("click", () => {
  addTask();
});
taskInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    addTask();
  }
});

//add or remove css elements
//element.classList
li.addEventListener("click", () => {
  li.classList.toggle("completed");
});
