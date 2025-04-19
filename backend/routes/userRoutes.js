const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  forgotPassword, 
  resetPassword, 
  getMe, 
  updateMe, 
  getAllUsers, 
  getUser, 
  updateUser, 
  deleteUser 
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Rutas protegidas
router.use(protect); // Middleware para proteger todas las rutas a continuación

router.get('/me', getMe);
router.patch('/update-me', updateMe);

// Rutas para administradores
router.use(restrictTo('admin')); // Restricción adicional para rutas de admin

router.route('/')
  .get(getAllUsers);

router.route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router; 