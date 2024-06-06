document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('modal-tarea');
    const closeModalButton = document.getElementById('close-modal');
    const addReminderButton = document.querySelector('.notification.add-reminder');

    addReminderButton.addEventListener('click', function() {
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
        fetch('/crear-tarea/', {
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
              } else {
                  alert('Error al crear la tarea');
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
                            <span class="material-icons-sharp more-options" data-id="${tarea.id}">
                                more_vert
                            </span>
                        </div>
                    `;
                    recordatoriosList.appendChild(reminder);

                    reminder.querySelector('.more-options').addEventListener('click', function() {
                        const tareaId = this.getAttribute('data-id');
                        mostrarMenuOpciones(tareaId);
                    });
                });
            });
    }

    function mostrarMenuOpciones(tareaId) {
        // Implementar la lógica para mostrar el menú de opciones (completar, modificar, cancelar)
        console.log('Mostrar opciones para la tarea:', tareaId);
    }

    actualizarEstatus();
    cargarRecordatorios();
});
