document.addEventListener('DOMContentLoaded', () => {
    // Obtener referencias a los elementos
    const teacherAssignmentLink = document.getElementById('assignTeacher');
    const teacherWidget = document.getElementById('teacher-widget');

    // Función para ocultar todos los widgets
    function hideAllWidgets() {
        console.log('Ocultando todos los widgets');  // Depuración
        const widgets = document.querySelectorAll('.widget');
        widgets.forEach(widget => {
            widget.style.display = 'none';
        });
    }

    // Función para mostrar el widget de docentes
    function showTeacherWidget() {
        console.log('Mostrando el widget de docentes');  // Depuración
        hideAllWidgets();  // Ocultar los demás widgets primero
        if (teacherWidget) {
            teacherWidget.style.display = 'block';
            teacherWidget.style.zIndex = '10';  // Asegurar que el widget esté por encima de otros elementos
            console.log('Widget de docentes visible');  // Confirmación
        } else {
            console.error('No se encontró el widget de docentes');  // Error si no se encuentra el widget
        }
    }

    // Evento para mostrar el widget cuando se hace clic en el enlace de asignación de docentes
    if (teacherAssignmentLink) {
        teacherAssignmentLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Clic en enlace de asignación de docentes detectado');  // Depuración
            showTeacherWidget();  // Mostrar el widget de docentes
            fetchTeacherData();  // Cargar los datos de los docentes
        });
    } else {
        console.error('No se encontró el enlace de asignación de docentes');  // Error si no se encuentra el enlace
    }

    // Función para cargar los datos de los docentes desde el servidor
    function fetchTeacherData() {
        console.log('Cargando datos de docentes desde el servidor');  // Depuración
        fetch('/get-docentes/')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }
                return response.json();
            })
            .then(data => {
                console.log('Datos de docentes recibidos:', data);  // Depuración
                populateTeacherSelect(data);  // Poblar el select con los datos recibidos
            })
            .catch(error => console.error('Error al cargar los datos de docentes:', error));
    }

    // Función para poblar el select con los docentes
    function populateTeacherSelect(data) {
        const teacherSelect = document.getElementById('teacherSelect');
        if (!teacherSelect) {
            console.error('No se encontró el select de docentes');  // Error si no se encuentra el select
            return;
        }

        // Limpiar opciones anteriores
        teacherSelect.innerHTML = '';
        console.log('Select de docentes limpiado');  // Depuración

        // Agregar opciones nuevas
        data.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = `${teacher.nombre} ${teacher.apellido}`;
            teacherSelect.appendChild(option);
        });

        console.log('Select de docentes poblado con nuevos datos');  // Depuración
    }
});
