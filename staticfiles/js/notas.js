// notas.js

(function() {
    // Selección de elementos del DOM
    const studentsLink = document.getElementById('studentsLink'); // Asegúrate de que el ID coincide con tu HTML
    const studentsWidget = document.getElementById('students-widget');

    if (studentsWidget) studentsWidget.style.display = 'none';

    // Función para mostrar el widget de estudiantes
    const showStudentsWidget = () => {
        hideAllWidgets(); // Función definida en main.js
        if (studentsWidget) studentsWidget.style.display = 'block';
        initializeStudentsWidget(); // Inicializa el widget de estudiantes
    };

    // Evento para mostrar el widget de estudiantes al hacer clic en el enlace correspondiente
    if (studentsLink) {
        studentsLink.addEventListener('click', (e) => {
            e.preventDefault();
            showStudentsWidget();
        });
    }

    // Inicialización del widget de estudiantes
    let studentsWidgetInitialized = false;

    function initializeStudentsWidget() {
        if (studentsWidgetInitialized) {
            // Ya inicializado, no hacemos nada
            return;
        }
        studentsWidgetInitialized = true;

        // Variables para elementos del DOM
        const notasModal = document.getElementById('notasModal');
        const closeModal = notasModal.querySelector('.close');
        const notasForm = document.getElementById('notasForm');
        const studentNameElement = document.getElementById('studentName');
        const notasInput = document.getElementById('notasInput');
        let currentStudentId = null;

        const promotionModal = document.getElementById('promotionModal');
        const closePromotionModal = promotionModal?.querySelector('.close');
        const approvePromotionBtn = document.getElementById('approvePromotionBtn');
        const denyPromotionBtn = document.getElementById('denyPromotionBtn');

        // Obtener información de roles
        const configElement = document.getElementById('config');
        const isAdminOrDirector = configElement.dataset.isAdminOrDirector === 'true';
        const isDocente = configElement.dataset.isDocente === 'true';

        // Asignar eventos de cierre a los modales
        closeModal.addEventListener('click', closeModalFunc);
        window.addEventListener('click', (event) => {
            if (event.target === notasModal) {
                closeModalFunc();
            }
        });

        if (closePromotionModal) {
            closePromotionModal.addEventListener('click', () => {
                promotionModal.style.display = 'none';
            });

            window.addEventListener('click', (event) => {
                if (event.target === promotionModal) {
                    promotionModal.style.display = 'none';
                }
            });
        }

        // Función para escapar caracteres especiales en HTML
        function escapeHtml(text) {
            if (!text) return '';
            return text.replace(/&/g, '&amp;')
                       .replace(/</g, '&lt;')
                       .replace(/>/g, '&gt;')
                       .replace(/"/g, '&quot;')
                       .replace(/'/g, '&#039;');
        }

        // Objeto para almacenar los docentes
        let docentesDict = {};

        // Función para obtener los datos de los docentes
        function fetchDocentesData() {
            fetch('/get-docentes/')
                .then(response => response.json())
                .then(data => {
                    data.docentes.forEach(docente => {
                        docentesDict[docente.id] = `${docente.nombres} ${docente.apellidos}`;
                    });
                    // Después de obtener los docentes, obtenemos los estudiantes
                    fetchStudentsData();
                })
                .catch(error => console.error('Error al obtener docentes:', error));
        }

        // Evento para manejar el envío del formulario de notas
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
                if (data.success) {
                    alert('Notas registradas correctamente.');
                    closeModalFunc();
                    fetchStudentsData(); // Volver a cargar la tabla de estudiantes
                } else {
                    alert('Hubo un error al registrar las notas.');
                }
            })
            .catch(error => {
                console.error('Error al registrar las notas:', error);
            });
        }); 

        // Función para cerrar el modal de notas
        function closeModalFunc() {
            notasModal.style.display = 'none';
            currentStudentId = null;
        }

        // Función para abrir el modal de notas
        function openModal(id, name, notas) {
            currentStudentId = id;
            studentNameElement.textContent = `Notas de ${name}`;
            
            let notaValor = '';

            if (notas && notas.notas) {
                notaValor = notas.notas;
            }

            notasInput.value = notaValor;
            notasInput.placeholder = 'Ingrese las notas (A-E)';

            // Permitir la edición del campo
            notasInput.removeAttribute('readonly');
            notasModal.style.display = 'block';
        }

        // Función para abrir el modal de promoción
        function openPromotionModal(id, name, grade, docentesNombres, notas) {
            currentStudentId = id;

            let notaValor = '';

            if (notas && notas.notas) {
                notaValor = notas.notas;
            }

            // Construir el texto de los docentes
            let docentesTexto = 'N/A';
            if (docentesNombres.length > 0) {
                docentesTexto = docentesNombres.join(', ');
            }

            // Asignar la información al modal
            document.getElementById('promotionStudentName').textContent = `Estudiante: ${name}`;
            document.getElementById('promotionStudentGrade').textContent = `Grado Actual: ${grade}`;
            document.getElementById('promotionDocente').textContent = `Docente(s): ${docentesTexto}`;
            document.getElementById('promotionNotas').textContent = `Notas: ${notaValor || 'No disponibles'}`;

            // Mostrar el modal
            promotionModal.style.display = 'block';
        }

        // Almacenamiento de los estudiantes para facilitar el filtrado
        let estudiantesData = [];
        let selectedGrade = ''; // Grado seleccionado en el dropdown

        // Función para obtener y cargar los datos de los estudiantes
        function fetchStudentsData() {
            fetch('/get-estudiantes/')
                .then(response => response.json())
                .then(data => {
                    estudiantesData = data.estudiantes; // Guardamos los datos para el filtrado
                    renderStudentsTable(estudiantesData);
                    populateGradeDropdown(estudiantesData); // Rellenar el dropdown de grados
                    populateSectionDropdown(estudiantesData) // Rellenar el dropdown de secciones

                })
                .catch(error => console.error('Error al obtener estudiantes:', error));
        }

        // Función para renderizar la tabla de estudiantes
        function renderStudentsTable(estudiantes) {
            const studentsTableBody = document.querySelector('#students-table tbody');
            studentsTableBody.innerHTML = '';

            // Ajustar el orden de los grados, colocando primero III, II, I, luego los grados del IV al IX
            // const gradeOrder = ['I', 'II', 'III', "IV", "V", "VI", "VII", "VIII", "IX"];

            // // Función para normalizar los grados (elimina espacios, hace que coincidan los formatos)
            // function normalizeGrade(grade) {
            //     return grade ? grade.trim().replace(/\s+/g, '') : '';
            // }

            // // Función para ordenar grados, secciones y apellidos
            // estudiantes.sort((a, b) => {
            //     // Normalizar los grados
            //     const gradeA = normalizeGrade(a.grado);
            //     const gradeB = normalizeGrade(b.grado);

            //     // Obtener los índices de los grados en el array 'gradeOrder'
            //     const gradeIndexA = gradeOrder.includes(gradeA) ? gradeOrder.indexOf(gradeA) : gradeOrder.length;
            //     const gradeIndexB = gradeOrder.includes(gradeB) ? gradeOrder.indexOf(gradeB) : gradeOrder.length;

            //     // Comparar grados
            //     const gradeComparison = gradeIndexA - gradeIndexB;

            //     // Si los grados son iguales, compararemos las secciones
            //     if (gradeComparison === 0) {
            //         const sectionOrder = ['U', 'A', 'B'];
            //         const sectionA = a.seccion && sectionOrder.includes(a.seccion) ? sectionOrder.indexOf(a.seccion) : sectionOrder.length;
            //         const sectionB = b.seccion && sectionOrder.includes(b.seccion) ? sectionOrder.indexOf(b.seccion) : sectionOrder.length;

            //         const sectionComparison = sectionA - sectionB;

            //         // Si también las secciones son iguales, ordenamos alfabéticamente por el campo apellidos_nombres
            //         if (sectionComparison === 0) {
            //             return a.apellidos_nombres.localeCompare(b.apellidos_nombres);
            //         }

            //         return sectionComparison;
            //     }

            //     return gradeComparison;
            // });

            



            estudiantes.forEach(estudiante => {
                const row = document.createElement('tr');
                row.setAttribute('data-student-id', estudiante.id);

                // Escapar nombre
                const escapedName = escapeHtml(estudiante.apellidos_nombres);

                // Obtener los nombres de los docentes asignados
                const docentesNombres = [];
                if (estudiante.docente_id && docentesDict[estudiante.docente_id]) {
                    docentesNombres.push(docentesDict[estudiante.docente_id]);
                }
                if (estudiante.docente2_id && docentesDict[estudiante.docente2_id]) {
                    docentesNombres.push(docentesDict[estudiante.docente2_id]);
                }
                if (estudiante.docente3_id && docentesDict[estudiante.docente3_id]) {
                    docentesNombres.push(docentesDict[estudiante.docente3_id]);
                }

                let rowContent = `
                <td>${estudiante.id}</td>
                <td>${estudiante.ci}</td>
                <td>${estudiante.apellidos_nombres}</td>
                <td>${estudiante.grado}</td>
                <td>${estudiante.seccion}</td>
                <td>${estudiante.sexo}</td>
                <td>${estudiante.edad}</td>
                <td>${estudiante.lugar_nac}</td>
                <td>${estudiante.fecha_nac || ''}</td>
                <td>${estudiante.talla || ''}</td>
                <td>${estudiante.peso || ''}</td>
                <td>${estudiante.talla_camisa || ''}</td>
                <td>${estudiante.talla_pantalon || ''}</td>
                <td>${estudiante.talla_zapatos || ''}</td>
                <td>${estudiante.representante}</td>
                <td>${estudiante.ci_representante}</td>
                <td>${estudiante.direccion || ''}</td>
                <td>${estudiante.tlf || ''}</td>
                <td>${estudiante.nombre_apellido_persona_autorizada_para_retirar_estudiante || ''}</td>
                <td>${estudiante.ci_persona_autorizada || ''}</td>
                <td>${estudiante.tlf_persona_autorizada || ''}</td>
                <td>${estudiante.parentezco_persona_autorizada || ''}</td>
                <td>
                    <button class="ver-notas" data-id="${estudiante.id}" data-name="${escapedName}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>`;

                if (isAdminOrDirector) {
                    console.log(`Estudiante: ${estudiante.apellidos_nombres}, Promoción solicitada: ${estudiante.promocion_solicitada}`);
                    const bellColor = estudiante.promocion_solicitada == 1 ? 'red' : 'gray';

                    // Preparar los nombres de los docentes para el modal
                    const docentesNombresStr = docentesNombres.join(', ');
                    const escapedDocentesNombres = escapeHtml(docentesNombresStr);

                    rowContent += `
                    <td>
                        <button class="review-promotion" 
                                data-id="${estudiante.id}" 
                                data-name="${escapedName}" 
                                data-grade="${estudiante.grado}" 
                                data-docentes="${escapedDocentesNombres}" 
                                style="background: none; border: none; cursor: pointer;">
                            <i class="fas fa-bell" style="color: ${bellColor};"></i>
                        </button>
                    </td>`;
                }

                row.innerHTML = rowContent;
                // Añadir el objeto estudiante completo al dataset de la fila
                row.dataset.estudiante = JSON.stringify(estudiante);
                studentsTableBody.appendChild(row);
            });

            // Configurar eventos después de renderizar la tabla
            setupEventListeners();
        }

        // Función para configurar la búsqueda y los filtros
        function setupSearchAndFilters() {
            const searchInput = document.getElementById('students-search');
            const gradeDropdown = document.getElementById('filter-grade');
            const sectionDropdown = document.getElementById('filter-section');
            let searchType = 'nombre';

            // Configuración del dropdown de grado
            gradeDropdown.addEventListener('change', function() {
                selectedGrade = gradeDropdown.value;
                filterAndRenderStudents(); // Filtrar estudiantes por nombre y grado
            });

            // Configuración del dropdown de sección
            sectionDropdown.addEventListener('change', function() {
                selectedSection = sectionDropdown.value;
                filterAndRenderStudents(); // Filtrar estudiantes por nombre, grado y sección
            });

            searchInput.addEventListener('input', function() {
                filterAndRenderStudents(); // Filtrar estudiantes por nombre y grado
            });
        }

        // Función para filtrar y renderizar los estudiantes según el grado, sección y nombre
        function filterAndRenderStudents() {
            const searchInput = document.getElementById('students-search').value.toLowerCase();
            let filteredStudents = estudiantesData;

            // Filtrar por nombre siempre, independientemente de los demás filtros
            if (searchInput) {
                filteredStudents = filteredStudents.filter(estudiante =>
                    estudiante.apellidos_nombres.toLowerCase().includes(searchInput)
                );
            }

            // Verificar si se ha seleccionado un grado
            const gradeDropdown = document.getElementById('filter-grade');
            selectedGrade = gradeDropdown.value || '';  // Si no se selecciona nada, se toma como vacío

            // Filtrar por grado si se ha seleccionado uno (excepto si está en "Todos los grados")
            if (selectedGrade !== '') {
                filteredStudents = filteredStudents.filter(estudiante =>
                    estudiante.grado.toLowerCase() === selectedGrade.toLowerCase()
                );
            }

            // Verificar si se ha seleccionado una sección
            const sectionDropdown = document.getElementById('filter-section');
            selectedSection = sectionDropdown.value || '';  // Si no se selecciona nada, se toma como vacío

            // Filtrar por sección si se ha seleccionado una (excepto si está en "Todas las secciones")
            if (selectedSection !== '') {
                filteredStudents = filteredStudents.filter(estudiante =>
                    estudiante.seccion.toLowerCase() === selectedSection.toLowerCase()
                );
            }

            // Renderizar los estudiantes filtrados
            renderStudentsTable(filteredStudents);
        }


        // Función para llenar el dropdown con los grados disponibles
        function populateGradeDropdown(estudiantes) {
            const gradeDropdown = document.getElementById('filter-grade');
            const uniqueGrades = [...new Set(estudiantes.map(estudiante => estudiante.grado))]; // Grados únicos
            gradeDropdown.innerHTML = '<option value="">Todos los Grados</option>'; // Opción por defecto

            uniqueGrades.forEach(grado => {
                const option = document.createElement('option');
                option.value = grado;
                option.textContent = grado;
                gradeDropdown.appendChild(option);
            });
        }

        // Función para llenar el dropdown con las secciones disponibles
        function populateSectionDropdown(estudiantes) {
            const sectionDropdown = document.getElementById('filter-section');
            const uniqueSections = [...new Set(estudiantes.map(estudiante => estudiante.seccion))]; // Secciones únicas
            sectionDropdown.innerHTML = '<option value="">Todas las Secciones</option>'; // Opción por defecto

            uniqueSections.forEach(seccion => {
                const option = document.createElement('option');
                option.value = seccion;
                option.textContent = seccion;
                sectionDropdown.appendChild(option);
            });
        }


        // Función para configurar los eventos de los botones en la tabla
        function setupEventListeners() {
            const studentsTableBody = document.querySelector('#students-table tbody');

            studentsTableBody.addEventListener('click', function(event) {
                const target = event.target;
                if (target.classList.contains('ver-notas') || target.closest('.ver-notas')) {
                    const button = target.closest('.ver-notas');
                    const studentId = button.getAttribute('data-id');
                    const studentName = button.getAttribute('data-name');
                    const row = button.closest('tr');
                    const estudianteData = JSON.parse(row.dataset.estudiante);
                    const studentNotas = estudianteData.notas || null;
                    openModal(studentId, studentName, studentNotas);
                } else if (target.classList.contains('review-promotion') || target.closest('.review-promotion')) {
                    if (isAdminOrDirector) {
                        const button = target.closest('.review-promotion');
                        const studentId = button.getAttribute('data-id');
                        const studentName = button.getAttribute('data-name');
                        const studentGrade = button.getAttribute('data-grade');
                        const docentesNombresStr = button.getAttribute('data-docentes');
                        const docentesNombres = docentesNombresStr ? docentesNombresStr.split(', ') : [];
                        const row = button.closest('tr');
                        const estudianteData = JSON.parse(row.dataset.estudiante);
                        const studentNotas = estudianteData.notas || null;
                        openPromotionModal(studentId, studentName, studentGrade, docentesNombres, studentNotas);
                    }
                }
            });
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

        // Cargar los datos de los docentes y luego los estudiantes al inicializar el widget
        fetchDocentesData();

        // Configurar búsqueda y filtros después de inicializar el widget
        setupSearchAndFilters();
    }
})();
