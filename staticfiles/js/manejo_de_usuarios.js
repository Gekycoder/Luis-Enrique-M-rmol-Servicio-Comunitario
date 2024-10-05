document.addEventListener('DOMContentLoaded', function() {
    // Fetch user data and update profile info
    fetch('/get-user-data/')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.querySelector('.info b').innerText = data.usuario_nombre;
                document.querySelector('.info .text-muted').innerText = data.usuario_rol;
                if (data.profile_photo_url) {
                    document.getElementById('profile-img').src = data.profile_photo_url;
                }
            } else {
                document.querySelector('.info').innerText = 'Usuario o rol no encontrados.';
            }
        })
        .catch(error => console.error('Error:', error));

    // Handle profile menu toggle
    const profileButton = document.getElementById('profile-menu-button');
    const profileMenu = document.getElementById('profile-menu');

    profileButton.addEventListener('click', function () {
        const isOpen = profileMenu.getAttribute('data-state') === 'open';
        profileMenu.style.display = isOpen ? 'none' : 'block';
        profileMenu.setAttribute('data-state', isOpen ? 'closed' : 'open');
    });

    document.addEventListener('click', function (event) {
        if (!profileButton.contains(event.target) && !profileMenu.contains(event.target)) {
            profileMenu.style.display = 'none';
            profileMenu.setAttribute('data-state', 'closed');
        }
    });

    document.getElementById('modify-user').addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('widget-editUser').style.display = 'block';
    });

    document.getElementById('change-photo').addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('upload-photo-input').click();
    });

    document.getElementById('upload-photo-input').addEventListener('change', function () {
        const form = document.getElementById('upload-photo-form');
        const formData = new FormData(form);

        fetch('/change-profile-photo/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('profile-img').src = data.new_profile_photo_url;
            } else {
                alert('Error al subir la foto de perfil');
            }
        })
        .catch(error => console.error('Error:', error));
    });
});