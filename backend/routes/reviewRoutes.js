const express = require('express');
const router = express.Router({ mergeParams: true }); // Permitir acceder a parámetros de otras rutas
const { 
  getAllReviews, 
  getReview, 
  createReview, 
  updateReview, 
  deleteReview 
} = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Rutas públicas
router.get('/', getAllReviews);
router.get('/:id', getReview);

// Rutas protegidas - Solo usuarios autenticados pueden crear reseñas
router.use(protect);

router.post('/', restrictTo('user', 'admin'), createReview);

router.route('/:id')
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview);

module.exports = router; 