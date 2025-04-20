import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Rutas públicas que no requieren token
  const publicRoutes = [
    '/services/public/',
    '/services/featured',
    '/categories',
    '/services/recalculate-stats'
  ];

  // Verificar si es una ruta de detalle de servicio (cualquier ID)
  const isServiceDetailRoute = req.url.match(/\/services\/[a-fA-F0-9]{24}$/);

  // Verificar si la URL actual coincide con alguna de las rutas públicas o es detalle de servicio
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route)) || isServiceDetailRoute;

  // Si es una ruta pública, no añadir el token
  if (isPublicRoute) {
    console.log('Acceso público a ruta:', req.url);
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
