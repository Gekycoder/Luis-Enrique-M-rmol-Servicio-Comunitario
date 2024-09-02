from django.db import models
from django.utils.translation import gettext_lazy as _


class Usuario(models.Model):
    id = models.BigAutoField(primary_key=True)  # Asegúrate de que este es el tipo correcto
    nombres = models.CharField(max_length=255)
    apellidos = models.CharField(max_length=255)
    cedula = models.CharField(max_length=45, unique=True)
    usuario = models.CharField(max_length=150, unique=True)
    contrasena = models.CharField(max_length=128)
    correo = models.EmailField(unique=True)
    telefonos = models.CharField(max_length=255)
    direccion = models.TextField()
    rol = models.CharField(max_length=50)
    profile_photo = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.usuario

class Estudiante(models.Model):
    id = models.BigAutoField(primary_key=True)
    ci = models.CharField(max_length=20, unique=True)
    apellidos_nombres = models.CharField(max_length=255)
    grado = models.CharField(max_length=50)
    seccion = models.CharField(max_length=2)
    sexo = models.CharField(max_length=1, choices=[('M', 'Masculino'), ('F', 'Femenino')])
    edad = models.IntegerField()
    lugar_nac = models.CharField(max_length=100)
    fecha_nac = models.DateField()
    representante = models.CharField(max_length=255)
    ci_representante = models.CharField(max_length=20)
    direccion = models.TextField()
    tlf = models.CharField(max_length=20)
    notas = models.JSONField(default=dict)  # Para almacenar las notas como un diccionario
    promocion_solicitada = models.BooleanField(default=False)
    promocion_aprobada = models.BooleanField(default=False)
    docente = models.ForeignKey('Usuario', on_delete=models.CASCADE, null=True, blank=True)


    class Meta:
        db_table = 'lem_estudiantes'  # El nombre de la tabla tal como aparece en tu base de datos

    def __str__(self):
        return self.apellidos_nombres
    
class PromocionSolicitud(models.Model):
    estudiante = models.ForeignKey(Estudiante, on_delete=models.CASCADE)
    docente = models.ForeignKey('Usuario', on_delete=models.CASCADE)
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    aprobado = models.BooleanField(default=False)
    revisado = models.BooleanField(default=False)
    comentarios = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Solicitud de {self.estudiante} por {self.docente}"

class Tarea(models.Model):
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField()
    fecha = models.DateField()
    estado = models.CharField(max_length=20, choices=[('Pendiente', 'Pendiente'), ('Completada', 'Completada'), ('Cancelada', 'Cancelada')])
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)

    def __str__(self):
        return self.nombre