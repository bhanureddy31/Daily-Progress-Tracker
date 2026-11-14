// ==========================================
// 1. HTML ELEMENTS
// ==========================================

const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");

const exportBackupBtn = document.getElementById("exportBackupBtn");
const importBackupBtn = document.getElementById("importBackupBtn");
const importFileInput = document.getElementById("importFileInput");
const statusMessage = document.getElementById("statusMessage");

const STORAGE_KEY = "myTasks";
let isDataCorrupted = false;
let corruptedRawData = null;
let statusTimeoutId = null;


// ==========================================
// 2. STATUS / NOTIFICATION SYSTEM
// ==========================================

function showStatus(message, type = "info", duration = 4000, action = null) {
    if (!statusMessage) return;

    if (statusTimeoutId) {
        clearTimeout(statusTimeoutId);
        statusTimeoutId = null;
    }

    statusMessage.className = `status-message ${type}`;
    statusMessage.innerHTML = "";

    const contentSpan = createElement("span", "status-content", message);
    statusMessage.appendChild(contentSpan);

    const actionsDiv = createElement("div", "status-actions");

    if (action && typeof action.handler === "function") {
        const actionBtn = createElement("button", "status-action-btn", action.label || "Action");
        actionBtn.type = "button";
        actionBtn.addEventListener("click", () => {
            action.handler();
        });
        actionsDiv.appendChild(actionBtn);
    }

    const closeBtn = createElement("button", "status-close-btn", "×");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Dismiss notification");
    closeBtn.addEventListener("click", () => {
        statusMessage.hidden = true;
    });
    actionsDiv.appendChild(closeBtn);

    statusMessage.appendChild(actionsDiv);
    statusMessage.hidden = false;

    if (duration > 0) {
        statusTimeoutId = setTimeout(() => {
            statusMessage.hidden = true;
            statusTimeoutId = null;
        }, duration);
    }
}


// ==========================================
// 3. DATE UTILITIES
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

function isValidDateString(str) {
    if (typeof str !== "string") return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;

    const [year, month, day] = str.split("-").map(Number);
    if (month < 1 || month > 12 || day < 1 || day > 31) return false;

    const testDate = new Date(year, month - 1, day);
    return (
        testDate.getFullYear() === year &&
        testDate.getMonth() === month - 1 &&
        testDate.getDate() === day
    );
}


// ==========================================
// 4. DATA VALIDATION & RELIABLE STORAGE
// ==========================================

