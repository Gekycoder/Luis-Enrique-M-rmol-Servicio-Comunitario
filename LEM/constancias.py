from django.template.loader import get_template
from weasyprint import HTML
from .models import Estudiante, Usuario  # Asegúrate de que el path al módulo models es correcto
from django.utils import timezone
from datetime import datetime
import locale
locale.setlocale(locale.LC_TIME, 'es_ES.utf8')  # Establece la configuración regional para el tiempo a español



# Imaginando que tienes una función que te devuelve la instancia del director basado en tu lógica de negocio



def constancia_estudio(estudiante_id):
    hoy = timezone.now()
    # Obtenemos la instancia del estudiante basado en el ID proporcionado
    estudiante = Estudiante.objects.get(id=estudiante_id)
    
    # Obtenemos la instancia del director utilizando una función que asumimos está definida en otro lugar
    director = Usuario.objects.get(rol='Director')

    # Cargar la plantilla HTML de la constancia
    template = get_template('constancia_de_estudio.html')
    
    # Preparar el contexto con los datos para la constancia
    contexto = {
        'estudiante_nombre': estudiante.apellidos_nombres,
        'estudiante_ci': estudiante.ci,
        'estudiante_grado': estudiante.grado,
        'estudiante_seccion': estudiante.seccion,
        'director_nombre': f"{director.nombres} {director.apellidos}",
        'dia': hoy.day,
        'mes': hoy.strftime('%B').capitalize(),  # Debería devolver el mes en español
        'año': hoy.year,
        # ... otros datos necesarios para la constancia
    }

    # Renderizar la plantilla HTML con el contexto
    html_constancia = template.render(contexto)

    # Convertir el HTML a PDF usando WeasyPrint
    pdf = HTML(string=html_constancia).write_pdf()

    # Retornar el PDF generado
    return pdf

