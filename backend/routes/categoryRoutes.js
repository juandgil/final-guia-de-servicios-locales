const express = require('express');
const router = express.Router();
const { 
  getAllCategories, 
  getCategory, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} = require('../controllers/categoryController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Rutas públicas
router.get('/', getAllCategories);
router.get('/:id', getCategory);

// Rutas protegidas
router.use(protect);
router.use(restrictTo('admin')); // Solo administradores pueden gestionar categorías

router.post('/', createCategory);

router.route('/:id')
  .patch(updateCategory)
  .delete(deleteCategory);

module.exports = router; 