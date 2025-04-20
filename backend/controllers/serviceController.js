const Service = require('../models/serviceModel');
const Category = require('../models/categoryModel');
const { AppError } = require('../middleware/errorMiddleware');
const { uploadMultipleImages, resizeMultipleImages, uploadSingleImage, resizeImage } = require('../middleware/uploadMiddleware');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

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
    
    // Añadir filtro de calificación mínima si se proporciona
    if (req.query.minRating) {
      const minRating = parseFloat(req.query.minRating);
      filter['reviewStats.avgRating'] = { $gte: minRating };
      console.log('Aplicando filtro de rating mínimo:', minRating);
      console.log('Filtro completo:', JSON.stringify(filter));
    }
    
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
    
    // Añadir filtro de calificación mínima si se proporciona
    if (req.query.minRating) {
      const minRating = parseFloat(req.query.minRating);
      filter['reviewStats.avgRating'] = { $gte: minRating };
    }
    
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
    const { query, ignoreCase, ignoreAccents } = req.query;
    
    if (!query) {
      return next(new AppError('Por favor proporciona un término de búsqueda', 400));
    }
    
    // Función para crear un patrón de búsqueda que ignore acentos
    const createAccentInsensitivePattern = (text) => {
      // Mapeo bidireccional de caracteres con y sin acento
      const accentPairs = [
        ['a', 'á', 'à', 'ä', 'â', 'ã'],
        ['e', 'é', 'è', 'ë', 'ê'],
        ['i', 'í', 'ì', 'ï', 'î'],
        ['o', 'ó', 'ò', 'ö', 'ô', 'õ'],
        ['u', 'ú', 'ù', 'ü', 'û'],
        ['n', 'ñ'],
        ['c', 'ç']
      ];
      
      // Crear un mapa para búsquedas rápidas
      const charMap = {};
      accentPairs.forEach(group => {
        group.forEach(char => {
          charMap[char.toLowerCase()] = group;
        });
      });
      
      // Convertir texto a formato de regex
      const pattern = Array.from(text).map(char => {
        const lowerChar = char.toLowerCase();
        if (charMap[lowerChar]) {
          // Si el carácter está en nuestro mapa, crear un grupo para todas sus variantes
          const variants = charMap[lowerChar];
          // Incluir versiones mayúsculas si el carácter original es mayúscula
          if (char === char.toUpperCase()) {
            return `[${variants.join('')}${variants.join('').toUpperCase()}]`;
          }
          return `[${variants.join('')}]`;
        }
        // Para otros caracteres, usar el original (escapado si es necesario)
        return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }).join('');
      
      return pattern;
    };
    
    // Crear el patrón de búsqueda
    const searchPattern = ignoreAccents === 'true' 
      ? createAccentInsensitivePattern(query)
      : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapar regex para búsqueda normal
    
    // Opciones de regex - 'i' para ignorar mayúsculas/minúsculas
    const regexOptions = ignoreCase === 'true' ? 'i' : '';
    
    // Construir la consulta de búsqueda
    let searchQuery = {
      $and: [
        { active: true },
        {
          $or: [
            { name: { $regex: searchPattern, $options: regexOptions } },
            { description: { $regex: searchPattern, $options: regexOptions } },
            { longDescription: { $regex: searchPattern, $options: regexOptions } }
          ]
        }
      ]
    };
    
    console.log('Patrón de búsqueda:', searchPattern);
    
    // Buscar servicios que coincidan con la consulta
    const services = await Service.find(searchQuery)
      .sort({ 'reviewStats.avgRating': -1 })
      .populate('provider', 'name')
      .populate('category', 'name icon');
    
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

// Obtener una versión pública de un servicio sin requerir autenticación
exports.getPublicService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('provider', 'name')
      .populate('category', 'name icon');
    
    if (!service || !service.active) {
      return next(new AppError('Servicio no encontrado', 404));
    }
    
    // Crear una versión pública con información limitada
    const publicService = {
      id: service._id,
      name: service.name,
      description: service.description,
      longDescription: service.longDescription,
      category: service.category,
      location: service.location,
      mainImage: service.mainImage,
      images: service.images,
      // Convertir reviewStats a los nombres de propiedades que espera el frontend
      rating: service.reviewStats?.avgRating || 0,
      reviewCount: service.reviewStats?.quantity || 0,
      reviewStats: service.reviewStats,
      services: service.services,
      schedule: service.schedule,
      featured: service.featured,
      // Añadir datos limitados del proveedor
      provider: {
        name: service.provider.name
      },
      // Información sensible reemplazada
      phone: 'Inicia sesión para ver',
      email: 'Inicia sesión para ver',
      website: service.website,
      contactInfo: 'Disponible al iniciar sesión',
      isPreview: true
    };
    
    res.status(200).json({
      status: 'success',
      data: {
        service: publicService
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
      
      // Copiar la imagen al directorio de assets del frontend
      const frontendImagesDir = path.join(__dirname, '../..', 'fronted_angular/src/assets/img');
      if (!fs.existsSync(frontendImagesDir)) {
        fs.mkdirSync(frontendImagesDir, { recursive: true });
      }
      
      // Extraer el nombre de archivo de la ruta
      const filename = path.basename(req.body.mainImage);
      const sourcePath = path.join(__dirname, '..', req.body.mainImage);
      const targetPath = path.join(frontendImagesDir, filename);
      
      // Copiar la imagen si existe
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        
        // Actualizar la ruta para que apunte a assets/img en el frontend
        req.body.mainImage = `/assets/img/${filename}`;
        req.body.images[0] = `/assets/img/${filename}`;
      }
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