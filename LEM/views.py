from django.http import JsonResponse
from django.db.models import Q, OuterRef, Subquery, Case, When, IntegerField, Value
from .models import Usuario, Estudiante, Tarea, PromocionSolicitud
from django.http import HttpResponse
from django.contrib.auth.hashers import make_password, check_password
from django.views.decorators.csrf import csrf_exempt
# Asume que esta función está definida en utils.py
from .constancias import constancia_estudio, constancia_asistencia, constancia_inscripcion, constancia_retiro
from django.contrib.auth.decorators import login_required
from .boletines import generar_boletin, generar_boletin_primaria_pdf
from django.contrib.auth.forms import AuthenticationForm
from django.shortcuts import render, redirect, get_object_or_404
from .utils import generate_jwt_token, store_user_token
from django.db import IntegrityError
from django.shortcuts import render
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.http import JsonResponse, HttpResponseBadRequest
import logging, json, traceback
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string




@csrf_exempt
def logear(request):
    if request.method == "POST":
        usuario = request.POST.get('usuario')
        contrasena = request.POST.get('contrasena')
        
        try:
            user = Usuario.objects.get(usuario=usuario)
            if check_password(contrasena, user.contrasena):
                token = generate_jwt_token(user.id)
                store_user_token(request, token)
                # Almacenar información del usuario en la sesión, incluyendo el rol
                request.session['user_data'] = {'user_id': user.id, 'usuario': user.usuario, 'rol': user.rol}
                
                # Imprimir el rol, token y nombre del usuario en la consola del servidor
                print(f"Usuario autenticado: {user.usuario}")
                print(f"Rol del usuario: {user.rol}")
                print(f"Token del usuario: {token}")
                
                return JsonResponse({
                    'success': True,
                    'token': token,
                    'accion': 'login',
                    'redirect_url': '/sesion-exitosa/'
                })
            else:
                return JsonResponse({'success': False, 'error': 'Contraseña incorrecta'}, status=401)
        except Usuario.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Usuario no encontrado'}, status=404)
    elif request.method == "GET":
        form = AuthenticationForm()
        return render(request, "index.html", {"form": form})
    else:
        return JsonResponse({'error': 'Método no permitido'}, status=405)



@csrf_exempt
def sesion_exitosa(request):
    user_data = request.session.get('user_data')
    
    if not user_data:
        return redirect('login')

    try:
        user = Usuario.objects.get(id=user_data['user_id'])

        # Pasar el rol del usuario al contexto y la URL de la foto de perfil
        contexto = {
            'usuario_nombre': user.usuario,
            'usuario_rol': user.rol,
            'profile_photo_url': f"{settings.MEDIA_URL}{user.profile_photo}" if user.profile_photo else None,
            'is_admin_or_director': user.rol in ['Administrador', 'Director', 'Subdirectora'],
            'is_docente': user.rol == 'Docente',  # Verifica si el usuario es docente
            'is_secretaria': user.rol == 'Secretaria',
            'is_otros_docentes': user.rol in ['Docente_Folklore', 'Docente_Educ._Fisica', 'Docente_C.B.I.T']
        }

        return render(request, 'sesion_exitosa.html', contexto)
    except Usuario.DoesNotExist:
        return redirect('login')



@csrf_exempt
def get_user_data(request):
    user_data = request.session.get('user_data')
    
    if not user_data:
        return JsonResponse({'success': False, 'error': 'No autenticado'}, status=401)

    try:
        user = Usuario.objects.get(id=user_data['user_id'])
        return JsonResponse({
            'success': True,
            'usuario_nombre': user.usuario,
            'usuario_rol': user.rol
        })
    except Usuario.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Usuario no encontrado'}, status=404)




logger = logging.getLogger(__name__)

def normalizar_telefono(telefono):
    # Eliminar cualquier carácter que no sea un número
    telefono = ''.join(filter(str.isdigit, telefono))

    # Verificar si el teléfono ya tiene el formato correcto
    if telefono.startswith('58'):
        return f'+{telefono}'
    
    # Si el teléfono empieza con 04 o 4, agregar el prefijo +58
    if telefono.startswith('04'):
        return f'+58{telefono[1:]}'
    elif telefono.startswith('4'):
        return f'+584{telefono[1:]}'

    # Si ya tiene el formato correcto con +58, devolverlo tal cual
    return f'+58{telefono}'


@csrf_exempt
def agregar_usuario(request):
    if request.method == 'POST':
        nombres = request.POST.get('nombres')
        apellidos = request.POST.get('apellidos')
        cedula = request.POST.get('cedula')
        usuario = request.POST.get('usuario')
        contrasena = request.POST.get('contrasena')
        correo = request.POST.get('correo')
        telefonos = request.POST.get('telefonos')
        fecha_nac = request.POST.get('fecha_nac')  # Agregar la fecha de nacimiento
        direccion = request.POST.get('direccion')
        rol = request.POST.get('rol')
        
        # Verificar si el correo ya está en uso
        if Usuario.objects.filter(correo=correo).exists():
            return JsonResponse({'success': False, 'error': 'Correo ya está en uso'}, status=400)

        # Normalizar el teléfono antes de guardarlo
        telefonos_normalizado = normalizar_telefono(telefonos)

        nuevo_usuario = Usuario(
            nombres=nombres,
            apellidos=apellidos,
            cedula=cedula,
            usuario=usuario,
            contrasena=make_password(contrasena),
            correo=correo,
            telefonos=telefonos_normalizado,
            direccion=direccion,
            rol=rol
        )

        try:
            nuevo_usuario.save()

            # Enviar correo de bienvenida
            enviar_email_notificacion(nuevo_usuario, 'registro')

            return JsonResponse({'success': True})
        except IntegrityError as e:
            logger.error(f"Error al guardar el usuario: {str(e)}")
            return JsonResponse({'success': False, 'error': f'Error al guardar el usuario: {str(e)}'}, status=500)

    return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)

