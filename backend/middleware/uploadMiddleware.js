const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Configuración de almacenamiento para Multer (almacenamiento en memoria para procesamiento)
const multerStorage = multer.memoryStorage();

// Filtro para asegurar que solo se suben imágenes
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('El archivo no es una imagen. Por favor, sube solo imágenes.'), false);
  }
};

// Configuración de Multer
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
});

// Middleware para subir una sola imagen
exports.uploadSingleImage = (fieldName) => upload.single(fieldName);

// Middleware para subir múltiples imágenes
exports.uploadMultipleImages = (fieldName, maxCount) => upload.array(fieldName, maxCount);

// Middleware para diferentes campos con imágenes
exports.uploadMixedImages = (fields) => upload.fields(fields);

// Middleware para procesar y redimensionar imágenes
exports.resizeImage = (options) => async (req, res, next) => {
  const {
    fieldName = 'image',
    width = 500,
    height = 500,
    quality = 90,
    format = 'jpeg',
    directory = 'uploads',
  } = options;

  if (!req.file) return next();

  // Crear el directorio si no existe
  const dir = path.join(__dirname, '..', directory);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Generar un nombre de archivo único
  const filename = `${fieldName}-${Date.now()}.${format}`;
  const filepath = path.join(dir, filename);

  // Procesar y guardar la imagen
  await sharp(req.file.buffer)
    .resize(width, height, { fit: 'cover' })
    .toFormat(format)
    .jpeg({ quality })
    .toFile(filepath);

  // Añadir la ruta de la imagen a req.body
  req.body[fieldName] = `/${directory}/${filename}`;

  next();
};

// Middleware para procesar múltiples imágenes
exports.resizeMultipleImages = (options) => async (req, res, next) => {
  const {
    fieldName = 'images',
    width = 500,
    height = 500,
    quality = 90,
    format = 'jpeg',
    directory = 'uploads',
  } = options;

  if (!req.files || !req.files.length) return next();

  // Crear el directorio si no existe
  const dir = path.join(__dirname, '..', directory);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Array para guardar las rutas de las imágenes
  req.body[fieldName] = [];

  // Procesar cada imagen
  await Promise.all(
    req.files.map(async (file, i) => {
      const filename = `${fieldName}-${Date.now()}-${i + 1}.${format}`;
      const filepath = path.join(dir, filename);

      await sharp(file.buffer)
        .resize(width, height, { fit: 'cover' })
        .toFormat(format)
        .jpeg({ quality })
        .toFile(filepath);

      req.body[fieldName].push(`/${directory}/${filename}`);
    })
  );

  next();
}; 