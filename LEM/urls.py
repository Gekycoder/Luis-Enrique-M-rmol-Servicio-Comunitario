from django.contrib import admin
from django.urls import path
from .views import sesion_exitosa, get_usuarios, logout_view
from . import views  # Importa las vistas de tu aplicación
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    
)

urlpatterns = [
    path('login/', views.login_o_registro, name='login'),  # Cambiado para referenciar login_o_registro
    path('sesion-exitosa/', views.sesion_exitosa, name='sesion_exitosa'),
    path('logout/', logout_view, name='logout'),
    path('get-estudiantes/', views.get_estudiantes, name='get_estudiantes'),
    path('get-usuarios/', views.get_usuarios, name='get_usuarios'),
    path('generar-constancia/<int:estudiante_id>/', views.vista_constancia, name='generar-constancia'),

    
]
