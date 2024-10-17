document.addEventListener('DOMContentLoaded', () => {
    const modals = document.querySelectorAll('.modal'); // Seleccionar todos los modales

    const addUserLink = document.getElementById('addUser');
    const editUserLink = document.getElementById('editUser');
    const deleteUserLink = document.getElementById('deleteUser');
    const addUserWidget = document.getElementById('widget-addUser');
    const editUserWidget = document.getElementById('widget-editUser');
    const deleteUserWidget = document.getElementById('widget-deleteUser');
    const addStudentLink = document.getElementById('addStudent');
    const editStudentLink = document.getElementById('editStudent');
    const deleteStudentLink = document.getElementById('deleteStudent');
    const addStudentWidget = document.getElementById('widget-addStudent');
    const editStudentWidget = document.getElementById('widget-editStudent');
    const deleteStudentWidget = document.getElementById('widget-deleteStudent');

    // **Función para ocultar todos los widgets**
    const hideAllWidgets = () => {
        modals.forEach(modal => modal.style.display = 'none');
    };

    // Función para abrir un modal
    const openModal = (modal) => {
        hideAllWidgets();
        if (modal) modal.style.display = 'block';
    };

    // **Eventos para agregar y gestionar usuarios**
    if (addUserLink) {
        addUserLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(addUserWidget);
        });
    }

    if (editUserLink) {
        editUserLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(editUserWidget);
        });
    }

    if (deleteUserLink) {
        deleteUserLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(deleteUserWidget);
        });
    }

    // **Manejo del formulario para agregar usuario**
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

    // **Manejo del formulario para editar usuario**
