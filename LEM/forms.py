from django import forms
from .models import Usuario

class LoginForm(forms.Form):
    usuario = forms.CharField(label='Usuario')
    contrasena = forms.CharField(widget=forms.PasswordInput, label='Contraseña')

class RegistroForm(forms.ModelForm):
    class Meta:
        model = Usuario
        fields = ['nombres', 'apellidos', 'usuario', 'contrasena', 'correo', 'telefonos', 'direccion', 'rol']
        widgets = {
            'contrasena': forms.PasswordInput(),
        }
