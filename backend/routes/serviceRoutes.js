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
  getMyServices
} = require('../controllers/serviceController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const reviewRouter = require('./reviewRoutes');

// Redireccionar a las rutas de reseñas
router.use('/:serviceId/reviews', reviewRouter);

// Rutas públicas
router.get('/', getAllServices);
router.get('/featured', getFeaturedServices);
router.get('/category/:categoryId', getServicesByCategory);
router.get('/search', searchServices);

// Rutas protegidas
router.use(protect);

// Ruta para obtener servicios del usuario autenticado
router.get('/my-services', getMyServices);

// Ruta pública para obtener un servicio específico (debe ir después de las rutas específicas)
router.get('/:id', getService);

// Rutas para proveedores de servicios
router.post('/', 
  restrictTo('provider', 'admin'),
  uploadServiceImages,
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