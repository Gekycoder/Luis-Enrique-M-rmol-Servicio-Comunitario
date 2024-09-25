from django.template.loader import get_template
from weasyprint import HTML
from .models import Estudiante, Usuario  # Asegúrate de que el path al módulo models es correcto
from django.utils import timezone
import locale

# Establece la configuración regional para el tiempo a español
locale.setlocale(locale.LC_TIME, 'es_ES.utf8')

def generar_boletin(estudiante_id, datos_boletin, usuario_actual):
    hoy = timezone.now()
    estudiante = Estudiante.objects.get(id=estudiante_id)
    director = Usuario.objects.get(rol='Director')

    docente = usuario_actual  # Utilizar el usuario actual como el docente

    # Cargar la plantilla HTML del boletín
    template = get_template('boletin_1er_momento_preescolar.html')
    
    # Preparar el contexto con los datos para el boletín, dividiendo el texto en viñetas
    contexto = {
        'nombre_estudiante': estudiante.apellidos_nombres,
        'ce': estudiante.ci,
        'nivel_seccion': f"{estudiante.grado} - {estudiante.seccion}",
        'formacionPersonal': datos_boletin['formacionPersonal'].split(';'),
        'relacionAmbiente': datos_boletin['relacionAmbiente'].split(';'),
        'comunicacionRepresentacion': datos_boletin['comunicacionRepresentacion'].split(';'),
        'sugerencias': datos_boletin['sugerencias'].split(';'),
        'diasHabiles': datos_boletin['diasHabiles'],
        'asistencias': datos_boletin['asistencias'],
        'inasistencias': datos_boletin['inasistencias'],
        'docente': f"{docente.nombres} {docente.apellidos}",
        'director': f"{director.nombres} {director.apellidos}"
    }

    # Renderizar la plantilla HTML con el contexto
    html_boletin = template.render(contexto)

    # Convertir el HTML a PDF usando WeasyPrint
    pdf = HTML(string=html_boletin).write_pdf()

    # Retornar el PDF generado
    return pdf


def generar_boletin_primaria_pdf(estudiante_id, datos_boletin, usuario_actual):
    estudiante = Estudiante.objects.get(id=estudiante_id)
    director = Usuario.objects.get(rol='Director')
    docente = usuario_actual  # El usuario actual es el docente

    # Cargar la plantilla HTML del boletín de primaria
    template = get_template('boletin_primaria.html')
    
    # Preparar el contexto para el boletín de primaria
    contexto = {
        'nombre_estudiante': estudiante.apellidos_nombres,
        'ce': estudiante.ci,
        'nivel_seccion': f"{estudiante.grado} - {estudiante.seccion}",
        'habilidadesConsolidadas': datos_boletin['habilidadesConsolidadas'].split(';'),
        'habilidadesporConsolidar': datos_boletin['habilidadesporConsolidar'].split(';'),
        'sugerencias': datos_boletin['sugerencias'].split(';'),
        'diasHabiles': datos_boletin['diasHabiles'],
        'asistencias': datos_boletin['asistencias'],
        'inasistencias': datos_boletin['inasistencias'],
        'docente': f"{docente.nombres} {docente.apellidos}",
        'director': f"{director.nombres} {director.apellidos}",
        'nombre_proyecto': datos_boletin['nombre_proyecto'],
        'fechaDesde': datos_boletin['fechaDesde'],
        'fechaHasta': datos_boletin['fechaHasta'],
    }

    # Renderizar la plantilla HTML con el contexto
    html_boletin = template.render(contexto)

    # Convertir el HTML a PDF usando WeasyPrint
    pdf = HTML(string=html_boletin).write_pdf()

    # Retornar el PDF generado
    return pdf
