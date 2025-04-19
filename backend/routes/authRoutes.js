const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  forgotPassword, 
  resetPassword, 
  getMe, 
  updateMe,
  logout
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:token', resetPassword);
router.get('/logout', logout);

// Rutas protegidas
router.use(protect); // Middleware para proteger todas las rutas a continuación
router.get('/me', getMe);
router.patch('/updatedetails', updateMe);
router.patch('/updatepassword', require('../controllers/userController').updatePassword);

module.exports = router; 