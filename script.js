// ==========================================
// 1. HTML ELEMENTS
// ==========================================

const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");


// ==========================================
// 2. DATE FUNCTIONS
// ==========================================

function getToday() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDays(number) {
    return number === 1 ? "1 day" : `${number} days`;
}


// ==========================================
// 3. LOAD AND SAVE TASKS
// ==========================================

let tasks = [];

try {
    tasks = JSON.parse(localStorage.getItem("myTasks")) || [];
} catch (error) {
    tasks = [];
}

// Support previously saved tasks
tasks.forEach(task => {
    if (!Array.isArray(task.completedDates)) {
        task.completedDates = [];
    }

    if (!task.startDate) {
        const dates = [...task.completedDates].sort();
        task.startDate = dates.length ? dates[0] : getToday();
    }
});

function saveTasks() {
    localStorage.setItem("myTasks", JSON.stringify(tasks));
}


// ==========================================
// 4. STREAK CALCULATIONS
// ==========================================

function calculateMaxStreak(dates) {
    const sortedDates = [...new Set(dates)].sort();

    let max = 0;
    let count = 0;
    let previous = null;

    sortedDates.forEach(date => {
        const current = new Date(date + "T00:00:00Z");

        if (previous !== null) {
            const difference =
                (current - previous) / 86400000;

            count = difference === 1 ? count + 1 : 1;
        } else {
            count = 1;
        }

        max = Math.max(max, count);
        previous = current;
    });

    return max;
}

function calculateCurrentStreak(dates) {
    const completed = new Set(dates);
    const today = getToday();

    let date = new Date(today + "T00:00:00Z");

    // If today is incomplete, check yesterday
    if (!completed.has(today)) {
        date.setUTCDate(date.getUTCDate() - 1);

        const yesterday = date.toISOString().slice(0, 10);

        if (!completed.has(yesterday)) {
            return 0;
        }
    }

    let streak = 0;

    while (completed.has(date.toISOString().slice(0, 10))) {
        streak++;
        date.setUTCDate(date.getUTCDate() - 1);
    }

    return streak;
}


// ==========================================
// 5. ELEMENT CREATION
// ==========================================

function createElement(tag, className, text = "") {
    const element = document.createElement(tag);

    element.className = className;
    element.textContent = text;

    return element;
}


// ==========================================
// 6. INDIVIDUAL INTERACTIVE CALENDAR
// ==========================================

function renderCalendar(task, calendarContainer, monthDate, streakInfo, taskDiv) {

    calendarContainer.innerHTML = "";

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const today = getToday();

    // Calendar header
    const monthHeader = createElement("div", "calendar-header");

    const previousButton = createElement("button", "", "‹");
    previousButton.setAttribute("aria-label", "Previous month");

    const monthTitle = createElement(
        "strong",
        "",
        monthDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric"
        })
    );

    const nextButton = createElement("button", "", "›");
    nextButton.setAttribute("aria-label", "Next month");

    // Previous month
    previousButton.addEventListener("click", () => {
        renderCalendar(
            task,
            calendarContainer,
            new Date(year, month - 1, 1),
            streakInfo,
            taskDiv
        );
    });

    // Disable next month beyond current month
    const currentMonth = new Date();

    nextButton.disabled =
        year === currentMonth.getFullYear() &&
        month === currentMonth.getMonth();

    // Next month
    nextButton.addEventListener("click", () => {
        renderCalendar(
            task,
            calendarContainer,
            new Date(year, month + 1, 1),
            streakInfo,
            taskDiv
        );
    });

    monthHeader.append(
        previousButton,
        monthTitle,
        nextButton
    );

    calendarContainer.appendChild(monthHeader);


    // Calendar grid
    const grid = createElement("div", "calendar-grid");

    const weekdays = [
        "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
    ];

    weekdays.forEach(day => {
        grid.appendChild(
            createElement("div", "calendar-weekday", day)
        );
    });


    // Monday-first calendar
    const startingOffset = (firstDay.getDay() + 6) % 7;

    for (let i = 0; i < startingOffset; i++) {
        grid.appendChild(
            createElement("div", "calendar-empty")
        );
    }


    // Create individual dates
    for (let day = 1; day <= daysInMonth; day++) {

        const date = formatDate(new Date(year, month, day));

        const isCompleted = task.completedDates.includes(date);
        const isBeforeStart = date < task.startDate;
        const isFuture = date > today;

        const dayButton = createElement(
            "div",
            "calendar-day"
        );

        dayButton.textContent = isCompleted
            ? `${day} ✓`
            : String(day);

        if (isCompleted) {
            dayButton.classList.add("completed");
        }

        if (date === today) {
            dayButton.classList.add("today");
        }

        if (isBeforeStart || isFuture) {

            dayButton.classList.add("calendar-disabled");
            dayButton.title = "This date cannot be selected";

        } else {

            // Make valid dates clickable
            dayButton.style.cursor = "pointer";
            dayButton.setAttribute("role", "button");
            dayButton.setAttribute("tabindex", "0");

            function toggleCompletion() {

                const index = task.completedDates.indexOf(date);

                if (index !== -1) {
                    // Remove completion
                    task.completedDates.splice(index, 1);
                } else {
                    // Add completion
                    task.completedDates.push(date);
                }

                saveTasks();

                // Update individual task streaks
                const current = calculateCurrentStreak(
                    task.completedDates
                );

                const maximum = calculateMaxStreak(
                    task.completedDates
                );

                streakInfo.textContent =
                    `Current streak: ${formatDays(current)} | Max streak: ${formatDays(maximum)}`;

                // Synchronize today's checkbox if toggled in calendar
                if (taskDiv && date === today) {
                    const todayCheckbox = taskDiv.querySelector(".task-check input");
                    if (todayCheckbox) {
                        todayCheckbox.checked = task.completedDates.includes(today);
                    }
                }

                // Refresh calendar without closing it
                renderCalendar(
                    task,
                    calendarContainer,
                    monthDate,
                    streakInfo,
                    taskDiv
                );
            }

            dayButton.addEventListener("click", toggleCompletion);

            dayButton.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleCompletion();
                }
            });

            dayButton.title = isCompleted
                ? "Click to undo completion"
                : "Click to mark completed";
        }

        grid.appendChild(dayButton);
    }

    calendarContainer.appendChild(grid);


    // Starting date information
    const startInfo = createElement(
        "p",
        "calendar-start-info",
        `Tracking started: ${task.startDate}`
    );

    calendarContainer.appendChild(startInfo);
}


