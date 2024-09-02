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
  const studentsWidget = document.getElementById('students-widget');
  const addUserWidget = document.getElementById('widget-addUser');
  const editUserWidget = document.getElementById('widget-editUser');
  const deleteUserWidget = document.getElementById('widget-deleteUser');
  const teacherAssignmentLink = document.getElementById('assignTeacher');
  const teacherWidget = document.getElementById('teacher-widget');
  const teacherTableBody = document.getElementById('teacherTable').querySelector('tbody');

  const hideAllWidgets = () => {
      if (statusWidget) statusWidget.style.display = 'none';
      if (remindersWidget) remindersWidget.style.display = 'none';
      if (calendarWidget) calendarWidget.style.display = 'none';
      if (usersWidget) usersWidget.style.display = 'none';
      if (studentsWidget) studentsWidget.style.display = 'none';
      if (addUserWidget) addUserWidget.style.display = 'none';
      if (editUserWidget) editUserWidget.style.display = 'none';
      if (deleteUserWidget) deleteUserWidget.style.display = 'none';
      if (teacherWidget) teacherWidget.style.display = 'none'; 
  };

  const showUsersWidget = () => {
      hideAllWidgets();
      if (usersWidget) usersWidget.style.display = 'block';
      fetchUserData();
  };

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
              <td>${usuario.direccion}</td>
              <td>${usuario.rol}</td>
          `;
      });

      const usersTable = initializeDataTable('#user-table');
      document.querySelector('#users-search').addEventListener('keyup', function() {
          usersTable.search(this.value).draw();
      });
  }

  if (usersLink) {
      usersLink.addEventListener('click', (e) => {
          e.preventDefault();
          showUsersWidget();
      });
  }

  const determineActiveTab = () => {
      const links = [studentsLink, retiroLink, estudioLink, asistenciaLink, inscripcionLink];
      for (let link of links) {
          if (link.classList.contains('active')) {
              return link.id.replace('-link', '');
          }
      }
      return 'estudiantes';
  };

  const showStudentsWidget = () => {
      hideAllWidgets();
      if (studentsWidget) studentsWidget.style.display = 'block';
  };

  const updateContextMenu = () => {
      const generateCertificate = document.getElementById('generateCertificate');
      if (currentTab === 'estudio') {
          generateCertificate.textContent = 'Generar Constancia de Estudio';
          generateCertificate.onclick = function(e) {
              const studentId = contextMenu.dataset.studentId;
              window.location.href = `/generar-constancia/${studentId}/`;
              contextMenu.style.display = 'none';
          };
      } else if (currentTab === 'asistencia') {
          generateCertificate.textContent = 'Generar Constancia de Asistencia';
          generateCertificate.onclick = function(e) {
              const studentId = contextMenu.dataset.studentId;
              window.location.href = `/generar-constancia-asistencia/${studentId}/`;
              contextMenu.style.display = 'none';
          };
      } else if (currentTab === 'inscripcion') {
          generateCertificate.textContent = 'Generar Constancia de Inscripción';
          generateCertificate.onclick = function(e) {
              const studentId = contextMenu.dataset.studentId;
              window.location.href = `/generar-constancia-inscripcion/${studentId}/`;
              contextMenu.style.display = 'none';
          };
      } else if (currentTab === 'retiro') {
          generateCertificate.textContent = 'Generar Constancia de Retiro';
          generateCertificate.onclick = function(e) {
              const studentId = contextMenu.dataset.studentId;
              window.location.href = `/generar-constancia-retiro/${studentId}/`;
              contextMenu.style.display = 'none';
          };
      }
  };

  let currentTab = determineActiveTab();

  [retiroLink, estudioLink, asistenciaLink, inscripcionLink].forEach(link => {
      link.addEventListener('click', (e) => {
          e.preventDefault();
          currentTab = e.target.id.replace('-link', '');
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
                          <td>${estudiante.notas}</td>
                      `;
                  });

                  const studentsTable = initializeDataTable('#students-table');
                  document.querySelector('#students-search').addEventListener('keyup', function() {
                      studentsTable.search(this.value).draw();
                  });

                  studentsTableBody.addEventListener('contextmenu', function(e) {
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

                  document.addEventListener('click', function(e) {
                      if (contextMenu.style.display === 'block' && !contextMenu.contains(e.target)) {
                          contextMenu.style.display = 'none';
                      }
                  });
              })
              .catch(error => {
                  console.error('Error:', error);
              });
      });
  });

  // Agregar y gestionar usuarios
  if (addUserLink) {
    addUserLink.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllWidgets();
        if (addUserWidget) addUserWidget.style.display = 'block';
    });
}

if (editUserLink) {
    editUserLink.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllWidgets();
        if (editUserWidget) editUserWidget.style.display = 'block';
    });
}

