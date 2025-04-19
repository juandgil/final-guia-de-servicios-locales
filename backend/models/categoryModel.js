const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la categoría es obligatorio'],
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    required: [true, 'El icono de la categoría es obligatorio'],
    default: 'fas fa-briefcase'
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware para generar el slug automáticamente
categorySchema.pre('save', function(next) {
  if (!this.isModified('name')) return next();
  
  this.slug = this.name
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, '-');
  
  next();
});

// Virtual para obtener la cantidad de servicios por categoría
categorySchema.virtual('serviceCount', {
  ref: 'Service',
  localField: '_id',
  foreignField: 'category',
  count: true
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category; 