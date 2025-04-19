# Guía de Servicios Locales - Frontend Angular

Este proyecto es el frontend en Angular para la aplicación "Guía de Servicios Locales", una plataforma para conectar personas con servicios profesionales locales.

## Características

- Listado de servicios destacados
- Exploración por categorías
- Búsqueda de servicios
- Vista detallada de servicios con:
  - Información de contacto
  - Horarios
  - Servicios específicos
  - Imágenes
  - Reseñas
- Sistema de reseñas
- Registro de servicios
- Autenticación de usuarios

## Tecnologías utilizadas

- Angular 17 (Standalone Components)
- Bootstrap 5
- Font Awesome
- RxJS
- Angular Forms (Reactivos)

## Estructura del proyecto

- **components/**: Componentes reutilizables
  - **shared/**: Componentes compartidos (navbar, footer, etc.)
- **pages/**: Componentes de páginas
  - **home/**: Página principal
  - **gallery/**: Galería de servicios
  - **detail/**: Detalle de servicio
  - **about/**: Página "Sobre nosotros"
- **services/**: Servicios de Angular
- **guards/**: Guards para protección de rutas
- **interceptors/**: Interceptores HTTP (autenticación)
- **environments/**: Configuración de entornos

## Requisitos previos

- Node.js (versión 14.x o superior)
- npm (versión 6.x o superior)
- Angular CLI

## Instalación

1. Clona el repositorio
```bash
git clone [URL del repositorio]
```

2. Instala las dependencias
```bash
cd fronted_angular
npm install
```

3. Inicia el servidor de desarrollo
```bash
ng serve
```

4. Abre tu navegador en `http://localhost:4200`

## Conexión con el backend

La aplicación se conecta a un backend en Node.js/Express disponible en la carpeta `backend` del proyecto. Asegúrate de que el backend esté en funcionamiento antes de utilizar ciertas características.

## Gestión de imágenes

### Estructura de directorios de imágenes
Las imágenes se almacenan en la carpeta `src/assets/img/`. Es importante mantener esta estructura para que las imágenes se sirvan correctamente.

### Imagen predeterminada
Por defecto, todos los servicios utilizan una imagen predeterminada:
```
/assets/img/imagen_default.webp
```

## Compilación para producción

```bash
ng build --configuration production
```
      