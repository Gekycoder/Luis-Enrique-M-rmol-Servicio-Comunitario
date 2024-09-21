// constancias.js

const certificatesLink = document.getElementById('certificatesLink');
const certificatesSubmenu = document.getElementById('certificates-submenu');
const constanciasWidget = document.getElementById('constancias-widget');
let currentConstanciaType = null;

if (constanciasWidget) constanciasWidget.style.display = 'none';

// Mostrar u ocultar el submenú de constancias
if (certificatesLink && certificatesSubmenu) {
    certificatesLink.addEventListener('click', (e) => {
        e.preventDefault();
        certificatesSubmenu.style.display = certificatesSubmenu.style.display === 'none' ? 'block' : 'none';
    });
}

// Manejar clics en los enlaces del submenú de constancias
const constanciaLinks = document.querySelectorAll('.constancia-link');

constanciaLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        currentConstanciaType = e.target.getAttribute('data-constancia-type');
        showConstanciasWidget(currentConstanciaType);
    });
});

// Función para mostrar el widget de constancias
const showConstanciasWidget = (constanciaType) => {
    hideAllWidgets(); // Oculta todos los widgets
    if (constanciasWidget) constanciasWidget.style.display = 'block';
    initializeConstanciasWidget(constanciaType); // Inicializa el widget de constancias
};

// Inicialización del widget de constancias
let constanciasWidgetInitialized = false;

function initializeConstanciasWidget(constanciaType) {
    if (constanciasWidgetInitialized) {
        // Ya inicializado, solo actualizamos si cambia el tipo de constancia
        updateConstanciasWidget(constanciaType);
        return;
    }
    constanciasWidgetInitialized = true;

    const buscarInput = document.getElementById('buscar-constancia-input');
    if (!buscarInput) {
        console.error('No se encontró el input de búsqueda "buscar-constancia-input".');
        return;
    }

    buscarInput.addEventListener('input', function() {
        const query = buscarInput.value.trim();
        fetchEstudiantes(query, constanciaType);  // Buscar estudiantes mientras se escribe
    });

    // Cargar todos los estudiantes inicialmente
    fetchEstudiantes('', constanciaType);
}

// Función para actualizar el widget cuando cambia el tipo de constancia
function updateConstanciasWidget(constanciaType) {
    // Actualizar el título
    const titleElement = document.getElementById('constancias-title');
    titleElement.textContent = `Estudiantes - Constancia de ${capitalize(constanciaType)}`;

    // Reiniciar el input de búsqueda
    const buscarInput = document.getElementById('buscar-constancia-input');
    buscarInput.value = '';

    // Volver a cargar los estudiantes
    fetchEstudiantes('', constanciaType);
}

// Función para hacer fetch con token de autenticación
function fetchWithToken(url, options = {}) {
    const token = localStorage.getItem('access_token');
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    return fetch(url, options);
}

// Función para obtener estudiantes y filtrar resultados en tiempo real
function fetchEstudiantes(query = '', constanciaType) {
    let url = '/get-estudiantes/';
    fetchWithToken(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error en la solicitud: ${response.status}`);
            }
            return response.json().catch(err => {
                throw new Error('Error al analizar JSON: ' + err.message);
            });
        })
        .then(data => {
            if (!data || !data.estudiantes) {
                throw new Error('La estructura de datos no es la esperada');
            }

            const tbody = document.querySelector('#constancias-table tbody');
            if (!tbody) {
                console.error('No se encontró el cuerpo de la tabla de constancias');
                return;
            }
            tbody.innerHTML = '';

            console.log('Datos recibidos:', data.estudiantes);

            // Filtrar estudiantes según la búsqueda global
            let filteredData = data.estudiantes;
            if (query) {
                filteredData = data.estudiantes.filter(estudiante => {
                    const values = Object.values(estudiante);
                    return values.some(value =>
                        value && value.toString().toLowerCase().includes(query.toLowerCase())
                    );
                });
            }

            // Renderizar las filas de los estudiantes filtrados
            filteredData.forEach(estudiante => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
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
                    <td class="actions-cell">
                        <button class="generate-button" data-student-id="${estudiante.id}">
                            Generar Constancia de ${capitalize(constanciaType)}
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);

                // Agregar evento al botón
                const generateButton = tr.querySelector('.generate-button');
                generateButton.addEventListener('click', function() {
                    const studentId = this.getAttribute('data-student-id');
                    generateConstancia(studentId, constanciaType);
                });
            });
        })
        .catch(error => {
            console.error('Error al obtener estudiantes:', error);
            alert('Error al obtener estudiantes: ' + error.message);
        });
}

// Función para generar la constancia
function generateConstancia(studentId, constanciaType) {
    let url = '';
    switch (constanciaType) {
        case 'estudio':
            url = `/generar-constancia/${studentId}/`;
            break;
        case 'asistencia':
            url = `/generar-constancia-asistencia/${studentId}/`;
            break;
        case 'inscripcion':
            url = `/generar-constancia-inscripcion/${studentId}/`;
            break;
        case 'retiro':
            url = `/generar-constancia-retiro/${studentId}/`;
            break;
        default:
            alert('Tipo de constancia no válido');
            return;
    }
    // Redirigir a la URL correspondiente
    window.location.href = url;
}

// Función para capitalizar la primera letra
function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}
