document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(loginForm);

        fetch(loginForm.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': formData.get('csrfmiddlewaretoken'),
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = data.redirect_url;
            } else {
                errorMessage.style.display = 'block';
                errorMessage.textContent = data.error;
            }
        })
        .catch(error => {
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'Error al intentar iniciar sesión. Por favor, inténtelo de nuevo.';
        });
    });
});
