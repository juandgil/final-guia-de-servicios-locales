const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/database');
const { globalErrorHandler } = require('./middleware/errorMiddleware');

// Rutas
const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const authRoutes = require('./routes/authRoutes');

// Configuración del entorno
dotenv.config();

// Inicialización de la aplicación
const app = express();

// Middlewares
app.use(helmet()); // Seguridad
app.use(morgan('dev')); // Logging
app.use(cors()); // CORS
app.use(express.json()); // Parseo de JSON
app.use(express.urlencoded({ extended: true })); // Parseo de URL encoded

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/reviews', reviewRoutes);

// Ruta de verificación
app.get('/', (req, res) => {
  res.json({ message: 'API de Guía de Servicios Locales funcionando correctamente' });
});

// Middleware de manejo de errores
app.use(globalErrorHandler);

// Configuración del servidor
const PORT = process.env.PORT || 5000;

// Iniciar servidor solo si no es un test
if (process.env.NODE_ENV !== 'test') {
  // Conectar a la base de datos
  connectDB().then(() => {
    // Iniciar el servidor después de conectar a la BD
    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en el puerto ${PORT}`);
    });
  });
}

module.exports = app; 