function isStorageAvailable() {
    try {
        const testKey = "__dpt_storage_test__";
        window.localStorage.setItem(testKey, "1");
        window.localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}

function validateTaskRecord(task, index = 0) {
    if (!task || typeof task !== "object") {
        return { isValid: false, error: `Item at index ${index} is not a valid task object.` };
    }

    if (task.id === undefined || task.id === null || (typeof task.id !== "number" && typeof task.id !== "string") || String(task.id).trim() === "") {
        return { isValid: false, error: `Task at index ${index} is missing a valid 'id'.` };
    }

    if (typeof task.name !== "string" || task.name.trim() === "") {
        return { isValid: false, error: `Task at index ${index} must have a non-empty 'name'.` };
    }

    let startDate = task.startDate;
    if (!startDate || !isValidDateString(startDate)) {
        if (Array.isArray(task.completedDates) && task.completedDates.length > 0) {
            const sortedDates = [...task.completedDates].filter(isValidDateString).sort();
            startDate = sortedDates.length ? sortedDates[0] : getToday();
        } else {
            startDate = getToday();
        }
    }

    if (!Array.isArray(task.completedDates)) {
        return { isValid: false, error: `Task "${task.name}" must have a 'completedDates' array.` };
    }

    for (let j = 0; j < task.completedDates.length; j++) {
        if (!isValidDateString(task.completedDates[j])) {
            return {
                isValid: false,
                error: `Task "${task.name}" contains an invalid date format in completedDates: "${task.completedDates[j]}".`
            };
        }
    }

    const sanitizedCompleted = [...new Set(task.completedDates)].sort();

    return {
        isValid: true,
        task: {
            id: task.id,
            name: String(task.name).trim(),
            startDate: startDate,
            completedDates: sanitizedCompleted
        }
    };
}

function validateTasksArray(data) {
    if (!Array.isArray(data)) {
        return { isValid: false, error: "Stored data must be an array of tasks." };
    }

    const validatedTasks = [];

    for (let i = 0; i < data.length; i++) {
        const result = validateTaskRecord(data[i], i);
        if (!result.isValid) {
            return { isValid: false, error: result.error };
        }
        validatedTasks.push(result.task);
    }

    return { isValid: true, sanitized: validatedTasks };
}

function loadTasksFromStorage() {
    if (!isStorageAvailable()) {
        showStatus(
            "Browser storage is unavailable. Your tasks will not be saved between sessions.",
            "error",
            0
        );
        return [];
    }

    let rawData = null;

    try {
        rawData = window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        showStatus(
            "Error accessing local storage: " + (error.message || "Permission denied."),
            "error",
            0
        );
        return [];
    }

    if (rawData === null || rawData === undefined || rawData.trim() === "") {
        isDataCorrupted = false;
        corruptedRawData = null;
        return [];
    }

    let parsedData = null;

    try {
        parsedData = JSON.parse(rawData);
    } catch (parseError) {
        isDataCorrupted = true;
        corruptedRawData = rawData;
        console.error("Corrupted JSON in localStorage:", parseError);

        showStatus(
            "Warning: Existing stored data appears corrupted. Your data has NOT been overwritten or deleted.",
            "warning",
            0,
            {
                label: "Download Raw Data",
                handler: downloadCorruptedData
            }
        );
        return [];
    }

    const validation = validateTasksArray(parsedData);

    if (!validation.isValid) {
        isDataCorrupted = true;
        corruptedRawData = rawData;
        console.error("Task validation failed:", validation.error);

        showStatus(
            `Warning: Stored data contains invalid records (${validation.error}). Original data has been preserved.`,
            "warning",
            0,
            {
                label: "Download Raw Data",
                handler: downloadCorruptedData
            }
        );
        return [];
    }

    isDataCorrupted = false;
    corruptedRawData = null;
    return validation.sanitized;
}

function downloadCorruptedData() {
    if (!corruptedRawData) {
        showStatus("No raw corrupted data to download.", "info", 3000);
        return;
    }

    try {
        const blob = new Blob([corruptedRawData], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "daily-progress-tracker-corrupted-data.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showStatus("Corrupted raw data downloaded for recovery inspection.", "info", 4000);
    } catch (err) {
        alert("Failed to download raw data: " + err.message);
    }
}

function saveTasks() {
    if (!isStorageAvailable()) {
        showStatus("Cannot save tasks: Browser storage is disabled or blocked.", "error", 5000);
        return false;
    }

    if (isDataCorrupted && tasks.length === 0) {
        console.warn("Skipping automatic saveTasks to protect preserved corrupted raw data.");
        return false;
    }

    const validation = validateTasksArray(tasks);
    if (!validation.isValid) {
        showStatus(`Cannot save tasks: ${validation.error}`, "error", 5000);
        return false;
    }

    try {
        const serialized = JSON.stringify(validation.sanitized);
        window.localStorage.setItem(STORAGE_KEY, serialized);
        isDataCorrupted = false;
        corruptedRawData = null;
        return true;
    } catch (error) {
        if (
            error.name === "QuotaExceededError" ||
            error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
            error.code === 22 ||
            error.code === 1014
        ) {
            showStatus(
                "Storage quota exceeded! Unable to save tasks. Please export a backup or free up storage.",
                "error",
                0
            );
        } else {
            showStatus("Failed to save tasks to local storage: " + (error.message || "Unknown error."), "error", 5000);
        }
        return false;
    }
}


// ==========================================
// 5. STREAK CALCULATIONS
// ==========================================

function calculateMaxStreak(dates) {
    const sortedDates = [...new Set(dates)].sort();

    let max = 0;
    let count = 0;
    let previous = null;

    sortedDates.forEach(date => {
        const current = new Date(date + "T00:00:00Z");

        if (previous !== null) {
            const difference = (current - previous) / 86400000;
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
// 6. DOM HELPER
// ==========================================

function createElement(tag, className, text = "") {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
}


// ==========================================
// 7. ACCESSIBLE INTERACTIVE CALENDAR
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
    previousButton.type = "button";
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
    nextButton.type = "button";
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

    monthHeader.append(previousButton, monthTitle, nextButton);
    calendarContainer.appendChild(monthHeader);

    // Calendar grid
    const grid = createElement("div", "calendar-grid");

    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    weekdays.forEach(day => {
        grid.appendChild(createElement("div", "calendar-weekday", day));
    });

    // Monday-first calendar offset
    const startingOffset = (firstDay.getDay() + 6) % 7;
    for (let i = 0; i < startingOffset; i++) {
        const emptyCell = createElement("div", "calendar-empty");
        emptyCell.setAttribute("aria-hidden", "true");
        grid.appendChild(emptyCell);
    }

    // Individual calendar date buttons
    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const date = formatDate(dateObj);

        const isCompleted = task.completedDates.includes(date);
        const isBeforeStart = date < task.startDate;
        const isFuture = date > today;

        const dayButton = document.createElement("button");
        dayButton.type = "button";
        dayButton.className = "calendar-day";

        dayButton.textContent = isCompleted ? `${day} ✓` : String(day);

        if (isCompleted) {
            dayButton.classList.add("completed");
        }

        if (date === today) {
            dayButton.classList.add("today");
        }

        const readableDate = dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });

        if (isBeforeStart || isFuture) {
            dayButton.disabled = true;
            dayButton.classList.add("calendar-disabled");
            dayButton.setAttribute("aria-disabled", "true");

            const reason = isBeforeStart
                ? `Date before tracking started (${task.startDate})`
                : "Future date cannot be marked";

            dayButton.title = reason;
            dayButton.setAttribute("aria-label", `${readableDate} - ${reason}`);
        } else {
            dayButton.setAttribute("aria-pressed", isCompleted ? "true" : "false");
            dayButton.setAttribute(
                "aria-label",
                `${readableDate} - ${isCompleted ? "Completed. Click to undo" : "Incomplete. Click to mark completed"}`
            );
            dayButton.title = isCompleted ? "Click to undo completion" : "Click to mark completed";

            function toggleCompletion() {
                const index = task.completedDates.indexOf(date);

                if (index !== -1) {
                    task.completedDates.splice(index, 1);
                } else {
                    task.completedDates.push(date);
                }

                saveTasks();

                const current = calculateCurrentStreak(task.completedDates);
                const maximum = calculateMaxStreak(task.completedDates);

                streakInfo.textContent = `Current streak: ${formatDays(current)} | Max streak: ${formatDays(maximum)}`;

                if (taskDiv && date === today) {
                    const todayCheckbox = taskDiv.querySelector(".task-check input");
                    if (todayCheckbox) {
                        todayCheckbox.checked = task.completedDates.includes(today);
                    }
                }

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
        }

        grid.appendChild(dayButton);
    }

    calendarContainer.appendChild(grid);

    const startInfo = createElement(
        "p",
        "calendar-start-info",
        `Tracking started: ${task.startDate}`
    );
    calendarContainer.appendChild(startInfo);
}


// ==========================================
// 8. DISPLAY TASKS
// ==========================================

function displayTasks() {
    taskList.innerHTML = "";

    if (tasks.length === 0) {
        if (!isDataCorrupted) {
            const emptyMsg = createElement(
                "p",
                "calendar-start-info",
                "No tasks yet. Enter a task above to begin tracking your habits!"
            );
            emptyMsg.style.textAlign = "center";
            emptyMsg.style.padding = "20px 0";
            taskList.appendChild(emptyMsg);
        }
        return;
    }

    tasks.forEach(task => {
        const today = getToday();

        const current = calculateCurrentStreak(task.completedDates);
        const maximum = calculateMaxStreak(task.completedDates);

        const taskDiv = createElement("div", "task-item");

        const title = createElement("h3", "task-title", task.name);

        const startInfo = createElement(
            "p",
            "task-start-date",
            `Started: ${task.startDate}`
        );

        const checkLabel = createElement("label", "task-check", " Done today");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completedDates.includes(today);

        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                if (!task.completedDates.includes(today)) {
                    task.completedDates.push(today);
                }
            } else {
                task.completedDates = task.completedDates.filter(date => date !== today);
            }

            saveTasks();
            displayTasks();
        });

        checkLabel.prepend(checkbox);

        const dateInput = document.createElement("input");
        dateInput.type = "date";
        dateInput.min = task.startDate;
        dateInput.max = today;
        dateInput.value = today;
        dateInput.setAttribute("aria-label", `Select completion date for ${task.name}`);

        const markButton = createElement("button", "mark-date-btn", "Mark date done");
        markButton.type = "button";

        markButton.addEventListener("click", () => {
            const selectedDate = dateInput.value;

            if (!selectedDate || !isValidDateString(selectedDate) || selectedDate < task.startDate || selectedDate > today) {
                alert("Please select a valid date between the task start date and today.");
                return;
            }

            if (!task.completedDates.includes(selectedDate)) {
                task.completedDates.push(selectedDate);
            }

            saveTasks();
            displayTasks();
        });

        const dateActions = createElement("div", "date-actions");
        dateActions.append(dateInput, markButton);

        const streakInfo = createElement(
            "p",
            "task-streak",
            `Current streak: ${formatDays(current)} | Max streak: ${formatDays(maximum)}`
        );

        const calendarButton = createElement("button", "calendar-toggle", "View calendar");
        calendarButton.type = "button";

        const calendarContainer = createElement("div", "task-calendar");
        calendarContainer.hidden = true;

        calendarButton.addEventListener("click", () => {
            calendarContainer.hidden = !calendarContainer.hidden;
            calendarButton.textContent = calendarContainer.hidden ? "View calendar" : "Hide calendar";

            if (!calendarContainer.hidden) {
                const currentMonth = new Date();
                renderCalendar(
                    task,
                    calendarContainer,
                    currentMonth,
                    streakInfo,
                    taskDiv
                );
            }
        });

        const deleteButton = createElement("button", "delete-task", "Delete");
        deleteButton.type = "button";

        deleteButton.addEventListener("click", () => {
            const confirmation = confirm(`Are you sure you want to delete "${task.name}"?`);
            if (!confirmation) return;

            tasks = tasks.filter(item => item.id !== task.id);
            saveTasks();
            displayTasks();
            showStatus(`Task "${task.name}" deleted.`, "info", 3000);
        });

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
// 9. ADD NEW TASK
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

    const saved = saveTasks();
    if (saved) {
        displayTasks();
        taskInput.value = "";
        showStatus(`Task "${taskName}" added successfully.`, "success", 3000);
    }
}


// ==========================================
// 10. JSON EXPORT & IMPORT BACKUP
// ==========================================

function exportBackup() {
    if (tasks.length === 0) {
        const proceed = confirm("You currently have no tasks. Do you still want to export an empty backup file?");
        if (!proceed) return;
    }

    try {
        const backupData = {
            app: "Daily Progress Tracker",
            version: 1,
            exportDate: new Date().toISOString(),
            taskCount: tasks.length,
            tasks: tasks
        };

        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "daily-progress-tracker-backup.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showStatus(`Backup exported successfully (${tasks.length} task(s)).`, "success", 4000);
    } catch (error) {
        console.error("Export backup error:", error);
        showStatus("Failed to export backup: " + (error.message || "Unknown error"), "error", 5000);
    }
}

function handleImportFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const content = e.target.result;
            let parsed = null;

            try {
                parsed = JSON.parse(content);
            } catch (jsonErr) {
                showStatus("Import failed: The selected file is not a valid JSON document.", "error", 6000);
                importFileInput.value = "";
                return;
            }

            let incomingTasks = null;

            if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && Array.isArray(parsed.tasks)) {
                incomingTasks = parsed.tasks;
            } else if (Array.isArray(parsed)) {
                incomingTasks = parsed;
            } else {
                showStatus("Import failed: Incompatible backup format. File must contain a 'tasks' list or array.", "error", 6000);
                importFileInput.value = "";
                return;
            }

            const validation = validateTasksArray(incomingTasks);
            if (!validation.isValid) {
                showStatus(`Import rejected: ${validation.error} Existing tasks remain untouched.`, "error", 7000);
                importFileInput.value = "";
                return;
            }

            const confirmMessage = tasks.length > 0
                ? `Are you sure you want to import ${validation.sanitized.length} task(s)? This will replace your current ${tasks.length} task(s).`
                : `Are you sure you want to import ${validation.sanitized.length} task(s)?`;

            const proceed = confirm(confirmMessage);
            if (!proceed) {
                showStatus("Import cancelled. Your existing tasks remain unchanged.", "info", 4000);
                importFileInput.value = "";
                return;
            }

            const previousTasks = [...tasks];
            tasks = validation.sanitized;
            isDataCorrupted = false;
            corruptedRawData = null;

            const saved = saveTasks();
            if (saved) {
                displayTasks();
                showStatus(`Successfully imported ${tasks.length} task(s)!`, "success", 5000);
            } else {
                tasks = previousTasks;
                displayTasks();
                showStatus("Import aborted: Failed to write imported tasks to local storage. Original tasks retained.", "error", 7000);
            }
        } catch (err) {
            console.error("Import processing error:", err);
            showStatus("Import failed unexpectedly: " + err.message, "error", 6000);
        } finally {
            importFileInput.value = "";
        }
    };

    reader.onerror = function() {
        showStatus("Failed to read the backup file.", "error", 5000);
        importFileInput.value = "";
    };

    reader.readAsText(file);
}


// ==========================================
// 11. EVENT LISTENERS
// ==========================================

addTaskBtn.addEventListener("click", addTask);

taskInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        addTask();
    }
});

if (exportBackupBtn) {
    exportBackupBtn.addEventListener("click", exportBackup);
}

if (importBackupBtn && importFileInput) {
    importBackupBtn.addEventListener("click", () => {
        importFileInput.click();
    });

    importFileInput.addEventListener("change", handleImportFileSelect);
}


// ==========================================
// 12. PROGRESSIVE WEB APP (SERVICE WORKER)
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
// 13. INITIALIZE APPLICATION
// ==========================================

let tasks = loadTasksFromStorage();
displayTasks();