// ==========================================
// 7. DISPLAY TASKS
// ==========================================

function displayTasks() {

    taskList.innerHTML = "";

    tasks.forEach(task => {

        const today = getToday();

        // Calculate individual streaks
        const current = calculateCurrentStreak(
            task.completedDates
        );

        const maximum = calculateMaxStreak(
            task.completedDates
        );


        // Task card
        const taskDiv = createElement("div", "task-item");


        // Task name
        const title = createElement(
            "h3",
            "task-title",
            task.name
        );


        // Starting date
        const startInfo = createElement(
            "p",
            "task-start-date",
            `Started: ${task.startDate}`
        );


        // Daily completion checkbox
        const checkLabel = createElement(
            "label",
            "task-check",
            " Done today"
        );

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";

        checkbox.checked =
            task.completedDates.includes(today);

        checkbox.addEventListener("change", () => {

            if (checkbox.checked) {

                if (!task.completedDates.includes(today)) {
                    task.completedDates.push(today);
                }

            } else {

                task.completedDates =
                    task.completedDates.filter(
                        date => date !== today
                    );
            }

            saveTasks();
            displayTasks();
        });

        checkLabel.prepend(checkbox);


        // Date picker
        const dateInput = document.createElement("input");

        dateInput.type = "date";
        dateInput.min = task.startDate;
        dateInput.max = today;
        dateInput.value = today;


        // Mark date done button
        const markButton = createElement(
            "button",
            "mark-date-btn",
            "Mark date done"
        );

        markButton.addEventListener("click", () => {

            const selectedDate = dateInput.value;

            if (
                !selectedDate ||
                selectedDate < task.startDate ||
                selectedDate > today
            ) {
                alert("Please select a valid date between the start date and today.");
                return;
            }

            if (!task.completedDates.includes(selectedDate)) {
                task.completedDates.push(selectedDate);
            }

            saveTasks();
            displayTasks();
        });


        // Date actions row
        const dateActions = createElement(
            "div",
            "date-actions"
        );

        dateActions.append(dateInput, markButton);


        // Individual streak information
        const streakInfo = createElement(
            "p",
            "task-streak",
            `Current streak: ${formatDays(current)} | Max streak: ${formatDays(maximum)}`
        );


        // Calendar button
        const calendarButton = createElement(
            "button",
            "calendar-toggle",
            "View calendar"
        );


        // Calendar container
        const calendarContainer = createElement(
            "div",
            "task-calendar"
        );

        calendarContainer.hidden = true;


        // View / Hide calendar
        calendarButton.addEventListener("click", () => {

            calendarContainer.hidden =
                !calendarContainer.hidden;

            calendarButton.textContent =
                calendarContainer.hidden
                    ? "View calendar"
                    : "Hide calendar";

            if (!calendarContainer.hidden) {

                const currentMonth = new Date();

                // streakInfo and taskDiv are passed here
                renderCalendar(
                    task,
                    calendarContainer,
                    currentMonth,
                    streakInfo,
                    taskDiv
                );
            }
        });


        // Delete task
        const deleteButton = createElement(
            "button",
            "delete-task",
            "Delete"
        );

        deleteButton.addEventListener("click", () => {

            const confirmation = confirm(
                `Are you sure you want to delete "${task.name}"?`
            );

            if (!confirmation) return;

            tasks = tasks.filter(
                item => item.id !== task.id
            );

            saveTasks();
            displayTasks();
        });


        // Add everything to task card
        taskDiv.append(
            title,
            startInfo,
            checkLabel,
            dateActions,
            streakInfo,
            calendarButton,
            calendarContainer,
            deleteButton
        );

        taskList.appendChild(taskDiv);
    });
}


// ==========================================
// 8. ADD NEW TASK
// ==========================================

function addTask() {

    const taskName = taskInput.value.trim();

    if (taskName === "") {
        alert("Please enter a task!");
        return;
    }

    const newTask = {
        id: Date.now(),
        name: taskName,
        startDate: getToday(),
        completedDates: []
    };

    tasks.push(newTask);

    saveTasks();
    displayTasks();

    taskInput.value = "";
}


// ==========================================
// 9. EVENT LISTENERS
// ==========================================

addTaskBtn.addEventListener("click", addTask);

taskInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        addTask();
    }
});


// ==========================================
// 10. PROGRESSIVE WEB APP (SERVICE WORKER)
// ==========================================

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./service-worker.js", { scope: "./" })
            .then(registration => {
                console.log(
                    "Service Worker registered successfully with scope:",
                    registration.scope
                );
            })
            .catch(error => {
                console.warn("Service Worker registration failed:", error);
            });
    });
}


// ==========================================
// 11. INITIALIZE APPLICATION
// ==========================================

saveTasks();
displayTasks();
