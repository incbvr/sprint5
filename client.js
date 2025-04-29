document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const monthYearElement = document.getElementById('monthYear');
    const calendarBody = document.getElementById('calendar-body');
    const prevMonthButton = document.getElementById('prevMonth');
    const nextMonthButton = document.getElementById('nextMonth');
    const selectedDateDisplay = document.getElementById('selectedDateDisplay');
    const eventListElement = document.getElementById('eventList');
    const newEventTextElement = document.getElementById('newEventText');
    const addEventButton = document.getElementById('addEventButton');

    // --- State Variables ---
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let selectedDateString = null; // Format: 'YYYY-MM-DD'

    const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];

    // --- Event Storage (Handles arrays per date) ---
    function getEventsFromStorage() {
        const eventsJson = localStorage.getItem('calendarEvents');
        let events = {};
        if (eventsJson) {
            try {
                const parsed = JSON.parse(eventsJson);
                // Ensure each date maps to an array
                for (const date in parsed) {
                    if (Array.isArray(parsed[date])) {
                        events[date] = parsed[date];
                    } else if (typeof parsed[date] === 'string') {
                        // Handle legacy single string data if necessary (optional)
                        events[date] = [parsed[date]];
                    }
                }
            } catch (e) {
                console.error("Error parsing events from localStorage", e);
                // Potentially clear corrupted data: localStorage.removeItem('calendarEvents');
            }
        }
        return events; // e.g., { "2025-04-05": ["Meeting", "Lunch"], "2025-04-08": ["Workout"] }
    }

    function saveEventsToStorage(events) {
        // Clean up empty arrays before saving
        const cleanedEvents = {};
        for (const date in events) {
            if (events[date] && events[date].length > 0) {
                 cleanedEvents[date] = events[date];
            }
        }
        localStorage.setItem('calendarEvents', JSON.stringify(cleanedEvents));
    }

    let events = getEventsFromStorage(); // Load events on startup

    // --- Calendar Rendering ---
    function renderCalendar(month, year) {
        calendarBody.innerHTML = '';
        monthYearElement.textContent = `${monthNames[month]} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let date = 1;
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('tr');
            let cellsRenderedInRow = 0;

            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('td');
                cell.innerHTML = ''; // Clear cell content initially

                if (i === 0 && j < firstDayOfMonth) {
                    cell.classList.add('empty');
                } else if (date > daysInMonth) {
                    cell.classList.add('empty');
                } else {
                    // Date cell content
                    const dateNumSpan = document.createElement('span');
                    dateNumSpan.classList.add('date-number');
                    dateNumSpan.textContent = date;
                    cell.appendChild(dateNumSpan);

                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                    cell.dataset.date = dateStr;

                    // Check for events and add indicator (count)
                    const dayEvents = events[dateStr] || [];
                    if (dayEvents.length > 0) {
                        cell.classList.add('has-event');
                        const eventCountDiv = document.createElement('div');
                        eventCountDiv.classList.add('event-count-indicator');
                        eventCountDiv.textContent = `(${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''})`;
                        cell.appendChild(eventCountDiv);
                    }

                    if (dateStr === selectedDateString) {
                        cell.classList.add('selected');
                    }

                    cell.addEventListener('click', () => {
                        selectDate(cell, dateStr);
                    });

                    date++;
                    cellsRenderedInRow++;
                }
                row.appendChild(cell);
            }

            if (cellsRenderedInRow > 0 || i === 0) {
                 calendarBody.appendChild(row);
            } else {
                break;
            }
            if (date > daysInMonth) break;
        }
    }

    // --- Event Display & Management ---

    function displayEventsForDate(dateStr) {
        eventListElement.innerHTML = ''; // Clear current list
        const dayEvents = events[dateStr] || [];

        if (dayEvents.length === 0) {
            eventListElement.innerHTML = '<li>No events for this day.</li>';
        } else {
            dayEvents.forEach((eventText, index) => {
                const listItem = document.createElement('li');

                const textSpan = document.createElement('span');
                textSpan.textContent = eventText;
                listItem.appendChild(textSpan);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.classList.add('delete-event-btn'); // Add class for styling
                deleteButton.addEventListener('click', () => {
                    deleteSingleEvent(dateStr, index);
                });
                listItem.appendChild(deleteButton);

                eventListElement.appendChild(listItem);
            });
        }
    }

    function selectDate(cellElement, dateStr) {
        // Update visual selection
        const previouslySelected = calendarBody.querySelector('.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }
        cellElement.classList.add('selected');

        // Update state
        selectedDateString = dateStr;

        // Update UI
        selectedDateDisplay.textContent = dateStr;
        newEventTextElement.value = ''; // Clear input field
        addEventButton.disabled = false; // Enable adding event

        // Display events for the newly selected date
        displayEventsForDate(dateStr);
    }

    function addEvent() {
        if (!selectedDateString) return;

        const newEventDesc = newEventTextElement.value.trim();
        if (!newEventDesc) {
            alert("Please enter an event description.");
            return;
        }

        // Get current events for the day, ensuring it's an array
        const dayEvents = events[selectedDateString] || [];
        dayEvents.push(newEventDesc); // Add the new event
        events[selectedDateString] = dayEvents; // Update the main events object

        saveEventsToStorage(events);
        console.log(`Added event for ${selectedDateString}: ${newEventDesc}`);

        // Update UI
        displayEventsForDate(selectedDateString); // Refresh the list
        newEventTextElement.value = ''; // Clear input field
        renderCalendar(currentMonth, currentYear); // Re-render calendar to update indicator
    }

    function deleteSingleEvent(dateStr, indexToDelete) {
        if (!events[dateStr] || events[dateStr].length <= indexToDelete) {
             console.error("Event index out of bounds or date has no events.");
             return;
        }

        const deletedEvent = events[dateStr].splice(indexToDelete, 1); // Remove event at index
        console.log(`Deleted event "${deletedEvent[0]}" for ${dateStr}`);

        // If no events left for this date, remove the date key entirely (optional cleanup)
        if (events[dateStr].length === 0) {
            delete events[dateStr];
        }

        saveEventsToStorage(events);

        // Update UI
        displayEventsForDate(dateStr); // Refresh list for the selected date
        renderCalendar(currentMonth, currentYear); // Re-render calendar to update indicator
    }


    // --- Navigation ---
    prevMonthButton.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        selectedDateString = null;
        resetEventSection();
        renderCalendar(currentMonth, currentYear);
    });

    nextMonthButton.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        selectedDateString = null;
        resetEventSection();
        renderCalendar(currentMonth, currentYear);
    });

    function resetEventSection() {
        selectedDateDisplay.textContent = 'None';
        eventListElement.innerHTML = ''; // Clear the event list
        newEventTextElement.value = '';
        addEventButton.disabled = true; // Disable button until a date is selected
        const currentlySelectedCell = calendarBody.querySelector('.selected');
         if (currentlySelectedCell) {
            currentlySelectedCell.classList.remove('selected');
         }
    }

    // --- Initialization ---
    addEventButton.addEventListener('click', addEvent);
    renderCalendar(currentMonth, currentYear);
    resetEventSection(); // Initial UI state for event section

});
