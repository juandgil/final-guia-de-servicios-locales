const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const { AppError } = require('../middleware/errorMiddleware');
const { uploadSingleImage, resizeImage } = require('../middleware/uploadMiddleware');

// Función auxiliar para generar token JWT
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

// Función para enviar token como respuesta
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  // Remover la contraseña de la salida
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// Registro de usuario
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    // Verificar si el correo ya está registrado
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Este correo electrónico ya está registrado', 400));
    }

    // Crear usuario
    const newUser = await User.create({
      name,
      email,
      password,
      role: role === 'provider' ? 'provider' : 'user' // Solo permitir roles user o provider en el registro
    });

    // Generar token y responder
    createSendToken(newUser, 201, res);
  } catch (error) {
    next(error);
  }
};

// Inicio de sesión
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Verificar que email y password existan
    if (!email || !password) {
      return next(new AppError('Por favor proporciona correo y contraseña', 400));
    }

    // Buscar usuario y verificar contraseña
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Correo o contraseña incorrectos', 401));
    }

    // Generar token y responder
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Recuperación de contraseña - solicitud
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Buscar usuario por email
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError('No existe un usuario con este correo electrónico', 404));
    }

    // Generar token de restablecimiento
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutos

    await user.save({ validateBeforeSave: false });

    // Enviar token por correo (simulación)
    console.log(`Token de restablecimiento: ${resetToken}`);

    res.status(200).json({
      status: 'success',
      message: 'Token enviado al correo electrónico',
      // Solo para desarrollo/pruebas
      resetToken
    });
  } catch (error) {
    next(error);
  }
};

// Restablecimiento de contraseña - confirmación
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hashear el token para comparar con el almacenado
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Buscar usuario con el token válido
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError('Token inválido o expirado', 400));
    }

    // Actualizar contraseña
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Iniciar sesión
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Obtener perfil del usuario actual
exports.getMe = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
};

// Actualizar perfil del usuario
exports.updateMe = async (req, res, next) => {
  try {
    // Verificar que no se intente cambiar la contraseña
    if (req.body.password) {
      return next(new AppError('Esta ruta no es para actualizar contraseñas', 400));
    }

    // Filtrar campos no permitidos
    const allowedFields = ['name', 'email', 'phone', 'profileImage'];
    const filteredBody = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredBody[key] = req.body[key];
      }
    });

    // Actualizar usuario
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    next(error);
  }
};

// Middleware para subir imagen de perfil
exports.uploadUserPhoto = uploadSingleImage('photo');

// Middleware para redimensionar imagen de perfil
exports.resizeUserPhoto = resizeImage({
  fieldName: 'profileImage',
  width: 500,
  height: 500,
  quality: 90,
  directory: 'uploads/users'
});

// --- RUTAS ADMIN ---

// Obtener todos los usuarios (admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener un usuario por ID (admin)
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError('No se encontró el usuario con ese ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar usuario (admin)
exports.updateUser = async (req, res, next) => {
  try {
    // No actualizar contraseñas con esta función
    if (req.body.password) {
      return next(new AppError('Esta ruta no es para actualizar contraseñas', 400));
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return next(new AppError('No se encontró el usuario con ese ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar usuario (admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return next(new AppError('No se encontró el usuario con ese ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar contraseña del usuario
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Obtener usuario actual con contraseña
    const user = await User.findById(req.user.id).select('+password');

    // Verificar contraseña actual
    if (!(await user.comparePassword(currentPassword))) {
      return next(new AppError('La contraseña actual es incorrecta', 401));
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    // Iniciar sesión con nuevo token
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Cerrar sesión
exports.logout = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Sesión cerrada correctamente'
  });
}; 