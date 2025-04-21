# Backend Guía de Servicios Locales

Backend del proyecto de servicios locales para gestionar categorías, servicios, reseñas y usuarios.

## Índice
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Iniciar el servidor](#iniciar-el-servidor)
- [Base de datos MongoDB](#base-de-datos-mongodb)
- [Datos de Ejemplo](#datos-de-ejemplo)
- [Gestión de Imágenes](#gestión-de-imágenes)
- [Pruebas con REST Client](#pruebas-con-rest-client)
- [Comandos básicos de MongoDB Shell](#comandos-básicos-de-mongodb-shell)

## Requisitos

- Node.js (v14+)
- MongoDB (v4.4+)
- NPM (v6+)

## Instalación

1. Clona el repositorio:
   ```
   git clone [URL del repositorio]
   cd guia-de-servicios-locales/backend
   ```

2. Instala las dependencias:
   ```
   npm install
   ```

## Configuración

1. Crea un archivo `.env` en la raíz del directorio `backend` con la siguiente configuración:

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/guia_servicios_locales
JWT_SECRET=tu_secreto_jwt
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
```

## Iniciar el servidor

Para iniciar el servidor en modo desarrollo:

```
npm run dev
```

Para iniciar el servidor en modo producción:

```
npm start
```

El servidor estará disponible en `http://localhost:5000` (o el puerto que hayas configurado en las variables de entorno).

## Base de datos MongoDB

### Instalar MongoDB Community Edition

1. Descarga MongoDB Community Edition desde [el sitio oficial](https://www.mongodb.com/try/download/community)
2. Sigue las instrucciones de instalación según tu sistema operativo

### Iniciar MongoDB localmente

Windows:
```
mongod --dbpath="C:\data\db"
```

macOS/Linux:
```
mongod --dbpath /data/db
```

La base de datos estará disponible en `mongodb://localhost:27017`.

### Crear la base de datos

La base de datos se creará automáticamente al iniciar el servidor, pero también puedes crearla manualmente:

```
mongo
use servicios-locales
```
### Crea los datos iniciales con

```
npm run seed
```

## IMPORTANTE Importar Datos de Ejemplo

El script `seed.js` ubicado en `backend/data/` se utiliza para poblar la base de datos con información inicial:

- **Categorías**: Electricistas, Plomeros, Carpinteros, etc.
- **Usuarios**: Administrador, usuarios regulares y proveedores de servicios
- **Servicios**: Servicios de ejemplo para cada categoría
- **Reseñas**: Opiniones de ejemplo para los servicios

Para modificar los datos iniciales:

1. Edita el archivo `backend/data/seed.js`
2. Ejecuta `npm run seed` para aplicar los cambios

## Gestión de Imágenes

### Cómo funciona el almacenamiento de imágenes

1. **Referencias en la base de datos**: 
   - Los servicios almacenan las rutas de las imágenes en los campos `mainImage` y `images[]`.
   - Estas rutas son relativas a la carpeta de assets del frontend.

2. **Imágenes predeterminadas**:
   - Por defecto, todos los servicios utilizan la imagen ubicada en `/assets/img/imagen_default.webp` (fronted_angular)

3. **Carga de imágenes**:
   - El backend utiliza Multer para gestionar la carga de archivos.
   - Los archivos se almacenan en `backend/public/uploads/`.
   - Las rutas se almacenan como URLs relativas en la base de datos.

### Configuración de Multer

El middleware para la carga de archivos está configurado en `backend/middleware/uploadMiddleware.js`:

- Límite de tamaño: 5MB por archivo
- Formatos permitidos: jpg, jpeg, png, webp
- Destino: `backend/public/uploads/`

3. Ejecuta `npm run seed` para aplicar los cambios

## Pruebas con REST Client

En la carpeta `tests` encontrarás varios archivos `.http` que puedes utilizar con extensiones como "REST Client" para VS Code o importar en Postman/Insomnia:

### Autenticación (`auth.http`)

1. Registra un usuario ejecutando la petición "Registro de usuario"
2. Inicia sesión con la petición "Inicio de sesión"
3. El token generado se utilizará automáticamente en las siguientes peticiones

### Categorías (`categories.http`)

Para gestionar categorías (requiere token de administrador):
1. Obtener todas las categorías
2. Crear una nueva categoría
3. Actualizar/Eliminar categorías

### Servicios (`services.http`)

Para gestionar servicios:
1. Obtener todos los servicios
2. Buscar servicios por término
3. Crear, actualizar o eliminar servicios (requiere autenticación)

### Reseñas (`reviews.http`)

Para gestionar reseñas:
1. Obtener reseñas de un servicio
2. Crear una reseña (requiere autenticación)
3. Actualizar o eliminar reseñas propias

## Comandos básicos de MongoDB Shell

### Conectar a MongoDB

```
mongo
```

### Ver bases de datos disponibles

```
show dbs
```

### Usar una base de datos específica

```
use guia_servicios_locales
```

### Ver colecciones en la base de datos actual

```
show collections
```

### Ver documentos en una colección

```
db.services.find()          // Ver todos los servicios
db.categories.find()        // Ver todas las categorías
db.users.find()             // Ver todos los usuarios
db.reviews.find()           // Ver todas las reseñas
```

### Ver documentos con formato legible

```
db.services.find().pretty()
```

### Buscar documentos con filtros

```
db.services.find({ category: ObjectId("id_de_la_categoria") })
db.reviews.find({ rating: { $gte: 4 } })  // Reseñas con calificación >= 4
db.users.find({ email: "ejemplo@correo.com" })
```

### Insertar un documento

```
db.categories.insertOne({
  name: "Ejemplo",
  description: "Categoría de ejemplo",
  icon: "fa-example"
})
```

### Actualizar un documento

```
db.services.updateOne(
  { _id: ObjectId("id_del_servicio") },
  { $set: { name: "Nuevo nombre" } }
)
```

### Eliminar documentos

```
db.reviews.deleteOne({ _id: ObjectId("id_de_la_reseña") })
db.services.deleteMany({ category: ObjectId("id_de_la_categoria") })
```

### Eliminar una colección

```
db.reviews.drop()
```

### Resetear datos para pruebas

Para borrar todos los datos y mantener la estructura:

```
db.services.deleteMany({})
db.categories.deleteMany({})
db.reviews.deleteMany({})
db.users.deleteMany({})
```

Para mantener un usuario administrador:

```
db.users.deleteMany({ role: { $ne: "admin" } })
```

### Crear un índice

```
db.services.createIndex({ name: "text", description: "text" })
```

### Estadísticas de una colección

```
db.services.stats()
```

---

Para más información, consulta la [documentación oficial de MongoDB](https://docs.mongodb.com/).
"# backed-guia-de-servicios-locales" 
