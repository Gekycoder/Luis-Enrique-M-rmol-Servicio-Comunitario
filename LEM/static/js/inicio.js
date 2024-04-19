document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();  // Evita el comportamiento de envío predeterminado

    var formData = new FormData(this);

    fetch('/login/', {  // La URL que maneja el inicio de sesión
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if(data.success) {
            console.log('Token recibido:', data.token); // Imprime el token en la consola
            // Guarda el token JWT y redirige al usuario
            localStorage.setItem('token', data.token);
            window.location.href = data.redirect_url;
        } else {
            // Muestra un mensaje de error
            document.getElementById('error-message').textContent = data.error;
            document.getElementById('error-message').style.display = 'block';
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        document.getElementById('error-message').textContent = 'Ha ocurrido un error al iniciar sesión.';
        document.getElementById('error-message').style.display = 'block';
    });
});
