const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del servicio es obligatorio'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La descripción del servicio es obligatoria'],
    trim: true
  },
  longDescription: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'La categoría del servicio es obligatoria']
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El proveedor del servicio es obligatorio']
  },
  location: {
    type: String,
    required: [true, 'La ubicación del servicio es obligatoria'],
    trim: true
  },
  // Opcional: coordenadas para búsqueda geoespacial
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitud, latitud]
      default: [0, 0]
    }
  },
  phone: {
    type: String,
    required: [true, 'El teléfono de contacto es obligatorio'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El correo electrónico de contacto es obligatorio'],
    trim: true,
    lowercase: true
  },
  website: {
    type: String,
    trim: true
  },
  images: [String],
  mainImage: {
    type: String,
    default: ''
  },
  schedule: {
    monday: String,
    tuesday: String,
    wednesday: String,
    thursday: String,
    friday: String,
    saturday: String,
    sunday: String
  },
  services: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: String,
      required: true
    }
  }],
  // Añadir el campo reviewStats para almacenar las estadísticas de las reseñas
  reviewStats: {
    avgRating: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  featured: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índice para búsquedas por texto
serviceSchema.index({ name: 'text', description: 'text', longDescription: 'text' });

// Índice para búsquedas geoespaciales
serviceSchema.index({ coordinates: '2dsphere' });

// Virtual para las reseñas
serviceSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'service'
});

// Virtual para calcular la calificación promedio
serviceSchema.virtual('rating').get(function() {
  if (this.reviewStats && this.reviewStats.avgRating) {
    return this.reviewStats.avgRating;
  }
  return 0;
});

// Virtual para contar el número de reseñas
serviceSchema.virtual('reviewCount').get(function() {
  if (this.reviewStats && this.reviewStats.count) {
    return this.reviewStats.count;
  }
  return 0;
});

// Método para calcular estadísticas de reseñas
serviceSchema.statics.calculateReviewStatistics = async function(serviceId) {
  const stats = await this.model('Review').aggregate([
    { $match: { service: serviceId } },
    { 
      $group: { 
        _id: '$service',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 }
      } 
    }
  ]);

  // Actualizar el documento del servicio con las estadísticas
  if (stats.length > 0) {
    await this.findByIdAndUpdate(serviceId, {
      reviewStats: {
        avgRating: stats[0].avgRating,
        count: stats[0].count
      }
    });
  } else {
    await this.findByIdAndUpdate(serviceId, {
      reviewStats: {
        avgRating: 0,
        count: 0
      }
    });
  }
};

// Middleware para agregar el campo categoryName antes de retornar
serviceSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'category',
    select: 'name icon'
  });
  next();
});

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service; 