if (deleteUserLink) {
    deleteUserLink.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllWidgets();
        if (deleteUserWidget) deleteUserWidget.style.display = 'block';
    });
}

if (document.getElementById('addUserForm')) {
    document.getElementById('addUserForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        fetch('/agregar-usuario/', {
            method: 'POST',
            body: formData,
        }).then(response => response.json()).then(data => {
            if (data.success) {
                alert('Usuario agregado exitosamente');
                location.reload();
            } else {
                alert('Error al agregar usuario: ' + data.error);
            }
        }).catch(error => {
            console.error('Error:', error);
            alert('Error al agregar usuario: ' + error);
        });
    });
}

if (document.getElementById('editUserForm')) {
    document.getElementById('editUserForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        fetch('/modificar-usuario/', {
            method: 'POST',
            body: formData,
        }).then(response => response.json()).then(data => {
            if (data.success) {
                alert('Usuario modificado exitosamente');
                location.reload();
            } else {
                alert('Error al modificar usuario: ' + data.error);
            }
        });
    });

    document.getElementById('userId').addEventListener('change', function() {
      const userId = this.value;
      fetch(`/get-usuario/${userId}/`)
          .then(response => response.json())
          .then(data => {
              if (data.usuario) {
                  document.getElementById('userNombres').value = data.usuario.nombres;
                  document.getElementById('userApellidos').value = data.usuario.apellidos;
                  document.getElementById('userCedula').value = data.usuario.cedula;
                  document.getElementById('userUsuario').value = data.usuario.usuario;
                  document.getElementById('userContrasena').value = data.usuario.contrasena;
                  document.getElementById('userCorreo').value = data.usuario.correo;
                  document.getElementById('userTelefonos').value = data.usuario.telefonos;
                  document.getElementById('userDireccion').value = data.usuario.direccion;
                  document.getElementById('userRol').value = data.usuario.rol;
              } else {
                  alert('Usuario no encontrado');
              }
          })
          .catch(error => {
              console.error('Error al obtener los datos del usuario:', error);
              alert('Error al obtener los datos del usuario');
          });
  });  
  
}

if (document.getElementById('deleteUserForm')) {
    document.getElementById('deleteUserForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        fetch('/eliminar-usuario/', {
            method: 'POST',
            body: formData,
        }).then(response => response.json()).then(data => {
            if (data.success) {
                alert('Usuario eliminado exitosamente');
                location.reload();
            } else {
                alert('Error al eliminar usuario: ' + data.error);
            }
        });
    });
}

const logoutButtons = document.querySelectorAll('#logout, #logout-profile');
const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
logoutButtons.forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        fetch('/logout/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        }).then(response => {
            if (response.ok) {
                window.location.href = '/login';
            } else {
                console.error('Error al cerrar sesión');
            }
        }).catch(error => console.error('Error:', error));
    });
});

    // Mostrar el widget de docentes
    const showTeacherWidget = () => {
        hideAllWidgets();
        if (teacherWidget) teacherWidget.style.display = 'block';
        fetchTeacherData(); // Cargar los datos de los docentes
    };

    // Agregar eventos para mostrar los widgets correspondientes
    if (teacherAssignmentLink) {
        teacherAssignmentLink.addEventListener('click', (e) => {
            e.preventDefault();
            showTeacherWidget();
        });
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
                populateTeacherTable(data.docentes);  // Poblar la tabla con los datos recibidos
            })
            .catch(error => console.error('Error al cargar los datos de docentes:', error));
    }

    // Función para poblar la tabla con los docentes
    function populateTeacherTable(docentes) {
        const teacherTableBody = document.getElementById('teacherTable').querySelector('tbody');
        if (!teacherTableBody) {
            console.error('No se encontró el cuerpo de la tabla de docentes');
            return;
        }
    
        // Limpiar la tabla antes de poblarla
        teacherTableBody.innerHTML = '';
    
        const grados = ['M III', 'G III', 'G II', 'G I', '1°', '2°', '3°', '4°', '5°', '6°'];
        const secciones = ['A', 'B', 'C', 'D'];
    
        // Agregar filas con los datos de los docentes
        docentes.forEach(teacher => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${teacher.id}</td>
                <td>${teacher.nombres}</td>
                <td>${teacher.apellidos}</td>
                <td>
                    <select class="grade-select" data-docente-id="${teacher.id}">
                        ${grados.map(grado => `<option value="${grado}">${grado}</option>`).join('')}
                    </select>
                </td>
                <td>
                    <select class="section-select" data-docente-id="${teacher.id}">
                        ${secciones.map(seccion => `<option value="${seccion}">${seccion}</option>`).join('')}
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
    
    document.addEventListener('click', function (event) {
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
                    alert('Hubo un error al asignar al docente.');
                }
            })
            .catch(error => {
                console.error('Error al asignar el docente:', error);
            });
        }
    });
    
    
});