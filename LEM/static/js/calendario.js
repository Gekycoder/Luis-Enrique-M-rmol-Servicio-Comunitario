document.addEventListener('DOMContentLoaded', function() {
    const daysTag = document.querySelector(".days"),
          currentDate = document.querySelector(".current-date"),
          prevNextIcon = document.querySelectorAll(".icons span");

    let date = new Date(),
        currYear = date.getFullYear(),
        currMonth = date.getMonth();

    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
                    "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const renderCalendar = (tasks = []) => {
        let firstDayofMonth = new Date(currYear, currMonth, 1).getDay(),
            lastDateofMonth = new Date(currYear, currMonth + 1, 0).getDate(),
            lastDayofMonth = new Date(currYear, currMonth, lastDateofMonth).getDay(),
            lastDateofLastMonth = new Date(currYear, currMonth, 0).getDate();
        let liTag = "";

        for (let i = firstDayofMonth; i > 0; i--) {
            liTag += `<li class="inactive">${lastDateofLastMonth - i + 1}</li>`;
        }

        for (let i = 1; i <= lastDateofMonth; i++) {
            let isToday = i === date.getDate() && currMonth === new Date().getMonth() 
                         && currYear === new Date().getFullYear() ? "active" : "";
            let task = tasks.find(task => new Date(task.fecha).getDate() === i - 1 && new Date(task.fecha).getMonth() === currMonth && new Date(task.fecha).getFullYear() === currYear);
            let taskClass = task ? (task.estado === 'Completada' ? 'completed' : 'pending') : '';
            let taskTitle = task ? ` title="${task.nombre} - ${task.estado}"` : '';
            liTag += `<li class="${isToday} ${taskClass}"${taskTitle}>${i}</li>`;
        }

        for (let i = lastDayofMonth; i < 6; i++) {
            liTag += `<li class="inactive">${i - lastDayofMonth + 1}</li>`;
        }
        currentDate.innerText = `${months[currMonth]} ${currYear}`;
        daysTag.innerHTML = liTag;
    }

    const fetchTasksAndRender = () => {
        fetch('/obtener-tareas/')
            .then(response => response.json())
            .then(data => {
                renderCalendar(data.tareas);
            });
    }

    prevNextIcon.forEach(icon => {
        icon.addEventListener("click", () => {
            currMonth = icon.id === "prev" ? currMonth - 1 : currMonth + 1;

            if(currMonth < 0 || currMonth > 11) {
                date = new Date(currYear, currMonth, new Date().getDate());
                currYear = date.getFullYear();
                currMonth = date.getMonth();
            } else {
                date = new Date();
            }
            fetchTasksAndRender();
        });
    });

    // Initial fetch to render calendar with tasks
    fetchTasksAndRender();

    // Export fetchTasksAndRender function to be called from other scripts
    window.fetchTasksAndRender = fetchTasksAndRender;
});