from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('LEM.urls')),  # Asegúrate de que 'LEM' es el nombre correcto de tu aplicación
]