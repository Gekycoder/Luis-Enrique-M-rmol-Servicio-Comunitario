document.addEventListener('DOMContentLoaded', () => {
    let currentEstudianteId = null;  // Variable para guardar el ID del estudiante al hacer clic en "1er Momento"

    const boletinesModal = document.getElementById('boletinesForm');  // Referencia al modal
    const closeModalBtn = document.querySelector('.close');  // Botón para cerrar el modal
    const formBoletines = document.getElementById('formBoletines');  // El formulario dentro del modal
    let estudiantesData = [];  // Variable global para almacenar los estudiantes
    let selectedGrade = ''; // Inicializamos la variable del grado

    // Función para ocultar todos los modales
    const hideAllModals = () => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.style.display = 'none');
    };

    // Función para mostrar el modal
    const showBoletinesModal = (estudianteId) => {
        currentEstudianteId = estudianteId;  // Guardar el ID del estudiante
        hideAllModals();  // Ocultar cualquier otro modal
        boletinesModal.style.display = 'block';  // Mostrar el modal de boletines
    };

    // Función para ocultar el modal
    const closeBoletinesModal = () => {
        boletinesModal.style.display = 'none';
    };

    // Añadir event listener al botón de cerrar el modal
    closeModalBtn.addEventListener('click', () => {
        closeBoletinesModal();
    });

    // Añadir event listener a todos los botones de "1er Momento"
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('generate-boletin')) {
            event.preventDefault();
            const estudianteId = event.target.getAttribute('data-id');  // Obtener el ID del estudiante
            showBoletinesModal(estudianteId);  // Mostrar el modal
        }
    });

    // Capturar el evento submit del formulario
    formBoletines.addEventListener('submit', function(event) {
        event.preventDefault();  // Evitar el envío tradicional del formulario

        if (currentEstudianteId) {
            const formData = new FormData(formBoletines);  // Recoger los datos del formulario
            
            // Enviar la solicitud POST para generar el boletín
            fetch(`/generar-boletin-1er-momento-preescolar/${currentEstudianteId}/`, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al generar el boletín.');
                }
                return response.blob();  // Obtener el archivo PDF como blob
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `boletin_${currentEstudianteId}.pdf`;  // Nombre del archivo PDF
                document.body.appendChild(a);
                a.click();
                a.remove();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al generar el boletín.');
            });
        } else {
            alert('Error: No se pudo obtener el ID del estudiante.');
        }
    });

    // Asegurar que al hacer clic fuera del modal, este se cierre
    window.addEventListener('click', function(event) {
        if (event.target === boletinesModal) {
            closeBoletinesModal();
        }
    });

    // Encapsulamos el código de búsqueda y filtro de estudiantes
    const boletinesLink = document.getElementById('reportsLink'); // Asegúrate de que el id coincida con el HTML
    const boletinesWidget = document.getElementById('boletines-widget');

    if (boletinesWidget) boletinesWidget.style.display = 'none';

    // Función para mostrar el widget de boletines
    const showBoletinesWidget = () => {
        hideAllWidgets(); // Oculta todos los widgets
        if (boletinesWidget) boletinesWidget.style.display = 'block';
        initializeBoletinesWidget(); // Inicializa el widget de boletines
    };

    // Evento para mostrar el widget de boletines al hacer clic en el enlace correspondiente
    if (boletinesLink) {
        boletinesLink.addEventListener('click', (e) => {
            e.preventDefault();
            showBoletinesWidget();
        });
    }

    // Inicialización del widget de boletines
    let boletinesWidgetInitialized = false;

    function initializeBoletinesWidget() {
        if (boletinesWidgetInitialized) {
            // Ya inicializado, no hacemos nada
            return;
        }
        boletinesWidgetInitialized = true;

        const buscarInput = document.getElementById('buscar-input');
        if (!buscarInput) {
            console.error('No se encontró el input de búsqueda "buscar-input".');
            return;
        }

        buscarInput.addEventListener('input', function() {
            const query = buscarInput.value.trim();
            filterAndRenderStudents(query);  // Buscar estudiantes mientras se escribe
        });

        // Cargar todos los estudiantes inicialmente
        fetchEstudiantes();
    }

    // Función para hacer fetch con token de autenticación
    function fetchWithToken(url, options = {}) {
        const token = localStorage.getItem('access_token');
        if (token) {
            options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            };
        }
        return fetch(url, options);
    }

    // Función para obtener estudiantes y filtrar resultados en tiempo real
    function fetchEstudiantes(query = '') {
        let url = '/get-estudiantes/';
        fetchWithToken(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error en la solicitud: ${response.status}`);
                }
                return response.json().catch(err => {
                    throw new Error('Error al analizar JSON: ' + err.message);
                });
            })
            .then(data => {
                try {
                    if (!data || !data.estudiantes) {
                        throw new Error('La estructura de datos no es la esperada');
                    }

                    estudiantesData = data.estudiantes; // Guardamos los estudiantes globalmente

                    populateGradeDropdown(estudiantesData); // Poblamos el dropdown de grados

                    filterAndRenderStudents(); // Renderizamos todos los estudiantes inicialmente
                } catch (error) {
                    console.error('Error al procesar los estudiantes:', error);
                    alert('Error al procesar los estudiantes: ' + error.message);
                }
            })
            .catch(error => {
                console.error('Error al obtener estudiantes:', error);
                alert('Error al obtener estudiantes: ' + error.message);
            });
    }

    // Función para configurar la búsqueda y los filtros
    function setupSearchAndFilters() {
        const searchInput = document.getElementById('students-search');
        const gradeDropdown = document.getElementById('filter-grade-boletines');

        // Configuración del dropdown de grado
        gradeDropdown.addEventListener('change', function() {
            selectedGrade = gradeDropdown.value; // Actualizamos el grado seleccionado
            filterAndRenderStudents(); // Filtrar estudiantes por nombre y grado
        });

        searchInput.addEventListener('input', function() {
            filterAndRenderStudents(); // Filtrar estudiantes por nombre y grado
        });
    }

    // Función para filtrar y renderizar los estudiantes según el grado y nombre
    function filterAndRenderStudents(query = '') {
        let filteredStudents = estudiantesData;

        // Filtrar por grado si se ha seleccionado uno
        if (selectedGrade) {
            filteredStudents = filteredStudents.filter(estudiante =>
                estudiante.grado.toLowerCase() === selectedGrade.toLowerCase()
            );
        }

        // Filtrar por nombre
        if (query) {
            filteredStudents = filteredStudents.filter(estudiante =>
                estudiante.apellidos_nombres.toLowerCase().includes(query.toLowerCase())
            );
        }

        // Renderizar los estudiantes filtrados
        renderStudentsTable(filteredStudents);
    }

    // Función para llenar el dropdown con los grados disponibles
    function populateGradeDropdown(estudiantes) {
        const gradeDropdown = document.getElementById('filter-grade-boletines');
        const uniqueGrades = [...new Set(estudiantes.map(estudiante => estudiante.grado))]; // Grados únicos
        gradeDropdown.innerHTML = '<option value="">Todos los Grados</option>'; // Opción por defecto

        uniqueGrades.forEach(grado => {
            const option = document.createElement('option');
            option.value = grado;
            option.textContent = grado;
            gradeDropdown.appendChild(option);
        });
    }

    // Función para renderizar la tabla de estudiantes
    function renderStudentsTable(students) {
        const tbody = document.querySelector('#boletines-table tbody');
        tbody.innerHTML = '';  // Limpiar la tabla antes de renderizar los nuevos datos

        students.forEach(student => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${student.id || ''}</td>
                <td>${student.ci || ''}</td>
                <td>${student.apellidos_nombres || ''}</td>
                <td>${student.grado || ''}</td>
                <td>${student.seccion || ''}</td>
                <td>${student.sexo || ''}</td>
                <td>${student.edad || ''}</td>
                <td>${student.lugar_nac || ''}</td>
                <td>${student.fecha_nac || ''}</td>
                <td>${student.representante || ''}</td>
                <td>${student.ci_representante || ''}</td>
                <td>${student.direccion || ''}</td>
                <td>${student.tlf || ''}</td>
                <td class="actions-cell">
                    <button class="generate-boletin" data-momento="1er Momento" data-id="${student.id || ''}">1er Momento</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Llamamos a la función para configurar búsqueda y filtros
    setupSearchAndFilters();
});
