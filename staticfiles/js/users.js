// users.js

const usersLink = document.getElementById('users');
const usersWidget = document.getElementById('user-widget');

// Función para mostrar el widget de usuarios
const showUsersWidget = () => {
    console.log('Mostrando el widget de usuarios'); // Depuración
    hideAllWidgets(); // Oculta todos los demás widgets
    if (usersWidget) {
        console.log('Encontrado el widget de usuarios, mostrando...'); // Depuración
        usersWidget.style.display = 'block'; // Muestra el widget de usuarios
        fetchUserData(); // Obtiene y muestra los datos de usuarios
    } else {
        console.log('No se encontró el widget de usuarios'); // Depuración
    }
};

// Función para obtener datos de usuarios del servidor
function fetchUserData() {
    console.log('Obteniendo datos de usuarios...'); // Depuración
    fetch('/get-usuarios/')
        .then(response => {
            console.log('Respuesta del servidor recibida'); // Depuración
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log('Datos recibidos:', data); // Depuración
            if (data.usuarios) {
                updateUserTable(data.usuarios); // Actualiza la tabla con los datos de usuarios
            } else {
                console.error("Formato de datos inesperado:", data);
            }
        })
        .catch(error => {
            console.error('Error al obtener usuarios:', error);
        });
}

// Función para actualizar la tabla de usuarios
function updateUserTable(usuarios) {
    console.log('Actualizando la tabla de usuarios'); // Depuración
    const userTableBody = document.querySelector('#user-table tbody');
    userTableBody.innerHTML = ''; // Limpiar la tabla antes de llenarla

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

    console.log('Tabla de usuarios actualizada'); // Depuración

    // Llamada a la función para habilitar la búsqueda en la tabla
    setupSearch();
}

// Función para habilitar la búsqueda en la tabla
function setupSearch() {
    console.log('Habilitando búsqueda en la tabla de usuarios'); // Depuración
    const searchInput = document.getElementById('users-search');
    searchInput.addEventListener('input', function() {
        const query = searchInput.value.toLowerCase(); // Convertir la búsqueda a minúsculas para evitar problemas de mayúsculas/minúsculas
        const rows = document.querySelectorAll('#user-table tbody tr');

        rows.forEach(row => {
            const rowText = row.textContent.toLowerCase();
            if (rowText.includes(query)) {
                row.style.display = ''; // Mostrar la fila si coincide con la búsqueda
            } else {
                row.style.display = 'none'; // Ocultar la fila si no coincide
            }
        });
    });
    console.log('Búsqueda configurada'); // Depuración
}

// Evento para mostrar el widget de usuarios al hacer clic en el enlace correspondiente
if (usersLink) {
    usersLink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Clic en el enlace de usuarios'); // Depuración
        showUsersWidget(); // Muestra el widget de usuarios al hacer clic en el enlace
    });
} else {
    console.log('No se encontró el enlace de usuarios'); // Depuración
}
