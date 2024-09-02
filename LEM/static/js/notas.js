document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM content loaded"); // Depuración inicial

    // Configuración de la traducción del DataTable
    const spanishTranslation = {
        // Configuración de la traducción del DataTable
    };

    // Inicialización de DataTable con configuración personalizada
    function initializeDataTable(tableSelector) {
        console.log("Initializing DataTable"); // Depuración
        return $(tableSelector).DataTable({
            language: spanishTranslation,
            paging: true,
            lengthChange: true,
            searching: true,
            ordering: true,
            info: true,
            autoWidth: false,
            responsive: true,
            initComplete: function() {
                // Agregar filtros en las cabeceras de columnas de Grado y Sección
                this.api().columns([3, 4]).every(function() { // Índices de columna 3: Grado, 4: Sección
                    const column = this;
                    const select = $('<select><option value="">Filtrar</option></select>')
                        .appendTo($(column.header()).empty())
                        .on('change', function() {
                            const val = $.fn.dataTable.util.escapeRegex($(this).val());
                            column
                                .search(val ? '^' + val + '$' : '', true, false)
                                .draw();
                        });

                    // Poblar el select con valores únicos de la columna
                    column.data().unique().sort().each(function(d, j) {
                        select.append('<option value="' + d + '">' + d + '</option>');
                    });
                });
            }
        });
    }

    // Variables para elementos del DOM
    const studentsLink = document.getElementById('students');
    const studentsWidget = document.getElementById('students-widget');
    const notasModal = document.getElementById('notasModal');
    const closeModal = notasModal.querySelector('.close');
    const notasForm = document.getElementById('notasForm');
    const studentName = document.getElementById('studentName');
    const notasInput = document.getElementById('notasInput');
    let currentStudentId = null;

    const promotionModal = document.getElementById('promotionModal');
    const closePromotionModal = promotionModal?.querySelector('.close');
    const approvePromotionBtn = document.getElementById('approvePromotionBtn');
    const denyPromotionBtn = document.getElementById('denyPromotionBtn');

    let studentsTable = null; // Variable para el DataTable de la tabla de estudiantes

    // Función para ocultar todos los widgets
    function hideAllWidgets() {
        console.log("Hiding all widgets"); // Depuración
        const widgets = document.querySelectorAll('.widget');
        widgets.forEach(widget => widget.style.display = 'none');
    }

    // Función para mostrar el widget de estudiantes
    function showStudentsWidget() {
        console.log("Showing students widget"); // Depuración
        hideAllWidgets();
        if (studentsWidget) studentsWidget.style.display = 'block';
    }

    // Función para abrir el modal de notas
    function openModal(id, name, notas) {
        console.log(`Opening modal for student ${name} with notes: ${notas}`); // Depuración
        currentStudentId = id;
        studentName.textContent = `Notas de ${name}`;
    
        // Mostrar las notas si existen, o el placeholder si no
        if (notas) {
            notasInput.value = notas;  // Mostrar la nota existente
        } else {
            notasInput.value = '';  // Dejar el campo vacío si no hay notas
        }
    
        // Permitir la edición del campo para todos los roles
        notasInput.removeAttribute('readonly');
        
        notasModal.style.display = 'block';
    }
    

    // Función para cerrar el modal de notas
    function closeModalFunc() {
        console.log("Closing modal"); // Depuración
        notasModal.style.display = 'none';
        currentStudentId = null;
    }

    // Asignar eventos de cierre a los modales
    closeModal.addEventListener('click', closeModalFunc);
    window.addEventListener('click', (event) => {
        if (event.target === notasModal) {
            closeModalFunc();
        }
    });

    if (closePromotionModal) {
        closePromotionModal.addEventListener('click', () => {
            console.log("Closing promotion modal"); // Depuración
            promotionModal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === promotionModal) {
                promotionModal.style.display = 'none';
            }
        });
    }

    // Función para manejar el envío del formulario de notas
    notasForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!currentStudentId) return;

        const notas = notasInput.value.trim();

        fetch(`/registrar-notas/${currentStudentId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('input[name="csrfmiddlewaretoken"]').value
            },
            body: JSON.stringify({ notas: notas })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Notas registradas", data); // Depuración
            if (data.success) {
                alert('Notas registradas correctamente.');
                closeModalFunc();
                fetchStudentsData(); // Volver a cargar la tabla de estudiantes
            } else {
                alert('Hubo un error al registrar las notas.');
            }
        })
        .catch(error => {
            console.error('Error al registrar las notas:', error); // Mostrar error en consola
        });
    }); 

    // Código para gestionar roles
    const isAdminOrDirector = document.getElementById('config').dataset.isAdminOrDirector === 'true';
    const isDocente = document.getElementById('config').dataset.isDocente === 'true';

    // Función para obtener y cargar los datos de los estudiantes
    function fetchStudentsData() {
        fetch('/get-estudiantes/')
            .then(response => response.json())
            .then(data => {
                const studentsTableBody = document.querySelector('#students-table tbody');
                studentsTableBody.innerHTML = '';
    
                data.estudiantes.forEach(estudiante => {
                    const row = studentsTableBody.insertRow();
                    row.setAttribute('data-student-id', estudiante.id);
                    let rowContent = `
                        <td>${estudiante.id}</td>
                        <td>${estudiante.ci}</td>
                        <td>${estudiante.apellidos_nombres}</td>
                        <td>${estudiante.grado}</td>
                        <td>${estudiante.seccion}</td>
                        <td>${estudiante.sexo}</td>
                        <td>${estudiante.edad}</td>
                        <td>${estudiante.lugar_nac}</td>
                        <td>${estudiante.fecha_nac}</td>
                        <td>${estudiante.representante}</td>
                        <td>${estudiante.ci_representante}</td>
                        <td>${estudiante.direccion}</td>
                        <td>${estudiante.tlf}</td>
                        <td>
                            <button class="ver-notas" data-id="${estudiante.id}" data-name="${estudiante.apellidos_nombres}" data-notas="${estudiante.notas}">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>`;
    
                        if (isAdminOrDirector) {
                            console.log(`Estudiante: ${estudiante.apellidos_nombres}, Promoción solicitada: ${estudiante.promocion_solicitada}`); // Depuración
                            const bellColor = estudiante.promocion_solicitada == 1 ? 'red' : 'gray';
                            rowContent += `
                            <td>
                                <button class="review-promotion" data-id="${estudiante.id}" data-name="${estudiante.apellidos_nombres}" data-grade="${estudiante.grado}" data-docente="${estudiante.docente_nombre_completo}" data-notas="${estudiante.notas}" style="background: none; border: none; cursor: pointer;">
                                    <i class="fas fa-bell" style="color: ${bellColor};"></i>
                                </button>
                            </td>`;
                        }
                        
                    row.innerHTML = rowContent;
                });
    
                // Inicializar o actualizar DataTable
                if (studentsTable === null) {
                    studentsTable = initializeDataTable('#students-table');
                } else {
                    studentsTable.clear().rows.add(data.estudiantes).draw();
                }
    
                // Asignar eventos de búsqueda a la tabla
                document.querySelector('#students-search').addEventListener('keyup', function() {
                    studentsTable.search(this.value).draw();
                });

                // Delegación de eventos para "ver-notas"
                $('#students-table tbody').on('click', '.ver-notas', function() {
                    const studentId = $(this).data('id');
                    const studentName = $(this).data('name');
                    const studentNotas = $(this).data('notas');
                    openModal(studentId, studentName, studentNotas);
                });
    
                // Delegación de eventos para "review-promotion", solo si es admin o director
                if (isAdminOrDirector) {
                    $('#students-table tbody').on('click', '.review-promotion', function() {
                        const studentId = $(this).data('id');
                        const studentName = $(this).data('name');
                        const studentGrade = $(this).data('grade');
                        const studentNotas = $(this).data('notas');
                        const docenteName = $(this).data('docente');
                        openPromotionModal(studentId, studentName, studentGrade, docenteName, studentNotas);
                    });
                }
            })
            .catch(error => console.error('Error fetching students:', error));
    }
    

    // Evento clic en el enlace de estudiantes
    if (studentsLink) {
        studentsLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Clic en Estudiantes detectado'); // Depuración
            showStudentsWidget();
            fetchStudentsData(); // Cargar datos de estudiantes al hacer clic en "Estudiantes"
        });
    }

    // Función para abrir el modal de promoción
    function openPromotionModal(id, name, grade, docenteName, notas) {
        console.log(`Opening promotion modal for student ${name} with grade: ${grade}`); // Depuración
        currentStudentId = id;
    
        // Obtener el elemento modal
        const promotionModal = document.getElementById('promotionModal');
    
        // Obtener los campos donde se mostrará la información
        const studentNameElement = document.getElementById('promotionStudentName');
        const studentGradeElement = document.getElementById('promotionStudentGrade');
        const docenteNameElement = document.getElementById('promotionDocente');
        const notasElement = document.getElementById('promotionNotas');
    
        // Asignar la información al modal
        studentNameElement.textContent = `Estudiante: ${name}`;
        studentGradeElement.textContent = `Grado Actual: ${grade}`;
        docenteNameElement.textContent = `Docente: ${docenteName || 'N/A'}`;
        notasElement.textContent = `Notas: ${notas || 'No disponibles'}`;
    
        // Mostrar el modal
        promotionModal.style.display = 'block';
    }

    // Evento para aprobar la promoción
    if (approvePromotionBtn) {
        approvePromotionBtn.addEventListener('click', () => {
            if (!currentStudentId) return;

            fetch(`/aprobar-promocion/${currentStudentId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('input[name="csrfmiddlewaretoken"]').value
                }
            })
            .then(response => response.json())
            .then(data => {
                console.log("Promoción aprobada:", data); // Depuración
                if (data.success) {
                    alert('Promoción aprobada.');
                    promotionModal.style.display = 'none';
                    fetchStudentsData(); // Actualizar la lista de estudiantes
                } else {
                    alert('Hubo un error al aprobar la promoción.');
                }
            })
            .catch(error => console.error('Error al aprobar la promoción:', error));
        });
    }

    // Evento para denegar la promoción
    if (denyPromotionBtn) {
        denyPromotionBtn.addEventListener('click', () => {
            if (!currentStudentId) return;

            fetch(`/denegar-promocion/${currentStudentId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('input[name="csrfmiddlewaretoken"]').value
                }
            })
            .then(response => response.json())
            .then(data => {
                console.log("Promoción denegada:", data); // Depuración
                if (data.success) {
                    alert('Promoción denegada.');
                    promotionModal.style.display = 'none';
                    fetchStudentsData(); // Actualizar la lista de estudiantes
                } else {
                    alert('Hubo un error al denegar la promoción.');
                }
            })
            .catch(error => console.error('Error al denegar la promoción:', error));
        });
    }
});
