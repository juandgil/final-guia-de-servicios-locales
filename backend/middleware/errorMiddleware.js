/**
 * Clase personalizada para errores operacionales
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware para manejar errores de desarrollo
 */
const sendErrorDev = (err, req, res) => {
  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  });
};

/**
 * Middleware para manejar errores en producción
 */
const sendErrorProd = (err, req, res) => {
  // Error operacional conocido
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }
  
  // Error de programación o desconocido: no revelar detalles
  console.error('ERROR 💥', err);
  return res.status(500).json({
    status: 'error',
    message: 'Algo salió mal'
  });
};

/**
 * Manejador de errores de validación de MongoDB
 */
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Datos inválidos. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Manejador de errores de duplicados en MongoDB
 */
const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Valor duplicado: ${value}. Por favor, usa otro valor.`;
  return new AppError(message, 400);
};

/**
 * Manejador de errores de casting de MongoDB
 */
const handleCastErrorDB = err => {
  const message = `Valor inválido ${err.value} para el campo ${err.path}.`;
  return new AppError(message, 400);
};

/**
 * Manejador de errores de JWT
 */
const handleJWTError = () => 
  new AppError('Token inválido. Inicia sesión nuevamente.', 401);

/**
 * Manejador de errores de expiración JWT
 */
const handleJWTExpiredError = () => 
  new AppError('Tu sesión ha expirado. Inicia sesión nuevamente.', 401);

/**
 * Middleware global de manejo de errores
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

module.exports = {
  AppError,
  globalErrorHandler
}; 