// main.js
function hideAllWidgets() {
    const widgets = document.querySelectorAll('.widget');
    widgets.forEach(widget => {
        // Si el widget tiene la clase "no-hide", no lo ocultamos
        if (!widget.classList.contains('no-hide')) {
            widget.style.display = 'none';
        }
    });
}
