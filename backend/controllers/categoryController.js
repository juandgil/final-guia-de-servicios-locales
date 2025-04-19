const Category = require('../models/categoryModel');
const { AppError } = require('../middleware/errorMiddleware');

// Obtener todas las categorías
exports.getAllCategories = async (req, res, next) => {
  try {
    // Filtrar por categorías activas si no es admin
    const filter = req.user && req.user.role === 'admin' ? {} : { active: true };
    
    const categories = await Category.find(filter)
      .populate('serviceCount')  // Obtener conteo de servicios por categoría
      .sort({ name: 1 });        // Ordenar alfabéticamente

    res.status(200).json({
      status: 'success',
      results: categories.length,
      data: {
        categories
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener una categoría por ID
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return next(new AppError('No se encontró la categoría con ese ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        category
      }
    });
  } catch (error) {
    next(error);
  }
};

// Crear una nueva categoría (admin)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    
    // Verificar que el nombre no exista ya
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return next(new AppError('Ya existe una categoría con ese nombre', 400));
    }
    
    const newCategory = await Category.create({
      name,
      description,
      icon
    });

    res.status(201).json({
      status: 'success',
      data: {
        category: newCategory
      }
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar una categoría (admin)
exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { 
        new: true,       // Devolver el documento actualizado
        runValidators: true  // Ejecutar validadores del esquema
      }
    );
    
    if (!category) {
      return next(new AppError('No se encontró la categoría con ese ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        category
      }
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar una categoría (admin)
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return next(new AppError('No se encontró la categoría con ese ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
}; 