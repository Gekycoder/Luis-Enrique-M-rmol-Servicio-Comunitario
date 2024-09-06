from django.urls import path
from . import views  # Importa las vistas de tu aplicación
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('login/', views.logear, name='login'),
    path('sesion-exitosa/', views.sesion_exitosa, name='sesion_exitosa'),
    path('logout/', views.logout_view, name='logout'),
    path('get-user-data/', views.get_user_data, name='get_user_data'),
    path('get-estudiantes/', views.get_estudiantes, name='get_estudiantes'),
    path('get-usuarios/', views.get_usuarios, name='get_usuarios'),
    path('get-usuario/<int:user_id>/', views.get_usuario, name='get_usuario'),
    path('agregar-usuario/', views.agregar_usuario, name='agregar_usuario'),
    path('modificar-usuario/', views.modificar_usuario, name='modificar_usuario'),
    path('eliminar-usuario/', views.eliminar_usuario, name='eliminar_usuario'),
    path('change-profile-photo/', views.change_profile_photo, name='change-profile-photo'),
    path('obtener-tareas/', views.obtener_tareas, name='obtener_tareas'),
    path('crear-tarea/', views.crear_tarea, name='crear_tarea'),
    path('actualizar-tarea/', views.actualizar_tarea, name='actualizar_tarea'),
    path('eliminar-tarea/', views.eliminar_tarea, name='eliminar_tarea'),
    path('obtener-tarea/<int:tarea_id>/', views.obtener_tarea, name='obtener_tarea'),
    path('tarea-completada/', views.tarea_completada, name='tarea_completada'),
    path('generar-constancia/<int:estudiante_id>/', views.vista_constancia, name='generar-constancia'),
    path('generar-constancia-asistencia/<int:estudiante_id>/', views.vista_constancia_asistencia, name='generar-constancia-asistencia'),
    path('generar-constancia-inscripcion/<int:estudiante_id>/', views.vista_constancia_inscripcion, name='generar-constancia-inscripcion'),
    path('generar-constancia-retiro/<int:estudiante_id>/', views.vista_constancia_retiro, name='generar-constancia-retiro'),
    path('generar-boletin-1er-momento-preescolar/<int:estudiante_id>/', views.generar_boletin_1er_momento_preescolar, name='generar_boletin_1er_momento_preescolar'),
    path('obtener-notas/<int:estudiante_id>/', views.obtener_notas, name='obtener_notas'),
    path('registrar-notas/<int:estudiante_id>/', views.registrar_notas, name='registrar_notas'),
    path('denegar-promocion/<int:estudiante_id>/', views.denegar_promocion, name='denegar_promocion'),
    path('aprobar-promocion/<int:estudiante_id>/', views.aprobar_promocion, name='aprobar_promocion'),
    path('get-docentes/', views.get_docentes, name='get_docentes'),
    path('asignar-docente/', views.asignar_docente, name='asignar_docente'),
    path('get-estudiante/<int:id>/', views.get_estudiante, name='get_estudiante'), # Para obtener estudiantes al editar y elmiminar
    path('agregar-estudiante/', views.agregar_estudiante, name='agregar_estudiante'),
    path('modificar-estudiante/', views.modificar_estudiante, name='modificar_estudiante'),
    path('eliminar-estudiante/', views.eliminar_estudiante, name='eliminar_estudiante'),


    ################# FALTAN LOS PATH DE AGG, EDIT Y DELETE ESTUDIANTES ######################

] 

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
