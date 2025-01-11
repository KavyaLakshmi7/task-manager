// Task Constructor Function
function Task(name, isComplete = false) {
    this.name = name;
    this.isComplete = isComplete;
}

// Adding methods to the Task prototype
Task.prototype.markComplete = function() {
    this.isComplete = true;
};

Task.prototype.markIncomplete = function() {
    this.isComplete = false;
};

Task.prototype.deleteTask = function() {
    console.log(`Deleting task: ${this.name}`);
};

// Initialize tasks from localStorage or an empty array if not found
function loadTasks() {
    const storedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    return storedTasks.map(task => new Task(task.name, task.isComplete)); // Ensure task is an instance of Task
}

// Create a Proxy to monitor and modify the tasks array
let tasks = loadTasks(); // Load tasks as instances of Task
let taskProxy = new Proxy(tasks, {
    get(target, prop) {
        return Reflect.get(...arguments);
    },
    set(target, prop, value) {
        if (target.some(task => task.name === value.name)) {
            alert(`Task "${value.name}" already exists. Cannot add it again.`);
            return true;
        }
        return Reflect.set(...arguments);
    },
    deleteProperty(target, prop) {
        return Reflect.deleteProperty(...arguments);
    }
});

// Function to save tasks
async function saveTasks(tasks) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                localStorage.setItem('tasks', JSON.stringify(tasks.map(task => ({ name: task.name, isComplete: task.isComplete }))));
                resolve('Tasks saved successfully');
            } catch (error) {
                reject('Error saving tasks');
            }
        }, 1000);
    });
}

// Fetch tasks
async function fetchTasks() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                const tasks = loadTasks(); // Ensure tasks are instances of Task
                resolve(tasks);
            } catch (error) {
                reject('Error fetching tasks');
            }
        }, 1000);
    });
}

// Add a task
async function addTask() {
    const taskInput = document.getElementById('taskInput');
    const taskDelay = document.getElementById('taskDelay').value;
    const taskName = taskInput.value;

    if (taskName) {
        const newTask = new Task(taskName);

        if (taskDelay === 'delayed') {
            setTimeout(async () => {
                taskProxy.push(newTask);
                try {
                    await saveTasks(taskProxy);
                    alert('Task Added');
                    taskInput.value = '';
                } catch (error) {
                    alert('Error: ' + error);
                }
            }, 2000);
        } else {
            taskProxy.push(newTask);
            try {
                await saveTasks(taskProxy);
                alert('Task Added');
                taskInput.value = '';
            } catch (error) {
                alert('Error: ' + error);
            }
        }
    } else {
        alert('Please enter a task!');
    }
}

// Delete a task
async function deleteTask() {
    const deleteInput = document.getElementById('deleteInput');
    const taskToDelete = deleteInput.value;

    if (taskToDelete) {
        const taskIndex = taskProxy.findIndex(task => task.name === taskToDelete);

        if (taskIndex > -1) {
            const task = taskProxy[taskIndex];

            if (!task.isComplete && !confirm(`The task "${task.name}" is incomplete. Do you want to delete it?`)) {
                return;
            }

            task.deleteTask();
            taskProxy.splice(taskIndex, 1); // Remove the task from the proxy

            try {
                await saveTasks(taskProxy); // Save updated tasks
                alert('Task Deleted');
                deleteInput.value = '';
            } catch (error) {
                alert('Error: ' + error);
            }
        } else {
            alert('Task not found!');
        }
    } else {
        alert('Please enter a task to delete!');
    }
}

// View tasks and display checkboxes
async function viewTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    try {
        const tasks = await fetchTasks();
        if (tasks.length > 0) {
            tasks.forEach((task, index) => {
                const listItem = document.createElement('li');
                listItem.textContent = `${task.name} - ${task.isComplete ? 'Complete' : 'Incomplete'}`;

                // Add a checkbox for incomplete tasks
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = task.isComplete;
                checkbox.dataset.index = index;  // Store index of the task in dataset

                // Handle checkbox change (mark task as complete/incomplete)
                checkbox.addEventListener('change', function() {
                    tasks[index].isComplete = checkbox.checked;  // Update task completion status
                });

                listItem.appendChild(checkbox);
                taskList.appendChild(listItem);
            });
            alert('Tasks fetched');
        } else {
            alert('No tasks available');
        }
    } catch (error) {
        alert('Error fetching tasks: ' + error);
    }
}

// Prevent fetching tasks twice
if (window.location.pathname.includes('view-tasks.html') && !window.viewTasksInvoked) {
    window.viewTasksInvoked = true;
    document.addEventListener('DOMContentLoaded', function () {
        console.log('Fetching tasks...');
        viewTasks();  // Fetch tasks only once
    });
}

// Save button to save changes made to task completion status
document.getElementById('saveTasksBtn').addEventListener('click', async function() {
    const taskList = document.getElementById('taskList').children;
    let updatedTasks = [];

    // Iterate through the task list and collect the updated tasks
    for (let i = 0; i < taskList.length; i++) {
        const checkbox = taskList[i].querySelector('input[type="checkbox"]');
        if (checkbox) {
            const taskIndex = checkbox.dataset.index;  // Get task index from data attribute
            const task = taskProxy[taskIndex];
            task.isComplete = checkbox.checked;  // Update task completion status
            updatedTasks.push(task);
        }
    }

    // Save the updated tasks to localStorage
    try {
        await saveTasks(updatedTasks);
        alert('Tasks saved successfully');
    } catch (error) {
        alert('Error saving tasks: ' + error);
    }
});

// Clear tasks
document.getElementById('clearTasksBtn').addEventListener('click', function() {
    if (confirm('Are you sure you want to clear all tasks?')) {
        localStorage.removeItem('tasks');
        alert('All tasks have been cleared.');
        taskProxy.length = 0;
        document.getElementById('taskList').innerHTML = '';
    }
});
