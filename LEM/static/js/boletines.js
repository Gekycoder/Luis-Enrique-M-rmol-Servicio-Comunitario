document.addEventListener('DOMContentLoaded', () => {
    const maxTotalChars = 3170;

    const inputs = [
        { field: document.getElementById('formacionPersonal'), counter: document.getElementById('formacionPersonalCounter') },
        { field: document.getElementById('relacionAmbiente'), counter: document.getElementById('relacionAmbienteCounter') },
        { field: document.getElementById('comunicacionRepresentacion'), counter: document.getElementById('comunicacionRepresentacionCounter') },
        { field: document.getElementById('sugerencias'), counter: document.getElementById('sugerenciasCounter') }
    ];

    function calculateTotalChars() {
        return inputs.reduce((total, input) => total + input.field.value.length, 0);
    }

    function updateCharCounters() {
        const totalChars = calculateTotalChars();
        const remainingChars = maxTotalChars - totalChars;

        inputs.forEach(input => {
            input.counter.textContent = `${totalChars}/${maxTotalChars} caracteres usados`;
        });

        console.log(`Total characters used: ${totalChars}`);
        console.log(`Remaining characters: ${remainingChars}`);
    }

    function checkFieldLength() {
        const totalChars = calculateTotalChars();
        if (totalChars > maxTotalChars) {
            alert('Has alcanzado el límite máximo de caracteres permitidos.');
        }
    }

    inputs.forEach(input => {
        input.field.addEventListener('input', () => {
            updateCharCounters();
            checkFieldLength();
        });
    });

    updateCharCounters(); // Inicializar los contadores

    // Resto de tu código existente...

    const getCookie = (name) => {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; cookies[i]; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');

    const spanishTranslation = {
        "sProcessing": "Procesando...",
        "sLengthMenu": "Mostrar _MENU_ registros",
        "sZeroRecords": "No se encontraron resultados",
        "sEmptyTable": "Ningún dato disponible en esta tabla",
        "sInfo": "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
        "sInfoEmpty": "Mostrando registros del 0 al 0 de un total de 0 registros",
        "sInfoFiltered": "(filtrado de un total de _MAX_ registros)",
        "sInfoPostFix": "",
        "sSearch": "Buscar:",
        "sUrl": "",
        "sInfoThousands": ",",
        "sLoadingRecords": "Cargando...",
        "oPaginate": {
            "sFirst": "Primero",
            "sLast": "Último",
            "sNext": "Siguiente",
            "sPrevious": "Anterior"
        },
        "oAria": {
            "sSortAscending": ": Activar para ordenar la columna de manera ascendente",
            "sSortDescending": ": Activar para ordenar la columna de manera descendente"
        }
    };

    let studentsTable;

    function initializeDataTable(tableSelector) {
        return $(tableSelector).DataTable({
            language: spanishTranslation,
            paging: true,
            lengthChange: true,
            searching: true,
            ordering: true,
            info: true,
            autoWidth: false,
            responsive: true,
        });
    }

    const boletinesLink = document.getElementById('reports');
    const boletinesForm = document.getElementById('boletinesForm');
    const studentsWidget = document.getElementById('students-widget');
    const contextMenu = document.getElementById('contextMenu');

    const planningLink = document.getElementById('planning');
    const usersLink = document.getElementById('users');
    const studentsLink = document.getElementById('students');
    const retiroLink = document.getElementById('retiro-link');
    const estudioLink = document.getElementById('estudio-link');
    const asistenciaLink = document.getElementById('asistencia-link');
    const inscripcionLink = document.getElementById('inscripcion-link');
    const addUserLink = document.getElementById('addUser');
    const editUserLink = document.getElementById('editUser');
    const deleteUserLink = document.getElementById('deleteUser');
    const statusWidget = document.getElementById('status-widget');
    const remindersWidget = document.getElementById('reminders-widget');
    const calendarWidget = document.getElementById('calendar-widget');
    const usersWidget = document.getElementById('user-widget');
    const addUserWidget = document.getElementById('widget-addUser');
    const editUserWidget = document.getElementById('widget-editUser');
    const deleteUserWidget = document.getElementById('widget-deleteUser');

    const hideAllWidgets = () => {
        if (statusWidget) statusWidget.style.display = 'none';
        if (remindersWidget) remindersWidget.style.display = 'none';
        if (calendarWidget) calendarWidget.style.display = 'none';
        if (usersWidget) usersWidget.style.display = 'none';
        if (studentsWidget) studentsWidget.style.display = 'none';
        if (addUserWidget) addUserWidget.style.display = 'none';
        if (editUserWidget) editUserWidget.style.display = 'none';
        if (deleteUserWidget) deleteUserWidget.style.display = 'none';
        if (boletinesForm) boletinesForm.style.display = 'none';
    };

    if (boletinesLink) {
        boletinesLink.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllWidgets();
            if (boletinesForm) boletinesForm.style.display = 'block';
            resetStudentTable(); // Resetea la tabla de estudiantes
        });
    }

    document.getElementById('formBoletines').addEventListener('submit', function (e) {
        e.preventDefault();

        // Convierte los saltos de línea en un delimitador especial
        const convertNewLinesToDelimiter = (str) => str.replace(/\n/g, ';');

        const data = {
            formacionPersonal: convertNewLinesToDelimiter(document.getElementById('formacionPersonal').value),
            relacionAmbiente: convertNewLinesToDelimiter(document.getElementById('relacionAmbiente').value),
            comunicacionRepresentacion: convertNewLinesToDelimiter(document.getElementById('comunicacionRepresentacion').value),
            sugerencias: convertNewLinesToDelimiter(document.getElementById('sugerencias').value),
            diasHabiles: document.getElementById('diasHabiles').value,
            asistencias: document.getElementById('asistencias').value,
            inasistencias: document.getElementById('inasistencias').value
        };

        console.log(`Formación Personal y Social: ${data.formacionPersonal.length}`);
        console.log(`Relación con el Ambiente: ${data.relacionAmbiente.length}`);
        console.log(`Comunicación y Representación: ${data.comunicacionRepresentacion.length}`);
        console.log(`Sugerencias y Recomendación del (la) Docente: ${data.sugerencias.length}`);

        console.log('Datos del boletín:', data); // Aquí puedes enviar estos datos al servidor si es necesario

        // Esconder formulario y mostrar la tabla de estudiantes
        boletinesForm.style.display = 'none';
        studentsWidget.style.display = 'block';
        fetchStudentData();

        // Cambiar el texto y la funcionalidad de los botones en la tabla
        document.querySelectorAll('#students-table .action-btn').forEach(function (button) {
            button.textContent = 'Generar Boletín';
            button.onclick = function () {
                console.log('Generando boletín para', button.closest('tr').querySelector('.student-name').textContent);
                const studentId = button.closest('tr').dataset.studentId;

                // Crear un formulario oculto para enviar los datos por POST
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = `/generar-boletin-1er-momento-preescolar/${studentId}/`;

                // Agregar el token CSRF al formulario
                const csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = 'csrfmiddlewaretoken';
                csrfInput.value = csrftoken;
                form.appendChild(csrfInput);

                // Agregar los datos del boletín al formulario
                for (const key in data) {
                    if (data.hasOwnProperty(key)) {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = key;
                        input.value = data[key];
                        form.appendChild(input);
                    }
                }

                // Agregar el formulario al cuerpo del documento y enviarlo
                document.body.appendChild(form);
                form.submit();
            };
        });
    });

    function fetchStudentData() {
        fetch('/get-estudiantes/')
            .then(response => response.json())
            .then(data => {
                const studentsTableBody = document.querySelector('#students-table tbody');
                studentsTableBody.innerHTML = '';

                data.estudiantes.forEach(estudiante => {
                    const row = studentsTableBody.insertRow();
                    row.setAttribute('data-student-id', estudiante.id);
                    row.innerHTML = `
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
                    `;
                });

                if ($.fn.DataTable.isDataTable('#students-table')) {
                    $('#students-table').DataTable().clear().destroy();
                }
                studentsTable = initializeDataTable('#students-table');
                document.querySelector('#students-search').addEventListener('keyup', function () {
                    studentsTable.search(this.value).draw();
                });

                studentsTableBody.addEventListener('contextmenu', function (e) {
                    e.preventDefault();
                    const row = e.target.closest('tr');
                    if (row) {
                        const studentId = row.dataset.studentId;
                        contextMenu.style.top = `${e.clientY}px`;
                        contextMenu.style.left = `${e.clientX}px`;
                        contextMenu.dataset.studentId = studentId;
                        contextMenu.style.display = 'block';
                        updateContextMenu();
                    }
                });

                document.addEventListener('click', function (e) {
                    if (contextMenu.style.display === 'block' && !contextMenu.contains(e.target)) {
                        contextMenu.style.display = 'none';
                    }
                });
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    function resetStudentTable() {
        const studentsTableBody = document.querySelector('#students-table tbody');
        studentsTableBody.innerHTML = '';
        if ($.fn.DataTable.isDataTable('#students-table')) {
            $('#students-table').DataTable().clear().destroy();
        }
    }

    function updateContextMenu() {
        const generateCertificate = document.getElementById('generateCertificate');
        generateCertificate.textContent = 'Generar Boletín';
        generateCertificate.onclick = function (e) {
            const studentId = contextMenu.dataset.studentId;

            // Crear un formulario oculto para enviar los datos por POST
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = `/generar-boletin-1er-momento-preescolar/${studentId}/`;

            // Agregar el token CSRF al formulario
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = 'csrfmiddlewaretoken';
            csrfInput.value = csrftoken;
            form.appendChild(csrfInput);

            // Agregar los datos del boletín al formulario
            const convertNewLinesToDelimiter = (str) => str.replace(/\n/g, ';');

            const data = {
                formacionPersonal: convertNewLinesToDelimiter(document.getElementById('formacionPersonal').value),
                relacionAmbiente: convertNewLinesToDelimiter(document.getElementById('relacionAmbiente').value),
                comunicacionRepresentacion: convertNewLinesToDelimiter(document.getElementById('comunicacionRepresentacion').value),
                sugerencias: convertNewLinesToDelimiter(document.getElementById('sugerencias').value),
                diasHabiles: document.getElementById('diasHabiles').value,
                asistencias: document.getElementById('asistencias').value,
                inasistencias: document.getElementById('inasistencias').value
            };

            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = data[key];
                    form.appendChild(input);
                }
            }

            // Agregar el formulario al cuerpo del documento y enviarlo
            document.body.appendChild(form);
            form.submit();

            contextMenu.style.display = 'none';
        };
    }
});