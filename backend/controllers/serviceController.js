const Service = require('../models/serviceModel');
const Category = require('../models/categoryModel');
const { AppError } = require('../middleware/errorMiddleware');
const { uploadMultipleImages, resizeMultipleImages, uploadSingleImage, resizeImage } = require('../middleware/uploadMiddleware');
const mongoose = require('mongoose');

// Middleware para subir imágenes del servicio
exports.uploadServiceImages = uploadMultipleImages('images', 5);

// Middleware para procesar imágenes del servicio
exports.resizeServiceImages = resizeMultipleImages({
  fieldName: 'images',
  width: 800,
  height: 600,
  quality: 90,
  directory: 'uploads/services'
});

// Obtener todos los servicios con filtros
exports.getAllServices = async (req, res, next) => {
  try {
    // Construir query base
    let filter = { active: true };
    
    // Ordenar por featured primero, luego por rating
    const sort = { featured: -1, 'reviewStats.avgRating': -1 };
    
    // Limitar campos
    const fields = req.query.fields 
      ? req.query.fields.split(',').join(' ') 
      : '-__v';
    
    // Paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Ejecutar la consulta
    const services = await Service.find(filter)
      .sort(sort)
      .select(fields)
      .skip(skip)
      .limit(limit)
      .populate('provider', 'name email profileImage');
    
    // Obtener el total de documentos para la paginación
    const total = await Service.countDocuments(filter);
    
    res.status(200).json({
      status: 'success',
      results: services.length,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit
      },
      data: {
        services
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener servicios destacados
exports.getFeaturedServices = async (req, res, next) => {
  try {
    // Obtener servicios destacados con alta calificación
    const limit = parseInt(req.query.limit) || 6;
    
    const services = await Service.find({ 
      featured: true, 
      active: true 
    })
    .sort({ 'reviewStats.avgRating': -1 })
    .limit(limit)
    .populate('provider', 'name');
    
    res.status(200).json({
      status: 'success',
      results: services.length,
      data: {
        services
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener servicios por categoría
exports.getServicesByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    
    // Verificar si la categoría existe
    const category = await Category.findById(categoryId);
    if (!category) {
      return next(new AppError('Categoría no encontrada', 404));
    }
    
    // Construir query base
    const filter = { category: categoryId, active: true };
    
    // Ordenar por rating
    const sort = { 'reviewStats.avgRating': -1 };
    
    // Paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Ejecutar la consulta
    const services = await Service.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('provider', 'name');
    
    // Obtener el total de documentos para la paginación
    const total = await Service.countDocuments(filter);
    
    res.status(200).json({
      status: 'success',
      results: services.length,
      category: category.name,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit
      },
      data: {
        services
      }
    });
  } catch (error) {
    next(error);
  }
};

// Buscar servicios
exports.searchServices = async (req, res, next) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return next(new AppError('Por favor proporciona un término de búsqueda', 400));
    }
    
    // Buscar por términos
    const services = await Service.find({
      $and: [
        { active: true },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { longDescription: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .sort({ 'reviewStats.avgRating': -1 })
    .populate('provider', 'name');
    
    res.status(200).json({
      status: 'success',
      results: services.length,
      data: {
        services
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener un servicio por ID
exports.getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('provider', 'name email phone profileImage')
      .populate('reviews');
    
    if (!service) {
      return next(new AppError('Servicio no encontrado', 404));
    }
    
    // Si el servicio no está activo, solo permitir acceso al proveedor o admin
    if (!service.active && 
        (!req.user || 
         (req.user.role !== 'admin' && 
          req.user.id !== service.provider.id))) {
      return next(new AppError('Este servicio no está disponible', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        service
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener servicios del usuario actual
exports.getMyServices = async (req, res, next) => {
  try {
    const services = await Service.find({ provider: req.user.id });
    
    res.status(200).json({
      status: 'success',
      results: services.length,
      data: {
        services
      }
    });
  } catch (error) {
    next(error);
  }
};

// Crear un nuevo servicio
exports.createService = async (req, res, next) => {
  try {
    // Añadir provider automáticamente
    req.body.provider = req.user.id;
    
    // Verificar que el usuario no tenga ya un servicio registrado
    const existingServices = await Service.find({ provider: req.user.id });
    if (existingServices.length > 0) {
      return next(new AppError('Ya tienes un servicio registrado. No puedes crear más de uno.', 400));
    }
    
    // Verificar que la categoría existe
    if (req.body.category) {
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        return next(new AppError('La categoría seleccionada no existe', 400));
      }
    }
    
    // Procesar horarios
    if (req.body.schedules) {
      try {
        req.body.schedule = JSON.parse(req.body.schedules);
        delete req.body.schedules;
      } catch (e) {
        return next(new AppError('Formato de horarios inválido', 400));
      }
    }
    
    // Procesar servicios específicos
    if (req.body.servicesList) {
      try {
        req.body.services = JSON.parse(req.body.servicesList);
        delete req.body.servicesList;
      } catch (e) {
        return next(new AppError('Formato de lista de servicios inválido', 400));
      }
    }
    
    // Establecer imagen principal si hay imágenes
    if (req.body.images && req.body.images.length > 0) {
      req.body.mainImage = req.body.images[0];
    }
    
    const newService = await Service.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        service: newService
      }
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar un servicio
exports.updateService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return next(new AppError('Servicio no encontrado', 404));
    }
    
    // Verificar que el usuario tiene permiso (admin o propietario)
    if (req.user.role !== 'admin' && service.provider.toString() !== req.user.id) {
      return next(new AppError('No tienes permiso para actualizar este servicio', 403));
    }
    
    // Procesar horarios
    if (req.body.schedules) {
      try {
        req.body.schedule = JSON.parse(req.body.schedules);
        delete req.body.schedules;
      } catch (e) {
        return next(new AppError('Formato de horarios inválido', 400));
      }
    }
    
    // Procesar servicios específicos
    if (req.body.servicesList) {
      try {
        req.body.services = JSON.parse(req.body.servicesList);
        delete req.body.servicesList;
      } catch (e) {
        return next(new AppError('Formato de lista de servicios inválido', 400));
      }
    }
    
    // Actualizar imagen principal si hay nuevas imágenes
    if (req.body.images && req.body.images.length > 0) {
      req.body.mainImage = req.body.images[0];
    }
    
    // Actualizar servicio
    const updatedService = await Service.findByIdAndUpdate(
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
        service: updatedService
      }
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar un servicio
exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return next(new AppError('Servicio no encontrado', 404));
    }
    
    // Verificar que el usuario tiene permiso (admin o propietario)
    if (req.user.role !== 'admin' && service.provider.toString() !== req.user.id) {
      return next(new AppError('No tienes permiso para eliminar este servicio', 403));
    }
    
    await Service.findByIdAndDelete(req.params.id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
}; 