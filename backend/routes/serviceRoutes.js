const express = require('express');
const router = express.Router();
const { 
  getAllServices, 
  getService, 
  createService, 
  updateService, 
  deleteService,
  getFeaturedServices,
  getServicesByCategory,
  searchServices,
  uploadServiceImages,
  resizeServiceImages,
  getMyServices,
  getPublicService
} = require('../controllers/serviceController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { uploadSingleImage } = require('../middleware/uploadMiddleware');
const reviewRouter = require('./reviewRoutes');
const Service = require('../models/serviceModel');

// Redireccionar a las rutas de reseñas
router.use('/:serviceId/reviews', reviewRouter);

// Rutas públicas
router.get('/', getAllServices);
router.get('/featured', getFeaturedServices);
router.get('/category/:categoryId', getServicesByCategory);
router.get('/search', searchServices);
router.get('/:id/public', getPublicService);

// Ruta temporal para recalcular estadísticas de reseñas
router.get('/recalculate-stats', async (req, res) => {
  try {
    const services = await Service.find();
    for (const service of services) {
      await Service.calculateReviewStatistics(service._id);
    }
    res.status(200).json({
      status: 'success',
      message: 'Estadísticas de reseñas recalculadas correctamente'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Rutas protegidas
router.use(protect);

// Ruta para obtener servicios del usuario autenticado
router.get('/my-services', getMyServices);

// Ruta pública para obtener un servicio específico (debe ir después de las rutas específicas)
router.get('/:id', getService);

// Rutas para proveedores de servicios
router.post('/', 
  restrictTo('provider', 'admin'),
  uploadSingleImage('serviceImage'),
  resizeServiceImages,
  createService
);

router.route('/:id')
  .patch(
    restrictTo('provider', 'admin'),
    uploadServiceImages,
    resizeServiceImages,
    updateService
  )
  .delete(
    restrictTo('provider', 'admin'),
    deleteService
  );

module.exports = router; 