@csrf_exempt
def modificar_usuario(request):
    if request.method == 'POST':
        data = request.POST
        try:
            usuario = Usuario.objects.get(id=data['id'])
            usuario.nombres = data['nombres']
            usuario.apellidos = data['apellidos']
            usuario.cedula = data['cedula']
            usuario.usuario = data['usuario']
            
            # Verificamos si se proporcionó una nueva contraseña y si es diferente de la actual
            nueva_contrasena = data['contrasena']
            if nueva_contrasena and make_password(nueva_contrasena) != usuario.contrasena:
                usuario.contrasena = make_password(nueva_contrasena)
                # Enviar correo de cambio de contraseña con la contraseña sin hashear
                enviar_email_notificacion(usuario, 'cambio_contrasena', contrasena=nueva_contrasena)

            usuario.correo = data['correo']
            usuario.telefonos = data['telefonos']
            usuario.fecha_nac = data['fecha_nac']
            usuario.direccion = data['direccion']
            usuario.rol = data['rol']
            usuario.save()


            return JsonResponse({'success': True})
        except Usuario.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Usuario no encontrado'}, status=404)
    return JsonResponse({'success': False, 'error': 'Invalid method'}, status=405)

@csrf_exempt
def eliminar_usuario(request):
    if request.method == 'POST':
        data = request.POST
        try:
            usuario = Usuario.objects.get(id=data['id'])
            usuario.delete()
            return JsonResponse({'success': True})
        except Usuario.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Usuario no encontrado'}, status=404)
    return JsonResponse({'success': False, 'error': 'Invalid method'}, status=405)


@csrf_exempt
def logout_view(request):
    if request.method == 'POST':
        # Obtener información del usuario logueado para depuración
        user_data = request.session.get('user_data')
        if user_data:
            print(f"Cierre de sesión solicitado por: {user_data.get('user_name')} (Rol: {user_data.get('user_role')})")

        # Eliminar el token de la sesión
        if 'user_token' in request.session:
            del request.session['user_token']
        if 'user_data' in request.session:
            del request.session['user_data']
        
        print("Cierre de sesión exitoso.")  # Depuración para confirmar que el cierre de sesión es exitoso
        return redirect('login')  # Redirigir al login después de cerrar sesión
    
    return JsonResponse({'error': 'Método no permitido'}, status=405)



@csrf_exempt
def sesion_exitosa(request):
    user_data = request.session.get('user_data')

    if not user_data:
        return redirect('login')

    try:
        user = Usuario.objects.get(id=user_data['user_id'])

        # Pasar el rol del usuario al contexto y la URL de la foto de perfil
        contexto = {
            'usuario_nombre': user.usuario,
            'usuario_rol': user.rol,
            'profile_photo_url': f"{settings.MEDIA_URL}{user.profile_photo}" if user.profile_photo else None,
            
            # Administrador, Director, Subdirectora roles
            'is_admin_or_director': user.rol in ['Administrador', 'Director', 'Subdirectora'],
            
            # Secretaria rol
            'is_secretaria': user.rol == 'Secretaria',

            # Rol de "Docente"
            'is_docente': user.rol == 'Docente',

            # Roles adicionales (Docente Folklore, Docente Educ. Fisica, Coordinadora, Docente C.B.I.T)
            'is_otros_docentes': user.rol in ['Docente Folklore', 'Docente Educ. Fisica', 'Coordinadora', 'Docente C.B.I.T'],
            # Agregar una variable para controlar la visibilidad del botón de "Salir"
            'show_logout': True,
        }

        return render(request, 'sesion_exitosa.html', contexto)
    except Usuario.DoesNotExist:
        return redirect('login')



# Para obtener la lista de usuarios dentro de la base de datos
def get_usuarios(request):
    usuarios = list(Usuario.objects.all().values(
        'id', 'nombres', 'apellidos', 'cedula', 'usuario', 'contrasena', 'correo', 'telefonos', 'fecha_nac', 'direccion', 'rol' 
    ))
    return JsonResponse({'usuarios': usuarios})
# Fin de obtencion la lista de usuarios dentro de la base de datos



# Para obtener el usuario a modificar dentro de la base de datos
def get_usuario(request, user_id):
    try:
        usuario = Usuario.objects.get(id=user_id)
        data = {
            'success': True,
            'usuario': {
                'nombres': usuario.nombres,
                'apellidos': usuario.apellidos,
                'cedula': usuario.cedula,
                'usuario': usuario.usuario,
                'contrasena': usuario.contrasena,
                'correo': usuario.correo,
                'telefonos': usuario.telefonos,
                'fecha_nac': usuario.fecha_nac,
                'direccion': usuario.direccion,
                'rol': usuario.rol
            }
        }
    except Usuario.DoesNotExist:
        data = {
            'success': False,
            'error': 'Usuario no encontrado'
        }

    return JsonResponse(data)
# Para obtener el usuario a modificar dentro de la base de datos




