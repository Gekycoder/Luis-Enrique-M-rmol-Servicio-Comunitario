// planificacion.js

document.addEventListener('DOMContentLoaded', () => {
    const modalTarea = document.getElementById('modal-tarea');  // Referencia al modal (nueva variable)
    const closeModalButton = document.getElementById('close-modal');  // Botón para cerrar el modal
    const addReminderButton = document.getElementById('add-reminder');  // Botón para agregar recordatorio
    let currentTaskId = null;

    // Función para ocultar todos los modales
    const hideAllModals = () => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.style.display = 'none');
    };

    // Función para mostrar el modal de tareas
    const showTaskModal = () => {
        console.log("Mostrando modal de tarea");  // Mensaje de depuración
        hideAllModals();  // Ocultar cualquier otro modal
        modalTarea.style.visibility = 'visible';  // Hacer visible
        modalTarea.style.opacity = '1';  // Hacer completamente opaco
        modalTarea.style.transition = 'opacity 0.3s ease-in-out';  // Transición suave
        document.getElementById('tarea-form').reset();  // Reiniciar el formulario
        currentTaskId = null;  // Reiniciar el ID de la tarea actual
    };
    
    const closeTaskModal = () => {
        modalTarea.style.visibility = 'hidden';  // Ocultar el modal
        modalTarea.style.opacity = '0';  // Hacer completamente transparente
    };

    // Añadir event listener al botón de "Agregar Recordatorio"
    if (addReminderButton) {
        addReminderButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("Botón 'Agregar Recordatorio' clickeado");  // Mensaje de depuración
            showTaskModal();  // Mostrar el modal
        });
    } else {
        console.error("No se encontró el botón 'Agregar Recordatorio'");
    }

    // Añadir event listener al botón de cerrar el modal
    if (closeModalButton) {
        closeModalButton.addEventListener('click', () => {
            closeTaskModal();
        });
    } else {
        console.error("No se encontró el botón de cerrar el modal");
    }

    // Cerrar el modal cuando se hace clic fuera del contenido del modal
    window.addEventListener('click', function(event) {
        if (event.target === modalTarea) {
            closeTaskModal();
        }
    });

    // Función para inicializar el widget de planificación (sin ocultar la tabla en el fondo)
    const planningLink = document.getElementById('planningLink');
    const planningWidget = document.getElementById('planning-widget');

    if (planningWidget) planningWidget.style.display = 'none';

    // Función para mostrar el widget de planificación
    const showPlanningWidget = () => {
        hideAllWidgets(); // Oculta todos los widgets
        if (planningWidget) planningWidget.style.display = 'block';
        initializePlanningWidget(); // Inicializa el widget de planificación
    };

    // Evento para mostrar el widget de planificación al hacer clic en el enlace correspondiente
    if (planningLink) {
        planningLink.addEventListener('click', (e) => {
            e.preventDefault();
            showPlanningWidget();
        });
    }

    // Inicialización del widget de planificación
    let planningWidgetInitialized = false;

    function initializePlanningWidget() {
        if (planningWidgetInitialized) {
            return;
        }
        planningWidgetInitialized = true;

        // Aquí puedes agregar el código de inicialización si es necesario
    }

    document.getElementById('tarea-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const url = currentTaskId ? '/actualizar-tarea/' : '/crear-tarea/';
        if (currentTaskId) {
            formData.append('id', currentTaskId);
        }
        fetch(url, {
            method: 'POST',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            },
            body: formData,
        }).then(response => response.json())
          .then(data => {
              if (data.success) {
                  closeTaskModal();  // Cerrar el modal después de guardar la tarea
                  actualizarEstatus();
                  cargarRecordatorios();
                  if (window.fetchTasksAndRender) {
                      window.fetchTasksAndRender();  // Actualizar calendario si existe
                  }
              } else {
                  alert('Error al guardar la tarea');
              }
          });
    });

    // Llamar a las funciones para cargar los recordatorios y el estatus al cargar la página
    cargarRecordatorios();
    actualizarEstatus();

    // Funciones de actualización de estatus y recordatorios
    function actualizarEstatus() {
        fetch('/obtener-tareas/')
            .then(response => response.json())
            .then(data => {
                const pendientesCount = data.tareas.filter(tarea => tarea.estado === 'Pendiente').length;
                const completadasCount = data.tareas.filter(tarea => tarea.estado === 'Completada').length;
                const canceladasCount = data.tareas.filter(tarea => tarea.estado === 'Cancelada').length;

                document.getElementById('pendientes-count').innerText = pendientesCount;
                document.getElementById('completadas-count').innerText = completadasCount;
                document.getElementById('canceladas-count').innerText = canceladasCount;
            })
            .catch(error => {
                console.error('Error al actualizar el estatus:', error);
            });
    }

    function cargarRecordatorios() {
        fetch('/obtener-tareas/')
            .then(response => response.json())
            .then(data => {
                const recordatoriosList = document.getElementById('recordatorios-list');
                recordatoriosList.innerHTML = '';
                data.tareas.forEach(tarea => {
                    const reminder = document.createElement('div');
                    reminder.classList.add('notification');
                    reminder.innerHTML = `
                        <div class="icon">
                            <span class="material-icons-sharp">volume_up</span>
                        </div>
                        <div class="content">
                            <div class="info">
                                <h3>${tarea.nombre}</h3>
                                <small class="text_muted">${tarea.fecha}</small>
                            </div>
                            <span class="material-icons-sharp edit-task" data-id="${tarea.id}">
                                edit
                            </span>
                            <span class="material-icons-sharp delete-task" data-id="${tarea.id}">
                                delete
                            </span>
                            <span class="material-icons-sharp complete-task" data-id="${tarea.id}">
                                check
                            </span>
                        </div>
                    `;
                    recordatoriosList.appendChild(reminder);

                    reminder.querySelector('.edit-task').addEventListener('click', function() {
                        const tareaId = this.getAttribute('data-id');
                        mostrarMenuOpciones(tareaId);
                    });

                    reminder.querySelector('.delete-task').addEventListener('click', function() {
                        const tareaId = this.getAttribute('data-id');
                        eliminarTarea(tareaId);
                    });

                    reminder.querySelector('.complete-task').addEventListener('click', function() {
                        const tareaId = this.getAttribute('data-id');
                        completarTarea(tareaId);
                    });
                });
            })
            .catch(error => {
                console.error('Error al cargar los recordatorios:', error);
            });
    }

    // Funciones para editar, eliminar y completar tareas
    function mostrarMenuOpciones(tareaId) {
        console.log('Mostrar opciones para la tarea:', tareaId);
        fetch(`/obtener-tarea/${tareaId}/`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('nombre').value = data.tarea.nombre;
                    document.getElementById('descripcion').value = data.tarea.descripcion;
                    document.getElementById('fecha').value = data.tarea.fecha;
                    currentTaskId = tareaId;
                    modalTarea.style.visibility = 'visible';  // Mostrar el modal
                    modalTarea.style.opacity = '1';  // Hacer completamente visible
                } else {
                    alert('Error al cargar la tarea');
                }
            })
            .catch(error => {
                console.error('Error al obtener la tarea:', error);
            });
    }

    function eliminarTarea(tareaId) {
        if (confirm('¿Seguro que deseas eliminar esta tarea?')) {
            const formData = new FormData();
            formData.append('id', tareaId);
            fetch('/eliminar-tarea/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                },
                body: formData,
            }).then(response => response.json())
              .then(data => {
                  if (data.success) {
                      actualizarEstatus();
                      cargarRecordatorios();
                      if (window.fetchTasksAndRender) {
                          window.fetchTasksAndRender();  // Actualizar calendario si existe
                      }
                  } else {
                      alert('Error al eliminar la tarea');
                  }
              })
              .catch(error => {
                  console.error('Error al eliminar la tarea:', error);
              });
        }
    }

    function completarTarea(tareaId) {
        const formData = new FormData();
        formData.append('id', tareaId);
        fetch('/tarea-completada/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            },
            body: formData,
        }).then(response => response.json())
          .then(data => {
              if (data.success) {
                  actualizarEstatus();
                  cargarRecordatorios();
                  if (window.fetchTasksAndRender) {
                      window.fetchTasksAndRender();  // Actualizar calendario si existe
                  }
              } else {
                  alert('Error al marcar la tarea como completada');
              }
          })
          .catch(error => {
              console.error('Error al completar la tarea:', error);
          });
    }
});
