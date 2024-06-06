from django.shortcuts import redirect
from .utils import get_user_token, decode_jwt_token

class AuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        token = get_user_token(request)
        if token:
            payload = decode_jwt_token(token)
            if isinstance(payload, str):
                return redirect('login')
            request.user_id = payload.get('user_id')
        else:
            request.user_id = None

        response = self.get_response(request)

        return response

    def process_view(self, request, view_func, view_args, view_kwargs):
        # Redirigir a la página de inicio de sesión si el usuario no está autenticado y accede a una vista protegida
        protected_views = ['sesion_exitosa']
        if view_func.__name__ in protected_views and not request.user_id:
            return redirect('login')
        return None