@csrf_exempt
def get_estudiantes(request):
    user_data = request.session.get('user_data')
    user = Usuario.objects.get(id=user_data['user_id'])

    # Diccionario de mapeo
    grade_mapping = {
        'IV': '1º',
        'V': '2º',
        'VI': '3º',
        'VII': '4º',
        'VIII': '5º',
        'IX': '6º',
    }

    if user.rol in ['Subdirectora', 'Secretaria', 'Director', 'Coordinadora', 'Administrador', 'Docente Folklore', 'Docente Educ. Fisica', 'Docente C.B.I.T']:
        # Estos roles ven a todos los estudiantes
        estudiantes = Estudiante.objects.annotate(
        grado_order=Case(
            When(grado='I', then=Value(1)),
            When(grado='II', then=Value(2)),
            When(grado='III', then=Value(3)),
            When(grado='IV', then=Value(4)),
            When(grado='V', then=Value(5)),
            When(grado='VI', then=Value(6)),
            When(grado='VII', then=Value(7)),
            When(grado='VIII', then=Value(8)),
            When(grado='IX', then=Value(9)),
            default=Value(10),
            output_field=IntegerField(),
        )
    ).order_by('grado_order', 'seccion', 'apellidos_nombres').select_related('docente').values(
            'id', 'ci', 'apellidos_nombres', 'grado', 'seccion', 'sexo', 'edad',
            'lugar_nac', 'fecha_nac', 'talla', 'peso', 'talla_camisa', 'talla_pantalon', 'talla_zapatos',
            'representante', 'ci_representante', 'direccion', 'tlf',
            'nombre_apellido_persona_autorizada_para_retirar_estudiante', 
            'ci_persona_autorizada', 'tlf_persona_autorizada', 'parentezco_persona_autorizada',
            'notas', 'promocion_solicitada', 'promocion_aprobada',
            'docente_id', 'docente2_id', 'docente3_id'
        )
    elif user.rol == 'Docente':
        # Los docentes solo ven los estudiantes asignados a ellos
        estudiantes = Estudiante.objects.filter(
            Q(docente_id=user.id) | Q(docente2_id=user.id) | Q(docente3_id=user.id)
        ).select_related('docente').values(
            'id', 'ci', 'apellidos_nombres', 'grado', 'seccion', 'sexo', 'edad',
            'lugar_nac', 'fecha_nac', 'talla', 'peso', 'talla_camisa', 'talla_pantalon', 'talla_zapatos',
            'representante', 'ci_representante', 'direccion', 'tlf',
            'nombre_apellido_persona_autorizada_para_retirar_estudiante', 
            'ci_persona_autorizada', 'tlf_persona_autorizada', 'parentezco_persona_autorizada',
            'notas', 'promocion_solicitada', 'promocion_aprobada',
            'docente_id', 'docente2_id', 'docente3_id'
        )

    # Convertimos el queryset en una lista de diccionarios
    estudiantes_list = list(estudiantes)

    # Aplicamos el mapeo a cada estudiante
    for estudiante in estudiantes_list:
        grado_original = estudiante['grado']
        estudiante['grado'] = grade_mapping.get(grado_original, grado_original)

    return JsonResponse({'estudiantes': estudiantes_list})





def vista_constancia(request, estudiante_id):
    pdf = constancia_estudio(estudiante_id)

    # Crear una respuesta HTTP con el PDF como contenido y los headers correctos
    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="Constancia_de_estudio.pdf"'

    # Obtener información del usuario que descarga la constancia desde la sesión
    user_data = request.session.get('user_data')
    if user_data:
        nombre_usuario = user_data.get('usuario')
        rol_usuario = user_data.get('rol')
    else:
        nombre_usuario = "Usuario Anónimo"
        rol_usuario = "Anónimo"

    # Enviar el correo de notificación
    #enviar_correo_constancia(nombre_usuario, rol_usuario, pdf, "Constancia de Estudio")

    return response

def vista_constancia_asistencia(request, estudiante_id):
    pdf = constancia_asistencia(estudiante_id)

    # Crear una respuesta HTTP con el PDF como contenido y los headers correctos
    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="Constancia_de_asistencia.pdf"'

    # Obtener información del usuario que descarga la constancia desde la sesión
    user_data = request.session.get('user_data')
    if user_data:
        nombre_usuario = user_data.get('usuario')
        rol_usuario = user_data.get('rol')
    else:
        nombre_usuario = "Usuario Anónimo"
        rol_usuario = "Anónimo"

    # Enviar el correo de notificación
    #enviar_correo_constancia(nombre_usuario, rol_usuario, pdf, "Constancia de Asistencia")

    return response

def vista_constancia_inscripcion(request, estudiante_id):
    pdf = constancia_inscripcion(estudiante_id)

    # Crear una respuesta HTTP con el PDF como contenido y los headers correctos
    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="Constancia_de_inscripcion.pdf"'

    # Obtener información del usuario que descarga la constancia desde la sesión
    user_data = request.session.get('user_data')
    if user_data:
        nombre_usuario = user_data.get('usuario')
        rol_usuario = user_data.get('rol')
    else:
        nombre_usuario = "Usuario Anónimo"
        rol_usuario = "Anónimo"

    # Enviar el correo de notificación
    #enviar_correo_constancia(nombre_usuario, rol_usuario, pdf, "Constancia de Inscripción")

    return response