if (document.getElementById('editUserForm')) {
    const editUserForm = document.getElementById('editUserForm');
    const userIdField = document.getElementById('userId');

    // Listener para el evento 'submit' del formulario
    editUserForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Formulario de edición enviado.');

        const formData = new FormData(this);
        fetch('/modificar-usuario/', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Usuario modificado exitosamente');
                location.reload();
            } else {
                alert('Error al modificar usuario: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error en la solicitud:', error);
            alert('Ocurrió un error al procesar la solicitud.');
        });
    });

    // Listener para el evento 'change' en el campo 'userId'
    userIdField.addEventListener('change', function() {
        const userId = this.value.trim();
        console.log(`Cambio detectado en userId: ${userId}`);

        if (userId === '') {
            alert('Por favor, ingresa un ID de usuario válido.');
            limpiarCamposUsuario();
            return;
        }

        fetch(`/get-usuario/${userId}/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Respuesta de red no ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.usuario) {
                    console.log('Datos del usuario recibidos:', data.usuario);
                    document.getElementById('userNombres').value = data.usuario.nombres || '';
                    document.getElementById('userApellidos').value = data.usuario.apellidos || '';
                    document.getElementById('userCedula').value = data.usuario.cedula || '';
                    document.getElementById('userUsuario').value = data.usuario.usuario || '';
                    document.getElementById('userContrasena').value = data.usuario.contrasena || '';
                    document.getElementById('userCorreo').value = data.usuario.correo || '';
                    document.getElementById('userTelefonos').value = data.usuario.telefonos || '';
                    document.getElementById('userFechaNac').value = data.usuario.fecha_nac || ''; // Agregar la fecha de nacimiento
                    document.getElementById('userDireccion').value = data.usuario.direccion || '';
                    document.getElementById('userRol').value = data.usuario.rol || '';
                    
                } else {
                    alert('Usuario no encontrado');
                    limpiarCamposUsuario();
                }
            })
            .catch(error => {
                console.error('Error al obtener los datos del usuario:', error);
                alert('Error al obtener los datos del usuario');
            });
    });

    // Listener para detectar la tecla Enter en el campo 'userId'
    userIdField.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Evita que el formulario se envíe
            console.log('Tecla Enter detectada en userId.');
            this.blur(); // Quita el foco del campo para que el evento 'change' se dispare
        }
    });
}


    // **Manejo del formulario para eliminar usuario**
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

    // **Manejo de los botones de logout**
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

    // **Eventos para agregar y gestionar estudiantes**
    if (addStudentLink) {
        addStudentLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(addStudentWidget);
        });
    }

    if (editStudentLink) {
        editStudentLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(editStudentWidget);
        });
    }

    if (deleteStudentLink) {
        deleteStudentLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(deleteStudentWidget);
        });
    }

    // **Manejo del select de grado y sección para agregar estudiante**
    const gradoSelect = document.getElementById('gradoSelect');
    const seccionSelect = document.getElementById('seccionSelect');

    if (gradoSelect && seccionSelect) {
        const seccionesOptions = {
            'I': ['U'],
            'II': ['U'],
            'III': ['A', 'B'],
            'IV': ['A', 'B'],
            'V': ['A', 'B'],
            'VI': ['A', 'B'],
            'VII': ['A', 'B'],
            'VIII': ['A', 'B'],
            'IX': ['A', 'B']
        };

        gradoSelect.addEventListener('change', function() {
            const selectedGrado = this.value;

            // Limpiar las opciones actuales
            seccionSelect.innerHTML = '<option value="" disabled selected>Sección</option>';

            // Obtener las opciones correspondientes según el grado seleccionado
            const opciones = seccionesOptions[selectedGrado] || [];

            // Añadir las nuevas opciones
            opciones.forEach(opcion => {
                const optionElement = document.createElement('option');
                optionElement.value = opcion;
                optionElement.textContent = `Sección ${opcion}`;
                seccionSelect.appendChild(optionElement);
            });

            // Si solo hay una opción, seleccionarla automáticamente
            if (opciones.length === 1) {
                seccionSelect.value = opciones[0];
            }
        });
    }

    // **Manejo del formulario para agregar estudiante**
    if (document.getElementById('addStudentForm')) {
        document.getElementById('addStudentForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);

            fetch('/agregar-estudiante/', {
                method: 'POST',
                body: formData,
            }).then(response => response.json()).then(data => {
                if (data.success) {
                    alert('Estudiante agregado exitosamente');
                    location.reload();
                } else {
                    alert('Error al agregar estudiante: ' + data.error);
                }
            }).catch(error => {
                console.error('Error al agregar estudiante:', error);
                alert('Error al agregar estudiante: ' + error);
            });
        });
    }

  // **Manejo del formulario para editar estudiante**
if (document.getElementById('editStudentForm')) {
    const editStudentForm = document.getElementById('editStudentForm');
    const studentIdField = document.getElementById('studentId');

    // **Mapeo inverso de grados**
    const reverseGradeMapping = {
        '1º': 'IV',
        '2º': 'V',
        '3º': 'VI',
        '4º': 'VII',
        '5º': 'VIII',
        '6º': 'IX',
    };

    // Listener para el evento 'submit' del formulario
    editStudentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Formulario de edición de estudiante enviado.');

        // **Obtener los datos del formulario**
        const formData = new FormData(this);

        // **Obtener el grado seleccionado (grado mapeado)**
        const mappedGrade = formData.get('grado');

        // **Convertir al grado original usando el mapeo inverso**
        const originalGrade = reverseGradeMapping[mappedGrade] || mappedGrade;

        // **Reemplazar el grado en formData con el grado original**
        formData.set('grado', originalGrade);

        // **Enviar los datos al servidor sin modificar la solicitud fetch**
        fetch('/modificar-estudiante/', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Estudiante modificado exitosamente');
                location.reload();
            } else {
                alert('Error al modificar estudiante: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error en la solicitud:', error);
            alert('Ocurrió un error al procesar la solicitud.');
        });
    });

    // Listener para el evento 'change' en el campo 'studentId'
    studentIdField.addEventListener('change', function() {
        const studentId = this.value.trim();
        console.log(`Cambio detectado en studentId: ${studentId}`);

        if (studentId === '') {
            alert('Por favor, ingresa un ID de estudiante válido.');
            limpiarCamposEstudiante();
            return;
        }

        const gradeMapping = {
            'IV': '1º',
            'V': '2º',
            'VI': '3º',
            'VII': '4º',
            'VIII': '5º',
            'IX': '6º',
        };

        fetch(`/get-estudiante/${studentId}/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al obtener los datos del estudiante');
                }
                return response.json();
            })
            .then(data => {
                if (data.estudiante) {
                    console.log('Datos del estudiante recibidos:', data.estudiante);

                    // **Aplicar el mapeo al grado del estudiante**
                    const originalGrade = data.estudiante.grado || '';
                    const mappedGrade = gradeMapping[originalGrade] || originalGrade;

                    // **Asignar el grado mapeado al campo 'studentGrado'**
                    document.getElementById('studentGrado').value = mappedGrade;

                    // **Asignar los demás campos como antes**
                    document.getElementById('studentCI').value = data.estudiante.ci || '';
                    document.getElementById('studentApellidosNombres').value = data.estudiante.apellidos_nombres || '';
                    document.getElementById('studentSeccion').value = data.estudiante.seccion || '';
                    document.getElementById('studentSexo').value = data.estudiante.sexo || '';
                    document.getElementById('studentEdad').value = data.estudiante.edad || '';
                    document.getElementById('studentLugarNac').value = data.estudiante.lugar_nac || '';
                    document.getElementById('studentFechaNac').value = data.estudiante.fecha_nac || '';
                    document.getElementById('studentTalla').value = data.estudiante.talla || '';
                    document.getElementById('studentPeso').value = data.estudiante.peso || '';
                    document.getElementById('studentTallaCamisa').value = data.estudiante.talla_camisa || '';
                    document.getElementById('studentTallaPantalon').value = data.estudiante.talla_pantalon || '';
                    document.getElementById('studentTallaZapatos').value = data.estudiante.talla_zapatos || '';
                    document.getElementById('studentRepresentante').value = data.estudiante.representante || '';
                    document.getElementById('studentCIRepresentante').value = data.estudiante.ci_representante || '';
                    document.getElementById('studentDireccion').value = data.estudiante.direccion || '';
                    document.getElementById('studentTlf').value = data.estudiante.tlf || '';
                    document.getElementById('studentNombrePersonaAutorizada').value = data.estudiante.nombre_apellido_persona_autorizada_para_retirar_estudiante || '';
                    document.getElementById('studentCIPersonaAutorizada').value = data.estudiante.ci_persona_autorizada || '';
                    document.getElementById('studentTlfPersonaAutorizada').value = data.estudiante.tlf_persona_autorizada || '';
                    document.getElementById('studentParentezcoPersonaAutorizada').value = data.estudiante.parentezco_persona_autorizada || '';
                } else {
                    alert('Estudiante no encontrado');
                    limpiarCamposEstudiante();
                }
            })
            .catch(error => {
                console.error('Error al obtener los datos del estudiante:', error);
                alert('Error al obtener los datos del estudiante');
            });
    });

    // Listener para detectar la tecla Enter en el campo 'studentId'
    studentIdField.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Evita que el formulario se envíe
            console.log('Tecla Enter detectada en studentId.');
            this.blur(); // Quita el foco del campo para que el evento 'change' se dispare
        }
    });
}


    // **Manejo del formulario para eliminar estudiante**
    if (document.getElementById('deleteStudentForm')) {
        document.getElementById('deleteStudentForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            fetch('/eliminar-estudiante/', {
                method: 'POST',
                body: formData,
            }).then(response => response.json()).then(data => {
                if (data.success) {
                    alert('Estudiante eliminado exitosamente');
                    location.reload();
                } else {
                    alert('Error al eliminar estudiante: ' + data.error);
                }
            });
        });
    }

    // **Cerrar los widgets al hacer clic fuera de ellos**
    document.addEventListener('click', (event) => {
        modals.forEach(modal => {
            if (modal.style.display === 'block' && !modal.querySelector('.modal-content').contains(event.target)) {
                modal.style.display = 'none';
            }
        });
    });

    // Cerrar el modal cuando se hace clic en la "x"
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            hideAllWidgets();
        });
    });

    // **Prevenir el cierre del widget al hacer clic en los enlaces del menú**
    const menuLinks = [addUserLink, editUserLink, deleteUserLink, addStudentLink, editStudentLink, deleteStudentLink];
    menuLinks.forEach(link => {
        if (link) {
            link.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita que el clic en el enlace cierre el widget
            });
        }
    });
});
