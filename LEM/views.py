from django.http import JsonResponse
from django.db.models import Subquery, OuterRef
from .models import Usuario, Estudiante, Tarea, PromocionSolicitud
from django.http import HttpResponse
from django.contrib.auth.hashers import make_password, check_password
from django.views.decorators.csrf import csrf_exempt
# Asume que esta función está definida en utils.py
from .constancias import constancia_estudio, constancia_asistencia, constancia_inscripcion, constancia_retiro
from django.contrib.auth.decorators import login_required
from .boletines import generar_boletin
from django.contrib.auth.forms import AuthenticationForm
from django.shortcuts import render, redirect, get_object_or_404
from .utils import generate_jwt_token, store_user_token
from django.db import IntegrityError
from django.shortcuts import render
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.http import JsonResponse, HttpResponseBadRequest
import logging, json
from django.conf import settings



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
            'is_admin_or_director': user.rol in ['Administrador', 'Director'],
            'is_docente': user.rol == 'Docente'  # Verifica si el usuario es docente
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
        direccion = request.POST.get('direccion')
        rol = request.POST.get('rol')
        

        if Usuario.objects.filter(correo=correo).exists():
            return JsonResponse({'success': False, 'error': 'Correo ya está en uso'}, status=400)

        nuevo_usuario = Usuario(
            nombres=nombres,
            apellidos=apellidos,
            cedula=cedula,
            usuario=usuario,
            contrasena=make_password(contrasena),
            correo=correo,
            telefonos=telefonos,
            direccion=direccion,
            rol=rol
        )

        try:
            nuevo_usuario.save()
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
            if data['contrasena']:
                usuario.contrasena = make_password(data['contrasena'])
            usuario.correo = data['correo']
            usuario.telefonos = data['telefonos']
            usuario.direccion=data['direccion'],
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
        # Eliminar el token de la sesión
        if 'user_token' in request.session:
            del request.session['user_token']
        if 'user_data' in request.session:
            del request.session['user_data']
        return redirect('login')
    return JsonResponse({'error': 'Método no permitido'}, status=405)


@csrf_exempt
def sesion_exitosa(request):
    user_data = request.session.get('user_data')
    
    if not user_data:
        return redirect('login')

    try:
        user = Usuario.objects.get(id=user_data['user_id'])

        # Pasar el rol del usuario al contexto y la URL de la foto de perfil
        profile_photo_url = f"{settings.MEDIA_URL}{user.profile_photo}" if user.profile_photo else None
        print(f"Profile photo URL: {profile_photo_url}")  # Para verificar la URL

        contexto = {
            'usuario_nombre': user.usuario,
            'usuario_rol': user.rol,
            'profile_photo_url': profile_photo_url,
            'is_admin_or_director': user.rol in ['Administrador', 'Director'],
            'is_docente': user.rol == 'Docente'
        }

        return render(request, 'sesion_exitosa.html', contexto)
    except Usuario.DoesNotExist:
        return redirect('login')

# Para obtener la lista de usuarios dentro de la base de datos
def get_usuarios(request):
    usuarios = list(Usuario.objects.all().values(
        'id', 'nombres', 'apellidos', 'cedula', 'usuario', 'contrasena', 'correo', 'telefonos', 'direccion', 'rol' 
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




def get_estudiantes(request):
    estudiantes = list(Estudiante.objects.all().select_related('docente').values(
        'id', 'ci', 'apellidos_nombres', 'grado', 'seccion', 'sexo', 'edad', 'lugar_nac',
        'fecha_nac', 'representante', 'ci_representante', 'direccion', 'tlf', 'notas',
        'docente__nombres', 'docente__apellidos', 'promocion_aprobada', 'promocion_solicitada', 'docente_id'
    ))

    # Extraer la nota específica del diccionario y enviar el nombre completo del docente
    for estudiante in estudiantes:
        notas_dict = estudiante.get('notas', {})
        estudiante['notas'] = notas_dict.get('notas', '')
        docente_nombres = estudiante.get('docente__nombres', '')
        docente_apellidos = estudiante.get('docente__apellidos', '')
        estudiante['docente_nombre_completo'] = f"{docente_nombres} {docente_apellidos}"

    return JsonResponse({'estudiantes': estudiantes})





def vista_constancia(request, estudiante_id):
    pdf = constancia_estudio(estudiante_id)

    # Crear una respuesta HTTP con el PDF como contenido y los headers correctos
    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="Constancia_de_estudio.pdf"'

    return response

def vista_constancia_asistencia(request, estudiante_id):
    pdf = constancia_asistencia(estudiante_id)

    # Crear una respuesta HTTP con el PDF como contenido y los headers correctos
    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="Constancia_de_asistencia.pdf"'

    return response

def vista_constancia_inscripcion(request, estudiante_id):
    pdf = constancia_inscripcion(estudiante_id)

    # Crear una respuesta HTTP con el PDF como contenido y los headers correctos
    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="Constancia_de_inscripcion.pdf"'

    return response

def vista_constancia_retiro(request, estudiante_id):
    pdf = constancia_retiro(estudiante_id)

    # Crear una respuesta HTTP con el PDF como contenido y los headers correctos
    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="Constancia_de_retiro.pdf"'

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
            Estudiante.objects.filter(docente_id=OuterRef('id'))
            .values('grado')[:1]
        ),
        seccion=Subquery(
            Estudiante.objects.filter(docente_id=OuterRef('id'))
            .values('seccion')[:1]
        )
    ).values('id', 'nombres', 'apellidos', 'grado', 'seccion')
    return JsonResponse({'docentes': list(docentes)})


@csrf_exempt
def asignar_docente(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        docente_id = data.get('docente_id')
        grado = data.get('grado')
        seccion = data.get('seccion')

        try:
            # Verifica si el docente ya está asignado a otro grado y sección
            Estudiante.objects.filter(docente_id=docente_id).update(docente_id=None)

            # Asigna el docente al nuevo grado y sección
            estudiantes_actualizados = Estudiante.objects.filter(grado=grado, seccion=seccion).update(docente_id=docente_id)

            if estudiantes_actualizados > 0:
                return JsonResponse({'success': True})
            else:
                return JsonResponse({'success': False, 'error': 'No se encontraron estudiantes para actualizar.'})
        except Usuario.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Docente no encontrado'})

    return JsonResponse({'success': False, 'error': 'Método no permitido'})







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
    grados = ['M III', 'G I', 'G II', 'G III', '1°', '2°', '3°', '4°', '5°', '6°']
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