def vista_constancia_retiro(request, estudiante_id):
    pdf = constancia_retiro(estudiante_id)

    # Crear una respuesta HTTP con el PDF como contenido y los headers correctos
    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="Constancia_de_retiro.pdf"'

    # Obtener información del usuario que descarga la constancia desde la sesión
    user_data = request.session.get('user_data')
    if user_data:
        nombre_usuario = user_data.get('usuario')
        rol_usuario = user_data.get('rol')
    else:
        nombre_usuario = "Usuario Anónimo"
        rol_usuario = "Anónimo"

    try:
        estudiante = Estudiante.objects.get(id=estudiante_id)
        estudiante.delete()
    except Estudiante.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Estudiante no encontrado'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

    # Enviar el correo de notificación
    #enviar_correo_constancia(nombre_usuario, rol_usuario, pdf, "Constancia de Retiro")

    return response



logger = logging.getLogger(__name__)

def generar_boletin_1er_momento_preescolar(request, estudiante_id):
    user_data = request.session.get('user_data')
    
    if not user_data:
        return redirect('login')

    try:
        usuario_actual = Usuario.objects.get(id=user_data['user_id'])
    except Usuario.DoesNotExist:
        return redirect('login')

    if request.method == 'POST':
        datos_boletin = {
            'formacionPersonal': request.POST['formacionPersonal'],
            'relacionAmbiente': request.POST['relacionAmbiente'],
            'comunicacionRepresentacion': request.POST['comunicacionRepresentacion'],
            'sugerencias': request.POST['sugerencias'],
            'diasHabiles': request.POST['diasHabiles'],
            'asistencias': request.POST['asistencias'],
            'inasistencias': request.POST['inasistencias']
        }

        pdf = generar_boletin(estudiante_id, datos_boletin, usuario_actual)
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="boletin_{estudiante_id}.pdf"'
        return response
    else:
        # Manejar GET request o redirigir a una página adecuada si no es un POST request
        return HttpResponse("Método no permitido", status=405)
    


    
def generar_boletin_primaria(request, estudiante_id):
    user_data = request.session.get('user_data')
    
    if not user_data:
        return redirect('login')

    try:
        usuario_actual = Usuario.objects.get(id=user_data['user_id'])
    except Usuario.DoesNotExist:
        return redirect('login')

    if request.method == 'POST':
        datos_boletin = {
            'habilidadesConsolidadas': request.POST['habilidadesConsolidadas'],
            'habilidadesporConsolidar': request.POST['habilidadesporConsolidar'],
            'sugerencias': request.POST['sugerencias'],
            'diasHabiles': request.POST['diasHabiles'],
            'asistencias': request.POST['asistencias'],
            'inasistencias': request.POST['inasistencias'],
            'nombre_proyecto': request.POST['nombre_proyecto'],
            'fechaDesde': request.POST['fechaDesde'],
            'fechaHasta': request.POST['fechaHasta']
        }

        pdf = generar_boletin_primaria_pdf(estudiante_id, datos_boletin, usuario_actual)
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="boletin_primaria_{estudiante_id}.pdf"'
        return response
    else:
        return HttpResponse("Método no permitido", status=405)


@csrf_exempt
def change_profile_photo(request):
    user_data = request.session.get('user_data')
    
    if not user_data:
        return redirect('login')

    try:
        usuario_actual = Usuario.objects.get(id=user_data['user_id'])
    except Usuario.DoesNotExist:
        return redirect('login')

    if request.method == 'POST' and request.FILES.get('profile_photo'):
        profile_photo = request.FILES['profile_photo']

        # Guarda la foto de perfil en una carpeta específica
        file_name = f"profile_photos/{usuario_actual.id}_{profile_photo.name}"
        file_path = default_storage.save(file_name, ContentFile(profile_photo.read()))

        # Actualiza la URL de la foto de perfil en el modelo de usuario
        usuario_actual.profile_photo = file_path
        usuario_actual.save()

        return JsonResponse({'success': True, 'new_profile_photo_url': default_storage.url(file_path)})
    else:
        return HttpResponseBadRequest('Invalid request')

@csrf_exempt
def crear_tarea(request):
    user_data = request.session.get('user_data')
    
    if not user_data:
        return redirect('login')

    usuario = Usuario.objects.get(id=user_data['user_id'])

    if request.method == 'POST':
        nombre = request.POST.get('nombre')
        descripcion = request.POST.get('descripcion')
        fecha = request.POST.get('fecha')

        tarea = Tarea.objects.create(
            nombre=nombre,
            descripcion=descripcion,
            fecha=fecha,
            estado='Pendiente',
            usuario=usuario  # Asocia la tarea al usuario
        )

        enviar_email_notificacion(usuario, 'tarea_creada', tarea) #Envia el correo al crear una tarea
        
        return JsonResponse({'success': True})
    else:
        return JsonResponse({'success': False, 'error': 'Invalid request'}, status=400)

@csrf_exempt
def actualizar_tarea(request):
    user_data = request.session.get('user_data')
    
    if not user_data:
        return redirect('login')

    usuario = Usuario.objects.get(id=user_data['user_id'])

    if request.method == 'POST':
        tarea_id = request.POST.get('id')
        nombre = request.POST.get('nombre')
        descripcion = request.POST.get('descripcion')
        fecha = request.POST.get('fecha')

        try:
            tarea = Tarea.objects.get(id=tarea_id, usuario=usuario)
            tarea.nombre = nombre
            tarea.descripcion = descripcion
            tarea.fecha = fecha
            tarea.save()

            enviar_email_notificacion(usuario, 'tarea_actualizada', tarea) #Envia el correo al actualizar una tarea

            return JsonResponse({'success': True})
        except Tarea.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Tarea no encontrada'}, status=404)
    else:
        return JsonResponse({'success': False, 'error': 'Invalid request'}, status=400)

