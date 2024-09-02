document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('modal-tarea');
    const closeModalButton = document.getElementById('close-modal');
    const addReminderButton = document.querySelector('.notification.add-reminder');
    let currentTaskId = null;

    addReminderButton.addEventListener('click', function() {
        currentTaskId = null;
        document.getElementById('tarea-form').reset();
        modal.style.display = 'block';
    });

    closeModalButton.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });

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
                  modal.style.display = 'none';
                  actualizarEstatus();
                  cargarRecordatorios();
                  window.fetchTasksAndRender(); // Refresh calendar
              } else {
                  alert('Error al guardar la tarea');
              }
          });
    });

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
            });
    }

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
                    modal.style.display = 'block';
                } else {
                    alert('Error al cargar la tarea');
                }
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
                      window.fetchTasksAndRender(); // Refresh calendar
                  } else {
                      alert('Error al eliminar la tarea');
                  }
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
                  window.fetchTasksAndRender(); // Refresh calendar
              } else {
                  alert('Error al marcar la tarea como completada');
              }
          });
    }

    actualizarEstatus();
    cargarRecordatorios();
});