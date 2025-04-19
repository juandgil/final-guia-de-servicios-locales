const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');

/**
 * Protege rutas - Verifica que el usuario esté autenticado
 */
exports.protect = async (req, res, next) => {
  try {
    // 1) Verificar que el token existe
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No has iniciado sesión. Inicia sesión para obtener acceso'
      });
    }

    // 2) Verificar que el token es válido
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Verificar que el usuario aún existe
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'El usuario al que pertenece este token ya no existe'
      });
    }

    // 4) Verificar si el usuario cambió la contraseña después de que se emitió el token
    if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: 'error',
        message: 'La contraseña ha sido cambiada recientemente. Inicia sesión nuevamente'
      });
    }

    // Acceso concedido
    req.user = currentUser;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Token inválido o expirado. Inicia sesión nuevamente'
    });
  }
};

/**
 * Restringe el acceso a roles específicos
 * @param  {...string} roles - Roles permitidos
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'No tienes permiso para realizar esta acción'
      });
    }
    next();
  };
}; 