@csrf_exempt
def eliminar_tarea(request):
    user_data = request.session.get('user_data')
    
    if not user_data:
        return redirect('login')

    usuario = Usuario.objects.get(id=user_data['user_id'])

    if request.method == 'POST':
        tarea_id = request.POST.get('id')

        try:
            tarea = Tarea.objects.get(id=tarea_id, usuario=usuario)
            tarea.delete()
            return JsonResponse({'success': True})
        except Tarea.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Tarea no encontrada'}, status=404)
    else:
        return JsonResponse({'success': False, 'error': 'Invalid request'}, status=400)

@csrf_exempt
def obtener_tareas(request):
    user_data = request.session.get('user_data')
    
    if not user_data:
        return redirect('login')

    usuario = Usuario.objects.get(id=user_data['user_id'])

    tareas = Tarea.objects.filter(usuario=usuario).values('id', 'nombre', 'descripcion', 'fecha', 'estado')
    tareas_list = list(tareas)

    return JsonResponse({'tareas': tareas_list})

@csrf_exempt
def obtener_tarea(request, tarea_id):
    user_data = request.session.get('user_data')
    
    if not user_data:
        return redirect('login')

    usuario = Usuario.objects.get(id=user_data['user_id'])

    try:
        tarea = Tarea.objects.get(id=tarea_id, usuario=usuario)
        tarea_data = {
            'id': tarea.id,
            'nombre': tarea.nombre,
            'descripcion': tarea.descripcion,
            'fecha': tarea.fecha,
            'estado': tarea.estado
        }
        return JsonResponse({'success': True, 'tarea': tarea_data})
    except Tarea.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Tarea no encontrada'}, status=404)

@csrf_exempt
def tarea_completada(request):
    user_data = request.session.get('user_data')
    
    if not user_data:
        return redirect('login')

    usuario = Usuario.objects.get(id=user_data['user_id'])

    if request.method == 'POST':
        tarea_id = request.POST.get('id')

        try:
            tarea = Tarea.objects.get(id=tarea_id, usuario=usuario)
            tarea.estado = 'Completada'
            tarea.save()
            return JsonResponse({'success': True})
        except Tarea.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Tarea no encontrada'}, status=404)
    else:
        return JsonResponse({'success': False, 'error': 'Invalid request'}, status=400)



##################################################  NOTAS ##########################################################


def get_docentes(request):
    docentes = Usuario.objects.filter(rol='Docente').annotate(
        grado=Subquery(
            Estudiante.objects.filter(
                Q(docente=OuterRef('id')) |
                Q(docente2=OuterRef('id')) |
                Q(docente3=OuterRef('id'))
            ).values('grado')[:1]
        ),
        seccion=Subquery(
            Estudiante.objects.filter(
                Q(docente=OuterRef('id')) |
                Q(docente2=OuterRef('id')) |
                Q(docente3=OuterRef('id'))
            ).values('seccion')[:1]
        )
    ).values('id', 'nombres', 'apellidos', 'grado', 'seccion')
    return JsonResponse({'docentes': list(docentes)})


@csrf_exempt
def asignar_docente(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            docente_id = data.get('docente_id')
            grado = data.get('grado')
            seccion = data.get('seccion')

            # Limpiar asignaciones previas para este docente
            Estudiante.objects.filter(Q(docente=docente_id) | Q(docente2=docente_id) | Q(docente3=docente_id)).update(docente=None, docente2=None, docente3=None)

            # Definir qué grados y secciones permiten hasta 3 docentes
            grados_secciones_3_docentes = [
                ('I', 'U'), ('II', 'U'), ('III', 'A'), ('III', 'B'),
                ('IV', 'A'), ('IV', 'B')
            ]

            # Verificación del número de docentes permitidos según el grado y sección
            if (grado, seccion) in grados_secciones_3_docentes:
                max_docentes = 3  # Permitir hasta 3 docentes en estos grados y secciones
            else:
                max_docentes = 1  # Permitir solo 1 docente para el resto

            # Verifica cuántos docentes ya están asignados al mismo grado y sección
            estudiantes_asignados = Estudiante.objects.filter(grado=grado, seccion=seccion)
            
            # Contar docentes únicos asignados en los campos docente, docente2, docente3
            docentes_actuales = estudiantes_asignados.values_list('docente', 'docente2', 'docente3').distinct()
            docentes_contados = len(set([doc for sublist in docentes_actuales for doc in sublist if doc]))

            print(f'Número de docentes asignados en {grado} {seccion}: {docentes_contados}')

            # Si ya hay el número máximo de docentes, no permitir más asignaciones
            if docentes_contados >= max_docentes:
                return JsonResponse({'success': False, 'error': f'Este grado y sección ya tienen asignados {max_docentes} docentes. Reasigna primero.'})

            # Asignar el docente al primer campo disponible
            if estudiantes_asignados.filter(docente__isnull=True).exists():
                estudiantes_asignados.update(docente=docente_id)
            elif estudiantes_asignados.filter(docente2__isnull=True).exists():
                estudiantes_asignados.update(docente2=docente_id)
            elif estudiantes_asignados.filter(docente3__isnull=True).exists():
                estudiantes_asignados.update(docente3=docente_id)

            return JsonResponse({'success': True, 'message': 'Docente asignado correctamente.'})

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)

    return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)



@csrf_exempt
def obtener_notas(request, estudiante_id):
    estudiante = get_object_or_404(Estudiante, id=estudiante_id)
    return JsonResponse({'notas': estudiante.notas})

