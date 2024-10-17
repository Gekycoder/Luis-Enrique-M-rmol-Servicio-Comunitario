const teacherAssignmentLink = document.getElementById('assignTeacher');
const teacherWidget = document.getElementById('teacher-widget');

if (teacherWidget) teacherWidget.style.display = 'none';

// Mostrar el widget de docentes
const showTeacherWidget = () => {
    hideAllWidgets(); // Ahora utiliza la función desde main.js
    if (teacherWidget) teacherWidget.style.display = 'block';
    fetchTeacherData(); // Cargar los datos de los docentes
};

// Evento para mostrar el widget de docentes al hacer clic en el enlace correspondiente
if (teacherAssignmentLink) {
    teacherAssignmentLink.addEventListener('click', (e) => {
        e.preventDefault();
        showTeacherWidget();
    });
}

// **Función para cargar los datos de los docentes desde el servidor**
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
            populateTeacherTable(data.docentes);  // Poblar la tabla con los datos recibidos
        })
        .catch(error => console.error('Error al cargar los datos de docentes:', error));
}

// **Función para poblar la tabla con los docentes**
function populateTeacherTable(docentes) {
    const teacherTableBody = document.getElementById('teacherTable').querySelector('tbody');
    if (!teacherTableBody) {
        console.error('No se encontró el cuerpo de la tabla de docentes');
        return;
    }

    // Limpiar la tabla antes de poblarla
    teacherTableBody.innerHTML = '';

    const grados = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
    const secciones = ['A', 'B', 'U'];

    // **Definir el mapeo de grados**
    const gradeMapping = {
        'IV': '1º',
        'V': '2º',
        'VI': '3º',
        'VII': '4º',
        'VIII': '5º',
        'IX': '6º',
    };

    // **Agregar filas con los datos de los docentes**
    docentes.forEach(teacher => {
        const selectedGrade = teacher.grado || ''; // Grado asignado
        const selectedSection = teacher.seccion || ''; // Sección asignada

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${teacher.id}</td>
            <td>${teacher.nombres}</td>
            <td>${teacher.apellidos}</td>
            <td>
                <select class="grade-select" data-docente-id="${teacher.id}">
                    <option value="">Seleccione un grado</option>
                    ${grados.map(grado => {
                        const gradoMostrado = gradeMapping[grado] || grado;
                        const isSelected = grado === selectedGrade ? 'selected' : '';
                        return `<option value="${grado}" ${isSelected}>${gradoMostrado}</option>`;
                    }).join('')}
                    
                </select>
            </td>
            <td>
                <select class="section-select" data-docente-id="${teacher.id}">
                    <option value="">Seleccione una sección</option>
                    ${secciones.map(seccion => `<option value="${seccion}" ${seccion === selectedSection ? 'selected' : ''}>${seccion}</option>`).join('')}
                </select>
            </td>
            <td>
                <button class="assign-grade" data-docente-id="${teacher.id}">Asignar</button>
            </td>
        `;
        teacherTableBody.appendChild(row);
    });

    console.log('Tabla de docentes poblada con nuevos datos');
}

// **Evento para asignar grado y sección al docente**
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('assign-grade')) {
        const docenteId = event.target.dataset.docenteId;
        const selectedGrade = document.querySelector(`.grade-select[data-docente-id="${docenteId}"]`).value;
        const selectedSection = document.querySelector(`.section-select[data-docente-id="${docenteId}"]`).value;

        console.log(`Asignando grado ${selectedGrade} y sección ${selectedSection} al docente ${docenteId}`);  // Depuración

        fetch('/asignar-docente/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('input[name="csrfmiddlewaretoken"]').value
            },
            body: JSON.stringify({
                docente_id: docenteId,
                grado: selectedGrade,
                seccion: selectedSection
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Respuesta del servidor:", data);  // Depuración
            if (data.success) {
                alert('Docente asignado correctamente.');
            } else {
                // Si el servidor devuelve un error relacionado con el límite de docentes
                if (data.error && data.error.includes('asignados')) {
                    alert(data.error);
                } else {
                    alert('Hubo un error al asignar al docente.');
                }
            }
        })
        .catch(error => {
            console.error('Error al asignar el docente:', error);
        });
    }
});
