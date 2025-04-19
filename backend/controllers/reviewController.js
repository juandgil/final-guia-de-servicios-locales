const Review = require('../models/reviewModel');
const Service = require('../models/serviceModel');
const { AppError } = require('../middleware/errorMiddleware');

// Obtener todas las reseñas
exports.getAllReviews = async (req, res, next) => {
  try {
    let filter = {};
    
    // Si hay un serviceId en la URL, filtrar reseñas por ese servicio
    if (req.params.serviceId) {
      filter.service = req.params.serviceId;
    }
    
    // Solo mostrar reseñas aprobadas
    filter.approved = true;
    
    const reviews = await Review.find(filter)
      .populate({
        path: 'user',
        select: 'name profileImage'
      })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: {
        reviews
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener una reseña por ID
exports.getReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate({
        path: 'user',
        select: 'name profileImage'
      })
      .populate({
        path: 'service',
        select: 'name mainImage'
      });
    
    if (!review) {
      return next(new AppError('No se encontró la reseña con ese ID', 404));
    }
    
    // Verificar que la reseña está aprobada o el usuario es admin o propietario
    if (!review.approved && 
        (!req.user || 
         (req.user.role !== 'admin' && 
          req.user.id !== review.user.id))) {
      return next(new AppError('Esta reseña no está disponible', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        review
      }
    });
  } catch (error) {
    next(error);
  }
};

// Crear una nueva reseña
exports.createReview = async (req, res, next) => {
  try {
    // Si viene de la ruta del servicio, asignar el serviceId
    if (req.params.serviceId) {
      req.body.service = req.params.serviceId;
    }
    
    // Verificar que existe el servicio
    const service = await Service.findById(req.body.service);
    if (!service) {
      return next(new AppError('No existe el servicio que se intenta reseñar', 404));
    }
    
    // Verificar que el usuario no es el proveedor del servicio
    if (service.provider.toString() === req.user.id) {
      return next(new AppError('No puedes reseñar tu propio servicio', 400));
    }
    
    // Añadir usuario a la reseña
    req.body.user = req.user.id;
    
    // Añadir nombre del usuario
    req.body.name = req.user.name;
    
    // Crear la reseña
    const newReview = await Review.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        review: newReview
      }
    });
  } catch (error) {
    // Error de índice único (ya existe una reseña del usuario para este servicio)
    if (error.code === 11000) {
      return next(new AppError('Ya has publicado una reseña para este servicio', 400));
    }
    next(error);
  }
};

// Actualizar reseña
exports.updateReview = async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.id);
    
    if (!review) {
      return next(new AppError('No se encontró la reseña con ese ID', 404));
    }
    
    // Verificar que el usuario es el autor de la reseña o admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('No tienes permiso para actualizar esta reseña', 403));
    }
    
    // No permitir cambiar el servicio o usuario
    delete req.body.service;
    delete req.body.user;
    
    // Si no es admin, marcar como no aprobada para revisión
    if (req.user.role !== 'admin') {
      req.body.approved = false;
    }
    
    // Actualizar reseña
    review = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        review
      }
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar reseña
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return next(new AppError('No se encontró la reseña con ese ID', 404));
    }
    
    // Verificar que el usuario es el autor de la reseña o admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('No tienes permiso para eliminar esta reseña', 403));
    }
    
    await Review.findByIdAndDelete(req.params.id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
}; 