@csrf_exempt
def registrar_notas(request, estudiante_id):
    user_data = request.session.get('user_data')
    
    if not user_data:
        return redirect('login')

    usuario_rol = user_data.get('rol')
    docente_id = user_data.get('id')  # Obteniendo el ID del docente desde la sesión

    try:
        estudiante = Estudiante.objects.get(id=estudiante_id)
        print(f"Estudiante encontrado: {estudiante.apellidos_nombres}, Docente asignado antes: {estudiante.docente_id}")
    except Estudiante.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Estudiante no encontrado'}, status=404)

    if request.method == 'POST':
        if usuario_rol == 'Docente':
            data = json.loads(request.body)
            notas = data.get('notas')
            
            if notas is not None:
                if all(nota in 'ABCDE' for nota in notas.replace(',', '').replace(' ', '').split()):
                    estudiante.notas = {'notas': notas}

                    if estudiante.docente_id is None:
                        estudiante.docente_id = docente_id
                        print(f"Docente ID {docente_id} asignado a Estudiante ID {estudiante_id}")
                    else:
                        print(f"Docente ya asignado: {estudiante.docente_id}")

                    estudiante.promocion_solicitada = True
                    estudiante.promocion_aprobada = False

                    # Guardado de estudiante con depuración
                    print(f"Guardando estudiante ID {estudiante.id} con Docente ID {estudiante.docente_id}")
                    estudiante.save()

                    # Verificar después de guardar
                    estudiante.refresh_from_db()
                    print(f"Docente ID después de guardar: {estudiante.docente_id}")
                    
                    return JsonResponse({'success': True})
                else:
                    return JsonResponse({'success': False, 'error': 'Formato de notas inválido'}, status=400)
            else:
                return JsonResponse({'success': False, 'error': 'No se proporcionaron notas'}, status=400)
        else:
            return JsonResponse({'success': False, 'error': 'Permiso denegado'}, status=403)
    else:
        return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)



def siguiente_grado(grado_actual):
    grados = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']
    grado_actual = grado_actual.strip()  # Eliminar espacios en blanco
    if grado_actual not in grados:
        print(f"El grado {grado_actual} no se encuentra en la lista de grados.")
        return grado_actual

    try:
        indice_actual = grados.index(grado_actual)
        return grados[indice_actual + 1] if indice_actual < len(grados) - 1 else grado_actual
    except ValueError:
        return grado_actual



@csrf_exempt
def aprobar_promocion(request, estudiante_id):
    try:
        estudiante = Estudiante.objects.get(id=estudiante_id)
        estudiante.promocion_aprobada = True
        estudiante.promocion_solicitada = False
        nuevo_grado = siguiente_grado(estudiante.grado)
        print(f"Cambiando grado de {estudiante.grado} a {nuevo_grado}")  # Depuración
        estudiante.grado = nuevo_grado  # Actualizar al siguiente grado
        estudiante.save()
        return JsonResponse({'success': True})
    except Estudiante.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Estudiante no encontrado'}, status=404)


@csrf_exempt
def denegar_promocion(request, estudiante_id):
    try:
        estudiante = Estudiante.objects.get(id=estudiante_id)
        estudiante.promocion_solicitada = False
        estudiante.save()
        return JsonResponse({'success': True})
    except Estudiante.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Estudiante no encontrado'}, status=404)


############################# FIN NOTAS ###################################

