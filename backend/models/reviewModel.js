const mongoose = require('mongoose');
const Service = require('./serviceModel');

const reviewSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'La reseña debe pertenecer a un servicio']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'La reseña debe tener un autor']
  },
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio']
  },
  rating: {
    type: Number,
    required: [true, 'La calificación es obligatoria'],
    min: [1, 'La calificación mínima es 1'],
    max: [5, 'La calificación máxima es 5']
  },
  comment: {
    type: String,
    required: [true, 'La reseña debe tener un comentario'],
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  approved: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Prevenir reseñas duplicadas del mismo usuario para el mismo servicio
reviewSchema.index({ service: 1, user: 1 }, { unique: true });

// Middleware para calcular las estadísticas de reseñas después de guardar o actualizar
reviewSchema.post('save', async function() {
  await this.constructor.calcAverageRatings(this.service);
});

// Middleware para calcular las estadísticas de reseñas después de actualizar
reviewSchema.post(/^findOneAnd/, async function(doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.service);
  }
});

// Método estático para calcular y actualizar las estadísticas de reseñas
reviewSchema.statics.calcAverageRatings = async function(serviceId) {
  try {
    if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) {
      await Service.calculateReviewStatistics(serviceId);
    }
  } catch (err) {
    console.error('Error al calcular estadísticas de reseñas:', err);
  }
};

// Middleware para poblar el usuario antes de las consultas
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name profileImage'
  });
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 