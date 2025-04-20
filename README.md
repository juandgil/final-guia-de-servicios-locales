# Guía de Servicios Locales - Proyecto Completo

Este repositorio contiene una aplicación web completa para una "Guía de Servicios Locales", una plataforma que conecta a usuarios con proveedores de servicios profesionales locales.

## Estructura del Proyecto

El proyecto está organizado en las siguientes carpetas principales:

- **backend/**: API REST desarrollada con Node.js, Express y MongoDB
- **fronted_angular/**: Aplicación frontend desarrollada con Angular 17
- **front_limpio/**: Versión alternativa del frontend (plantilla HTML/CSS)

## Características Principales

- **Exploración de servicios** por categorías
- **Búsqueda** de servicios por nombre y ubicación
- **Visualización detallada** de servicios, incluyendo:
  - Información de contacto
  - Horarios de atención
  - Listado de servicios específicos
  - Galerías de imágenes
  - Reseñas de usuarios
- **Sistema de usuarios** con diferentes roles:
  - Usuario regular
  - Proveedor de servicios
  - Administrador
- **Registro y publicación** de nuevos servicios
- **Sistema de reseñas** y calificaciones

## Tecnologías Utilizadas

### Backend
- Node.js y Express
- MongoDB (base de datos NoSQL)
- JWT para autenticación
- Multer para gestión de archivos
- Mongoose para modelado de datos

### Frontend
- Angular 17 (Standalone Components)
- Bootstrap 5 para diseño responsivo
- Font Awesome para iconografía
- RxJS para programación reactiva
- Angular Forms (Reactivos)

## Requisitos Previos

- Node.js (v14+)
- MongoDB (v4.4+)
- NPM (v6+)
- Angular CLI

## Configuración Rápida

1. **Clonar el repositorio**
   ```bash
   git clone [URL del repositorio]
   cd proyecto_final
   ```

2. **Configurar el Backend**
   ```bash
   cd backend
   npm install
   # Crear archivo .env basado en el ejemplo .env.example
   npm run seed  # Carga datos iniciales
   npm run dev   # Inicia el servidor en modo desarrollo
   ```

3. **Configurar el Frontend Angular**
   ```bash
   cd ../fronted_angular
   npm install
   ng serve  # Inicia el servidor de desarrollo
   ```

4. **Acceder a la aplicación**
   - Frontend: [http://localhost:4200](http://localhost:4200)
   - API Backend: [http://localhost:5000](http://localhost:5000)

## Usuarios Predeterminados

Al ejecutar el script de semilla (`npm run seed`) se crean los siguientes usuarios:

- **Administrador**:
  - Email: admin@admin.com
  - Contraseña: AdminPass123!

- **Usuario Regular**:
  - Email: usuario@test.com
  - Contraseña: Password123!

- **Proveedores**:
  - Email: juan@ejemplo.com
  - Contraseña: Password123!
  
  - Email: maria@ejemplo.com
  - Contraseña: Password123!

## Configuración de Imágenes

Por defecto, todos los servicios utilizan la imagen predeterminada ubicada en:
`/fronted_angular/src/assets/img/imagen_default.webp`

Si deseas agregar imágenes personalizadas:
1. Coloca las imágenes en la carpeta `fronted_angular/src/assets/img/`
2. Actualiza las rutas en el archivo `backend/data/seed.js` en la sección de servicios

## Documentación Detallada

Para obtener información más detallada sobre cada componente del proyecto, consulta los archivos README dentro de cada directorio:

- [Documentación del Backend](./backend/README.md)
- [Documentación del Frontend Angular](./fronted_angular/README.md)
