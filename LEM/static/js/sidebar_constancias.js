document.addEventListener('DOMContentLoaded', () => {
    // ...
    const certificatesLink = document.getElementById('certificates');
    const certificatesSubmenu = document.getElementById('certificates-submenu');
  
    certificatesLink.addEventListener('click', (e) => {
      e.preventDefault(); // Previene el comportamiento por defecto del enlace
      // Alterna la visibilidad del submenú
      const isSubmenuVisible = certificatesSubmenu.style.display !== 'none';
      certificatesSubmenu.style.display = isSubmenuVisible ? 'none' : 'block';
    });
    // ...
  });
  