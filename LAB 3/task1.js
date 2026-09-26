// --- Element selection ---
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");
const errorMessage = document.getElementById("errorMessage");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");

// --- Task 1: Create a single task element ---
function createTaskElement(text) {
  const li = document.createElement("li");
  const span = document.createElement("span");
  const deleteBtn = document.createElement("button");

  span.textContent = text;
  deleteBtn.textContent = "Delete";
  deleteBtn.className = "delete-btn";

  li.appendChild(span);
  li.appendChild(deleteBtn);

  return li;
}

// --- Task 4: Live task counter + empty-state message ---
function updateTaskCount() {
  const total = taskList.children.length;

  if (total === 0) {
    taskCount.textContent = "No tasks yet.";
  } else {
    taskCount.textContent = `${total} task${total === 1 ? "" : "s"}`;
  }
}

// --- Task 1 + 5: Add a task, with validation ---
function addTask() {
  const value = taskInput.value.trim();

  // Task 5 — block empty/whitespace-only input
  if (value === "") {
    errorMessage.textContent = "Please type a task before adding it.";
    return;
  }

  errorMessage.textContent = "";

  const li = createTaskElement(value);
  taskList.appendChild(li);

  taskInput.value = "";
  taskInput.focus();

  updateTaskCount();
}

// --- Task 1: Add on click ---
addBtn.addEventListener("click", () => {
  addTask();
});

// --- Task 1: Add on Enter key ---
taskInput.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    addTask();
  }
});

// --- Task 5: clear the error as soon as the user starts typing again ---
taskInput.addEventListener("input", () => {
  errorMessage.textContent = "";
});

// --- Task 2 + 3: single delegated listener for the whole list ---
taskList.addEventListener("click", (event) => {
  const target = event.target;

  // Task 3 — delete (checked first so it doesn't also toggle "completed")
  if (target.classList.contains("delete-btn")) {
    target.closest("li").remove();
    updateTaskCount();
    return;
  }

  // Task 2 — toggle completed when the task text itself is clicked
  if (target.tagName === "SPAN") {
    target.closest("li").classList.toggle("completed");
  }
});

// --- Task 6: Clear Completed button ---
clearCompletedBtn.addEventListener("click", () => {
  const completedTasks = taskList.querySelectorAll("li.completed");

  completedTasks.forEach((li) => {
    li.remove();
  });

  updateTaskCount();
});

// --- Initial state on page load ---
updateTaskCount();