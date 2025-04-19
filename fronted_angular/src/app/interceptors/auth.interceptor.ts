import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Rutas públicas que no requieren token
  const publicRoutes = [
    '/services/public/',
    '/services/featured',
    '/categories'
  ];

  // Verificar si la URL actual coincide con alguna de las rutas públicas
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));

  // Si es una ruta pública, no añadir el token
  if (isPublicRoute) {
    return next(req);
  }

  // Para el resto de rutas, añadir el token si existe
  const token = localStorage.getItem('token');

  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }

  return next(req);
};