@csrf_exempt
def agregar_estudiante(request):
    if request.method == 'POST':
        # Obtener los datos del formulario usando request.POST en lugar de json.loads(request.body)
        ci = request.POST.get('ci')
        apellidos_nombres = request.POST.get('apellidos_nombres')
        grado = request.POST.get('grado')
        seccion = request.POST.get('seccion')
        sexo = request.POST.get('sexo')
        edad = request.POST.get('edad')
        lugar_nac = request.POST.get('lugar_nac')
        fecha_nac = request.POST.get('fecha_nac')
        talla = request.POST.get('talla')
        peso = request.POST.get('peso')
        talla_camisa = request.POST.get('talla_camisa')
        talla_pantalon = request.POST.get('talla_pantalon')
        talla_zapatos = request.POST.get('talla_zapatos')
        representante = request.POST.get('representante')
        ci_representante = request.POST.get('ci_representante')
        direccion = request.POST.get('direccion')
        tlf = request.POST.get('tlf')
        nombre_apellido_persona_autorizada_para_retirar_estudiante = request.POST.get('nombre_apellido_persona_autorizada_para_retirar_estudiante')
        ci_persona_autorizada = request.POST.get('ci_persona_autorizada')
        tlf_persona_autorizada = request.POST.get('tlf_persona_autorizada')
        parentezco_persona_autorizada = request.POST.get('parentezco_persona_autorizada')
        
        campos_con_sn = [
            'talla', 
            'peso', 
            'talla_camisa', 
            'talla_pantalon', 
            'talla_zapatos', 
            'direccion', 
            'tlf', 
            'nombre_apellido_persona_autorizada_para_retirar_estudiante', 
            'ci_persona_autorizada', 
            'tlf_persona_autorizada', 
            'parentezco_persona_autorizada'
        ]

        # Mostrar los valores antes de la conversión
        print("Valores originales de los campos:")
        for campo in campos_con_sn:
            print(f"{campo}: {locals().get(campo)}")

        # Actualizar los campos vacíos o con 'S/N' según sea numérico o de texto
        talla = -1 if talla == 'S/N' or not talla else talla
        peso = -1 if peso == 'S/N' or not peso else peso
        talla_camisa = 'S/N' if talla_camisa == 'S/N' or not talla_camisa else talla_camisa
        talla_pantalon = 'S/N' if talla_pantalon == 'S/N' or not talla_pantalon else talla_pantalon
        talla_zapatos = -1 if talla_zapatos == 'S/N' or not talla_zapatos else talla_zapatos
        lugar_nac = 'S/N' if not lugar_nac else lugar_nac
        fecha_nac = 'S/N' if not fecha_nac else fecha_nac
        representante = 'S/N' if not representante else representante
        ci_representante = 'S/N' if not ci_representante else ci_representante
        direccion = 'S/N' if not direccion else direccion
        tlf = 'S/N' if not tlf else tlf
        nombre_apellido_persona_autorizada_para_retirar_estudiante = 'S/N' if not nombre_apellido_persona_autorizada_para_retirar_estudiante else nombre_apellido_persona_autorizada_para_retirar_estudiante
        ci_persona_autorizada = 'S/N' if not ci_persona_autorizada else ci_persona_autorizada
        tlf_persona_autorizada = 'S/N' if not tlf_persona_autorizada else tlf_persona_autorizada
        parentezco_persona_autorizada = 'S/N' if not parentezco_persona_autorizada else parentezco_persona_autorizada

        # Mostrar los valores después de la conversión
        print("Valores después de la conversión:")
        for campo in campos_con_sn:
            print(f"{campo}: {locals().get(campo)}")


        try:
            # Crear el nuevo estudiante
            nuevo_estudiante = Estudiante(
                ci=ci,
                apellidos_nombres=apellidos_nombres,
                grado=grado,
                seccion=seccion,
                sexo=sexo,
                edad=edad,
                lugar_nac=lugar_nac,
                fecha_nac=fecha_nac,  # Asegúrate de que el formato de la fecha sea correcto (YYYY-MM-DD)
                talla=talla,
                peso=peso,
                talla_camisa=talla_camisa,
                talla_pantalon=talla_pantalon,
                talla_zapatos=talla_zapatos,
                representante=representante,
                ci_representante=ci_representante,
                direccion=direccion,
                tlf=tlf,
                nombre_apellido_persona_autorizada_para_retirar_estudiante=nombre_apellido_persona_autorizada_para_retirar_estudiante,
                ci_persona_autorizada=ci_persona_autorizada,
                tlf_persona_autorizada=tlf_persona_autorizada,
                parentezco_persona_autorizada=parentezco_persona_autorizada
            )
            nuevo_estudiante.save()

            return JsonResponse({'success': True})

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Método no permitido'})


@csrf_exempt
def modificar_estudiante(request):
    if request.method == 'POST':
        # Obtener los datos del formulario usando request.POST en lugar de json.loads(request.body)
        ci = request.POST.get('ci')
        apellidos_nombres = request.POST.get('apellidos_nombres')
        grado = request.POST.get('grado')
        seccion = request.POST.get('seccion')
        sexo = request.POST.get('sexo')
        edad = request.POST.get('edad')
        lugar_nac = request.POST.get('lugar_nac')
        fecha_nac = request.POST.get('fecha_nac')
        talla = request.POST.get('talla')
        peso = request.POST.get('peso')
        talla_camisa = request.POST.get('talla_camisa')
        talla_pantalon = request.POST.get('talla_pantalon')
        talla_zapatos = request.POST.get('talla_zapatos')
        representante = request.POST.get('representante')
        ci_representante = request.POST.get('ci_representante')
        direccion = request.POST.get('direccion')
        tlf = request.POST.get('tlf')
        nombre_apellido_persona_autorizada_para_retirar_estudiante = request.POST.get('nombre_apellido_persona_autorizada_para_retirar_estudiante')
        ci_persona_autorizada = request.POST.get('ci_persona_autorizada')
        tlf_persona_autorizada = request.POST.get('tlf_persona_autorizada')
        parentezco_persona_autorizada = request.POST.get('parentezco_persona_autorizada')
        
        try:
            # Busca al estudiante por su ID o CI (dependiendo de cómo quieras buscarlo)
            estudiante = Estudiante.objects.get(ci=ci)
            estudiante.apellidos_nombres = apellidos_nombres
            estudiante.grado = grado
            estudiante.seccion = seccion
            estudiante.sexo = sexo
            estudiante.edad = edad
            estudiante.lugar_nac = lugar_nac
            estudiante.fecha_nac = fecha_nac  # Asegúrate de que el formato sea correcto
            estudiante.talla = talla
            estudiante.peso = peso
            estudiante.talla_camisa = talla_camisa
            estudiante.talla_pantalon = talla_pantalon
            estudiante.talla_zapatos = talla_zapatos
            estudiante.representante = representante
            estudiante.ci_representante = ci_representante
            estudiante.direccion = direccion
            estudiante.tlf = tlf
            estudiante.nombre_apellido_persona_autorizada_para_retirar_estudiante = nombre_apellido_persona_autorizada_para_retirar_estudiante
            estudiante.ci_persona_autorizada = ci_persona_autorizada
            estudiante.tlf_persona_autorizada = tlf_persona_autorizada
            estudiante.parentezco_persona_autorizada = parentezco_persona_autorizada
            estudiante.save()

            return JsonResponse({'success': True})

        except Estudiante.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Estudiante no encontrado'})

    return JsonResponse({'success': False, 'error': 'Método no permitido'})


