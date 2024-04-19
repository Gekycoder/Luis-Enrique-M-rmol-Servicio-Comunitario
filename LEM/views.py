from django.shortcuts import render
from django.http import JsonResponse
from .models import Usuario, Estudiante
from django.contrib.auth import logout
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse
from django.views.decorators.http import require_POST
from django.contrib.auth.hashers import make_password, check_password
from django.views.decorators.csrf import csrf_exempt
from .utils import generate_jwt_token  # Asume que esta función está definida en utils.py
from django.contrib.auth.decorators import login_required
from .constancias import constancia_estudio

@csrf_exempt
def login_o_registro(request):
    if request.method == 'GET':
        # Renderiza la página de inicio de sesión cuando se accede a través de GET
        return render(request, 'index.html')
    elif request.method == 'POST':
        # Obtiene los datos del formulario de inicio de sesión
        usuario = request.POST.get('usuario')
        contrasena = request.POST.get('contrasena')
        print(usuario, contrasena)  # Agrega esta línea para depurar

        try:
            # Verifica si el usuario existe y la contraseña es correcta
            user = Usuario.objects.get(usuario=usuario)
            if check_password(contrasena, user.contrasena):
                # Genera el token para el usuario y redirige a 'sesion_exitosa'
                token = generate_jwt_token(user.id)
                print(token)
                # Puedes responder con un JsonResponse y manejar la redirección en el cliente,
                # o puedes usar `redirect` para hacerlo en el servidor.
                # Usando JsonResponse para este ejemplo:
                return JsonResponse({
                    'success': True,
                    'token': token,
                    'accion': 'login',
                    'redirect_url': '/sesion-exitosa/'
                })
            else:
                # Contraseña incorrecta
                return JsonResponse({'success': False, 'error': 'Contraseña incorrecta'}, status=401)
        except Usuario.DoesNotExist:
            # Usuario no existe
            return JsonResponse({'success': False, 'error': 'Usuario no encontrado'}, status=404)
    else:
        # Método HTTP no permitido
        return JsonResponse({'error': 'Método no permitido'}, status=405)




@require_POST
def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse('login')) 


def sesion_exitosa(request):
    return render(request, 'sesion_exitosa.html')


def get_usuarios(request):
    usuarios = list(Usuario.objects.all().values(
        'id', 'nombres', 'apellidos', 'cedula', 'usuario', 'contrasena', 'correo', 'telefonos' 
    ))
    return JsonResponse({'usuarios': usuarios})



def get_estudiantes(request):
    estudiantes = list(Estudiante.objects.all().values(
        'id', 'ci', 'apellidos_nombres', 'grado', 'seccion', 'sexo', 'edad', 'lugar_nac',
        'fecha_nac', 'representante', 'ci_representante', 'direccion', 'tlf'
    ))
    return JsonResponse({'estudiantes': estudiantes})


def vista_constancia(request, estudiante_id):
    pdf = constancia_estudio(estudiante_id)

    # Crear una respuesta HTTP con el PDF como contenido y los headers correctos
    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="constancia_de_estudio.pdf"'

    return response
