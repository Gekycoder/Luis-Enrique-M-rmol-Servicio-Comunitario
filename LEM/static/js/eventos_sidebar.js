document.addEventListener('DOMContentLoaded', () => {

  const spanishTranslation = {
    
    "sProcessing":     "Procesando...",
    "sLengthMenu":     "Mostrar _MENU_ registros",
    "sZeroRecords":    "No se encontraron resultados",
    "sEmptyTable":     "Ningún dato disponible en esta tabla",
    "sInfo":           "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
    "sInfoEmpty":      "Mostrando registros del 0 al 0 de un total de 0 registros",
    "sInfoFiltered":   "(filtrado de un total de _MAX_ registros)",
    "sInfoPostFix":    "",
    "sSearch":         "Buscar:",
    "sUrl":            "",
    "sInfoThousands":  ",",
    "sLoadingRecords": "Cargando...",
    "oPaginate": {
      "sFirst":    "Primero",
      "sLast":     "Último",
      "sNext":     "Siguiente",
      "sPrevious": "Anterior"
    },
    "oAria": {
      "sSortAscending":  ": Activar para ordenar la columna de manera ascendente",
      "sSortDescending": ": Activar para ordenar la columna de manera descendente"
    }
  };

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
      // otras opciones...
    });
  }
  
  // Seleccionar los enlaces y los contenedores de widgets
  const planningLink = document.getElementById('planning');
  const usersLink = document.getElementById('users');
  const studentsLink = document.getElementById('students');
  //Widgets
  const statusWidget = document.getElementById('status-widget');
  const remindersWidget = document.getElementById('reminders-widget');
  const calendarWidget = document.getElementById('calendar-widget');
  const usersWidget = document.getElementById('user-widget');
  const studentsWidget = document.getElementById('students-widget');
  
  // Función para ocultar/mostrar widgets
  const hideAllWidgets = () => {
    statusWidget.style.display = 'none';
    remindersWidget.style.display = 'none';
    calendarWidget.style.display = 'none';
    usersWidget.style.display = 'none';
    studentsWidget.style.display = 'none';
  };

  const showUsersWidget = () => {
    hideAllWidgets();
    usersWidget.style.display = 'block';
    fetchUserData();
  };

  // Función para obtener los datos de los usuarios del servidor
  function fetchUserData() {
    fetch('/get-usuarios/')
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (data.usuarios) {
          updateUserTable(data.usuarios);
        } else {
          console.error("Unexpected data format:", data);
        }
      })
      .catch(error => {
        console.error('Error fetching users:', error);
      });
  }

  // Función para actualizar la tabla de usuarios
  function updateUserTable(usuarios) {
    const userTableBody = document.querySelector('#user-table tbody');
  
    userTableBody.innerHTML = '';
    usuarios.forEach(usuario => {
      const row = userTableBody.insertRow();
      row.innerHTML = `
        <td>${usuario.id}</td>
        <td>${usuario.nombres}</td>
        <td>${usuario.apellidos}</td>
        <td>${usuario.cedula}</td>
        <td>${usuario.usuario}</td>
        <td>${usuario.contrasena}</td>
        <td>${usuario.correo}</td>
        <td>${usuario.telefonos}</td>
      `;
    });
    
    const usersTable = initializeDataTable('#user-table');

    // Agregar la funcionalidad de búsqueda
    document.querySelector('#users-search').addEventListener('keyup', function() {
      usersTable.search(this.value).draw();
    });
  }

  usersLink.addEventListener('click', (e) => {
    e.preventDefault();
    showUsersWidget();
  });

  const showStudentsWidget = () => {
    hideAllWidgets();
    studentsWidget.style.display = 'block';

    // Aquí se hace el fetch para obtener los datos de los estudiantes
  };

  // Función para ocultar todos los widgets y mostrar el de estudiantes
  // Función para mostrar solo el widget de estudiantes
  studentsLink.addEventListener('click', (e) => {
    e.preventDefault();
    showStudentsWidget();
  
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
  
        // Inicializar DataTables
        const studentsTable = initializeDataTable('#students-table');
  
        // Agregar la funcionalidad de búsqueda para estudiantes
        document.querySelector('#students-search').addEventListener('keyup', function() {
          studentsTable.search(this.value).draw();
        });
  
        // Evento contextmenu delegado en 'tbody' para el menú contextual
        studentsTableBody.addEventListener('contextmenu', function(e) {
          e.preventDefault();
          const row = e.target.closest('tr');
          if (row) {
            const studentId = row.dataset.studentId;
            contextMenu.style.top = `${e.clientY}px`;
            contextMenu.style.left = `${e.clientX}px`;
            contextMenu.dataset.studentId = studentId;
            contextMenu.style.display = 'block';
          }
        });
  
        // Evento click en el documento para ocultar el menú contextual
        document.addEventListener('click', function(e) {
          if (contextMenu.style.display === 'block' && !contextMenu.contains(e.target)) {
            contextMenu.style.display = 'none';
          }
        });
  
        // Evento click en 'Generar Constancia' en el menú contextual
        const generateCertificate = document.getElementById('generateCertificate');
        generateCertificate.addEventListener('click', function(e) {
          const studentId = contextMenu.dataset.studentId;
          window.location.href = `/generar-constancia/${studentId}/`;
          contextMenu.style.display = 'none';
        });
  
      })
      .catch(error => {
        console.error('Error:', error);
      });
  });
  



  // Código para manejar el cierre de sesión
  const logoutButton = document.getElementById('logout');
  const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

  logoutButton.addEventListener('click', function(e) {
    e.preventDefault();

    fetch('/logout/', {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrfToken,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    .then(response => {
      if (response.ok) {
        window.location.href = '/login';
      } else {
        console.error('Error al cerrar sesión');
      }
    })
    .catch(error => console.error('Error:', error));
  });
});