@csrf_exempt
def eliminar_estudiante(request):
    if request.method == 'POST':
        try:
            estudiante = Estudiante.objects.get(id=request.POST.get('id'))
            estudiante.delete()
            return JsonResponse({'success': True})
        except Estudiante.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Estudiante no encontrado'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Método no permitido'})



def get_estudiante(request, id):
    try:
        estudiante = Estudiante.objects.get(id=id)
        fecha_nac = estudiante.fecha_nac

        # Si fecha_nac ya es una cadena de texto, no necesita formateo
        if isinstance(fecha_nac, str):
            fecha_nac_str = fecha_nac
        else:
            # Si es un objeto de fecha, lo formateamos
            fecha_nac_str = fecha_nac.strftime('%Y-%m-%d')

        estudiante_data = {
            'id': estudiante.id,
            'ci': estudiante.ci,
            'apellidos_nombres': estudiante.apellidos_nombres,
            'grado': estudiante.grado,
            'seccion': estudiante.seccion,
            'sexo': estudiante.sexo,
            'edad': estudiante.edad,
            'lugar_nac': estudiante.lugar_nac,
            'fecha_nac': fecha_nac_str,  # Usar el valor formateado
            'talla': estudiante.talla,  # Agregando la talla
            'peso': estudiante.peso,  # Agregando el peso
            'talla_camisa': estudiante.talla_camisa,  # Agregando la talla de camisa
            'talla_pantalon': estudiante.talla_pantalon,  # Agregando la talla de pantalón
            'talla_zapatos': estudiante.talla_zapatos,  # Agregando la talla de zapatos
            'representante': estudiante.representante,
            'ci_representante': estudiante.ci_representante,
            'direccion': estudiante.direccion,
            'tlf': estudiante.tlf,
            'nombre_apellido_persona_autorizada_para_retirar_estudiante': estudiante.nombre_apellido_persona_autorizada_para_retirar_estudiante,  # Agregando el nombre completo de la persona autorizada
            'ci_persona_autorizada': estudiante.ci_persona_autorizada,  # Agregando la cédula de la persona autorizada
            'tlf_persona_autorizada': estudiante.tlf_persona_autorizada,  # Agregando el teléfono de la persona autorizada
            'parentezco_persona_autorizada': estudiante.parentezco_persona_autorizada  # Agregando el parentesco de la persona autorizada
        }
        return JsonResponse({'estudiante': estudiante_data}, status=200)
    except Estudiante.DoesNotExist:
        return JsonResponse({'error': 'Estudiante no encontrado'}, status=404)
    


################################## correos #################################

def enviar_email_notificacion(usuario, accion, tarea=None, contrasena=None):
    try:
        logger.info(f"Iniciando envío de correo para acción: {accion}")



        if accion == 'tarea_creada':
            asunto = 'Nueva Tarea Creada'
            mensaje = render_to_string('emails/tarea_creada.html', {'usuario': usuario, 'tarea': tarea})
        elif accion == 'tarea_actualizada':
            asunto = 'Tarea Actualizada'
            mensaje = render_to_string('emails/tarea_actualizada.html', {'usuario': usuario, 'tarea': tarea})

        elif accion == 'registro':
            asunto = 'Bienvenido al Sistema de Gestión Administrativo de Luis Enrique Mármol'
            mensaje = render_to_string('emails/bienvenida.html', {'usuario': usuario})

        elif accion == 'cambio_contrasena':
            asunto = 'Cambio de Contraseña'
            mensaje = render_to_string('emails/cambio_contrasena.html', {'usuario': usuario, 'contrasena': contrasena})

        else:
            logger.error(f"Acción desconocida: {accion}")
            return

        email_desde = settings.DEFAULT_FROM_EMAIL
        email_para = [usuario.correo]

        logger.info(f"Enviando correo a {email_para} con asunto '{asunto}'")

        email = EmailMultiAlternatives(asunto, mensaje, email_desde, email_para)
        email.attach_alternative(mensaje, "text/html")
        email.send()
        logger.info("Correo enviado exitosamente")
    except Exception as e:
        logger.error(f"Error al enviar correo electrónico: {str(e)}")
        print(f"Error al enviar correo electrónico: {str(e)}")



# def enviar_correo_constancia(nombre_usuario, rol_usuario, pdf, tipo_constancia):
#     try:
#         asunto = f"Notificación de Descarga de {tipo_constancia}"
#         # Renderizar la plantilla HTML
#         mensaje_html = render_to_string('emails/alerta_descarga_constancia.html', {
#             'nombre_usuario': nombre_usuario,
#             'rol_usuario': rol_usuario,
#             'tipo_constancia': tipo_constancia,
#         })

#         email_desde = settings.DEFAULT_FROM_EMAIL

#         # Obtener los correos electrónicos de usuarios con roles 'Director' y 'Subdirectora'
#         destinatarios = Usuario.objects.filter(rol__in=['Director', 'Subdirectora']).values_list('correo', flat=True)

#         if not destinatarios:
#             logger.warning("No se encontraron usuarios con rol de Director o Subdirectora para enviar el correo.")
#             return

#         logger.info(f"Enviando correo a: {', '.join(destinatarios)}")

#         email = EmailMultiAlternatives(asunto, mensaje_html, email_desde, destinatarios)
#         email.attach_alternative(mensaje_html, "text/html")

#         # Adjuntar el archivo PDF descargado
#         email.attach(f"{tipo_constancia}.pdf", pdf, 'application/pdf')

#         email.send()
#         logger.info("Correo de notificación de descarga enviado exitosamente")
#     except Exception as e:
#         logger.error(f"Error al enviar el correo de notificación: {str(e)}")

