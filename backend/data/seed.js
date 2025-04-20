const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Category = require('../models/categoryModel');
const User = require('../models/userModel');
const Service = require('../models/serviceModel');
const Review = require('../models/reviewModel');
const path = require('path');
require('dotenv').config();

// URL de conexión a MongoDB
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/guia_servicios_locales';

// Datos para categorías
const categories = [
  {
    name: 'Electricistas',
    description: 'Servicios de instalación y reparación eléctrica',
    icon: 'fas fa-bolt',
    active: true
  },
  {
    name: 'Plomeros',
    description: 'Servicios de fontanería y reparación de tuberías',
    icon: 'fas fa-faucet',
    active: true
  },
  {
    name: 'Carpinteros',
    description: 'Servicios de carpintería y ebanistería',
    icon: 'fas fa-hammer',
    active: true
  },
  {
    name: 'Mecánicos',
    description: 'Servicios de reparación y mantenimiento de vehículos',
    icon: 'fas fa-car',
    active: true
  },
  {
    name: 'Músicos',
    description: 'Servicios de música para eventos',
    icon: 'fas fa-music',
    active: true
  },
  {
    name: 'Pintores',
    description: 'Servicios de pintura y decoración',
    icon: 'fas fa-paint-roller',
    active: true
  },
  {
    name: 'Jardineros',
    description: 'Servicios de jardinería y paisajismo',
    icon: 'fas fa-leaf',
    active: true
  },
  {
    name: 'Servicios de Limpieza',
    description: 'Servicios de limpieza para hogares y oficinas',
    icon: 'fas fa-broom',
    active: true
  }
];

// Datos para usuarios (basados en auth.http)
const users = [
  {
    name: 'Administrador',
    email: 'admin@admin.com',
    password: 'AdminPass123!',
    role: 'admin',
    phone: '1234567890',
    active: true
  },
  {
    name: 'Usuario Prueba',
    email: 'usuario@test.com',
    password: 'Password123!',
    role: 'user',
    phone: '9876543210',
    active: true
  },
  {
    name: 'Juan Pérez',
    email: 'juan@ejemplo.com',
    password: 'Password123!',
    role: 'provider',
    phone: '5551234567',
    active: true
  },
  {
    name: 'María García',
    email: 'maria@ejemplo.com',
    password: 'Password123!',
    role: 'provider',
    phone: '5567891234',
    active: true
  }
];

// Función principal para poblar la base de datos
async function seedDatabase() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Conexión a MongoDB establecida.');

    // Eliminar datos existentes
    await Category.deleteMany({});
    await User.deleteMany({});
    await Service.deleteMany({});
    await Review.deleteMany({});

    console.log('Base de datos limpia. Comenzando a insertar datos...');

    // Insertar categorías (una por una para que se ejecute el middleware pre-save)
    const createdCategories = [];
    for (const categoryData of categories) {
      const category = new Category(categoryData);
      await category.save(); // Esto ejecutará el middleware pre-save que genera el slug
      createdCategories.push(category);
    }
    console.log(`${createdCategories.length} categorías insertadas.`);

    // Insertar usuarios
    // Nota: No podemos usar insertMany ya que necesitamos hashear las contraseñas
    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save(); // El hook pre-save se encargará de hashear la contraseña
      createdUsers.push(user);
    }
    console.log(`${createdUsers.length} usuarios insertados.`);

    // Crear servicios de ejemplo (basados en front_limpio/data/services.js)
    const services = [
      {
        name: "Electricista Profesional",
        description: "Servicios de instalación y reparación eléctrica para hogares y negocios. Atención rápida y trabajos garantizados.",
        longDescription: "Ofrecemos servicios profesionales de instalación, mantenimiento y reparación eléctrica tanto para hogares como para negocios. Nuestro equipo de electricistas certificados está disponible para urgencias 24/7. Todos nuestros trabajos cuentan con garantía y utilizamos materiales de primera calidad para asegurar instalaciones seguras y duraderas.",
        category: createdCategories[0]._id, // Electricistas
        provider: createdUsers[2]._id, // Juan Pérez
        location: "Centro, Ciudad",
        phone: "5551234567",
        email: "juan@ejemplo.com",
        website: "www.electricistapro.com",
        mainImage: '/assets/img/imagen_default.webp',
        images: ['/assets/img/imagen_default.webp'],
        schedule: {
          monday: "9:00 AM - 6:00 PM",
          tuesday: "9:00 AM - 6:00 PM",
          wednesday: "9:00 AM - 6:00 PM",
          thursday: "9:00 AM - 6:00 PM",
          friday: "9:00 AM - 6:00 PM",
          saturday: "10:00 AM - 2:00 PM",
          sunday: "Cerrado"
        },
        services: [
          {
            name: "Instalación eléctrica residencial",
            description: "Instalación completa para hogares nuevos o renovaciones.",
            price: "Desde $150.000"
          },
          {
            name: "Reparación de averías",
            description: "Solución rápida para problemas eléctricos en el hogar o negocio.",
            price: "Desde $50.000"
          },
          {
            name: "Instalación de iluminación",
            description: "Diseño e instalación de sistemas de iluminación personalizados.",
            price: "Desde $80.000"
          },
          {
            name: "Automatización del hogar",
            description: "Instalación de sistemas inteligentes y control por voz o app.",
            price: "Desde $200.000"
          }
        ],
        featured: true,
        active: true
      },
      {
        name: "Mecánico Automotriz Express",
        description: "Servicio de mecánica automotriz a domicilio. Diagnóstico gratuito y precios justos para todo tipo de vehículos.",
        longDescription: "Somos un servicio de mecánica automotriz que llega hasta donde estés. Ofrecemos diagnóstico gratuito, reparaciones, mantenimiento preventivo y correctivo para todo tipo de vehículos. Nuestros técnicos están certificados y utilizamos equipos de diagnóstico de última generación para garantizar un servicio de calidad.",
        category: createdCategories[3]._id, // Mecánicos
        provider: createdUsers[2]._id, // Juan Pérez
        location: "Norte, Ciudad",
        phone: "5551234567",
        email: "juan@ejemplo.com",
        website: "www.mecanicoexpress.com",
        mainImage: '/assets/img/imagen_default.webp',
        images: ['/assets/img/imagen_default.webp'],
        schedule: {
          monday: "8:00 AM - 7:00 PM",
          tuesday: "8:00 AM - 7:00 PM",
          wednesday: "8:00 AM - 7:00 PM",
          thursday: "8:00 AM - 7:00 PM",
          friday: "8:00 AM - 7:00 PM",
          saturday: "9:00 AM - 3:00 PM",
          sunday: "Cerrado"
        },
        services: [
          {
            name: "Mantenimiento preventivo",
            description: "Cambio de aceite, filtros, revisión general del vehículo.",
            price: "Desde $80.000"
          },
          {
            name: "Diagnóstico computarizado",
            description: "Detección de fallas con equipo especializado.",
            price: "Desde $40.000"
          },
          {
            name: "Reparación de frenos",
            description: "Cambio de pastillas, discos, ajustes y más.",
            price: "Desde $100.000"
          },
          {
            name: "Servicio a domicilio",
            description: "Atención donde te encuentres para emergencias.",
            price: "Desde $60.000"
          }
        ],
        featured: true,
        active: true
      },
      {
        name: "Banda Musical Los Fenix",
        description: "Grupo musical versátil para todo tipo de eventos. Amplio repertorio y equipo profesional de sonido e iluminación.",
        longDescription: "Somos una banda con más de 10 años de experiencia amenizando todo tipo de eventos sociales. Contamos con un amplio repertorio que incluye diversos géneros musicales para complacer todos los gustos. Disponemos de equipo profesional de sonido e iluminación para garantizar un espectáculo de calidad.",
        category: createdCategories[4]._id, // Músicos
        provider: createdUsers[3]._id, // María García
        location: "Servicio a domicilio",
        phone: "5567891234",
        email: "maria@ejemplo.com",
        website: "www.bandalosfenix.com",
        mainImage: '/assets/img/imagen_default.webp',
        images: ['/assets/img/imagen_default.webp'],
        schedule: {
          monday: "10:00 AM - 8:00 PM (para consultas)",
          tuesday: "10:00 AM - 8:00 PM (para consultas)",
          wednesday: "10:00 AM - 8:00 PM (para consultas)",
          thursday: "10:00 AM - 8:00 PM (para consultas)",
          friday: "Disponible para eventos",
          saturday: "Disponible para eventos",
          sunday: "Disponible para eventos"
        },
        services: [
          {
            name: "Bodas y ceremonias",
            description: "Música en vivo para ceremonias y recepción de bodas.",
            price: "Desde $500.000"
          },
          {
            name: "Fiestas corporativas",
            description: "Amenización de eventos empresariales con repertorio adaptado.",
            price: "Desde $450.000"
          },
          {
            name: "Cumpleaños y aniversarios",
            description: "Celebraciones especiales con música personalizada.",
            price: "Desde $400.000"
          },
          {
            name: "Paquete completo",
            description: "Incluye sonido, iluminación y 4 horas de música en vivo.",
            price: "Desde $600.000"
          }
        ],
        featured: true,
        active: true
      },
      {
        name: "Plomero 24/7",
        description: "Servicio de plomería de emergencia disponible las 24 horas. Reparaciones, instalaciones y mantenimiento de sistemas de agua.",
        longDescription: "Ofrecemos servicios profesionales de plomería residencial y comercial con disponibilidad las 24 horas para emergencias. Nuestro equipo está especializado en la reparación de fugas, destape de cañerías, instalación de sistemas hidráulicos y sanitarios, y mantenimiento preventivo.",
        category: createdCategories[1]._id, // Plomeros
        provider: createdUsers[3]._id, // María García
        location: "Sur, Ciudad",
        phone: "5567891234",
        email: "maria@ejemplo.com",
        website: "www.plomero24.com",
        mainImage: '/assets/img/imagen_default.webp',
        images: ['/assets/img/imagen_default.webp'],
        schedule: {
          monday: "8:00 AM - 8:00 PM",
          tuesday: "8:00 AM - 8:00 PM",
          wednesday: "8:00 AM - 8:00 PM",
          thursday: "8:00 AM - 8:00 PM",
          friday: "8:00 AM - 8:00 PM",
          saturday: "9:00 AM - 5:00 PM",
          sunday: "Solo emergencias"
        },
        services: [
          {
            name: "Reparación de fugas",
            description: "Detección y arreglo de fugas de agua en tuberías.",
            price: "Desde $60.000"
          },
          {
            name: "Destape de drenajes",
            description: "Solución para tuberías obstruidas en baños, cocinas, etc.",
            price: "Desde $50.000"
          },
          {
            name: "Instalación de sanitarios",
            description: "Instalación de inodoros, lavabos, regaderas, etc.",
            price: "Desde $80.000"
          },
          {
            name: "Servicio de emergencia",
            description: "Atención inmediata 24/7 para problemas urgentes.",
            price: "Desde $100.000"
          }
        ],
        featured: false,
        active: true
      }
    ];

    // Insertar servicios
    const createdServices = await Service.insertMany(services);
    console.log(`${createdServices.length} servicios insertados.`);

    // Crear reseñas de ejemplo
    const reviews = [
      // Reseñas para Electricista Profesional (5 estrellas promedio)
      {
        service: createdServices[0]._id, // Electricista Profesional
        user: createdUsers[1]._id, // Usuario Prueba
        name: "Carlos Mendoza",
        rating: 5,
        comment: "Excelente servicio, muy profesional y puntual. El trabajo quedó perfecto y a un precio justo. Definitivamente lo recomendaría.",
        approved: true
      },
      {
        service: createdServices[0]._id, // Electricista Profesional
        user: createdUsers[3]._id, // María García
        name: "Laura Gómez",
        rating: 5,
        comment: "Muy buen trabajo, resolvió todos los problemas eléctricos que tenía en casa. Puntual y profesional. Excelente atención.",
        approved: true
      },
      {
        service: createdServices[0]._id, // Electricista Profesional
        user: createdUsers[0]._id, // Admin
        name: "Jorge Ramírez",
        rating: 5,
        comment: "Sin duda el mejor electricista que he contratado. Resolvió un problema complejo que otros no pudieron solucionar.",
        approved: true
      },
      
      // Reseñas para Mecánico Automotriz (4 estrellas promedio)
      {
        service: createdServices[1]._id, // Mecánico Automotriz Express
        user: createdUsers[1]._id, // Usuario Prueba
        rating: 5,
        name: "Roberto Sánchez",
        comment: "Me salvaron de una emergencia en la carretera. Llegaron rápido y solucionaron el problema de forma eficiente. Excelente servicio.",
        approved: true
      },
      {
        service: createdServices[1]._id, // Mecánico Automotriz Express
        user: createdUsers[3]._id, // María García
        name: "Elena Torres",
        rating: 4,
        comment: "Buen servicio, pero tardaron un poco más de lo prometido. El trabajo quedó bien hecho y el precio fue justo.",
        approved: true
      },
      {
        service: createdServices[1]._id, // Mecánico Automotriz Express
        user: createdUsers[0]._id, // Admin
        name: "Miguel Ángel Díaz",
        rating: 3,
        comment: "Hace bien su trabajo, pero podría mejorar en cuanto a puntualidad y limpieza del área de trabajo.",
        approved: true
      },
      
      // Reseñas para Banda Musical (3 estrellas promedio)
      {
        service: createdServices[2]._id, // Banda Musical Los Fenix
        user: createdUsers[1]._id, // Usuario Prueba
        name: "Ana Torres",
        rating: 4,
        comment: "La banda cumplió con nuestras expectativas. Buena música y profesionales.",
        approved: true
      },
      {
        service: createdServices[2]._id, // Banda Musical Los Fenix
        user: createdUsers[0]._id, // Admin
        name: "Pedro Vázquez",
        rating: 2,
        comment: "Llegaron tarde a nuestro evento y el sonido no era de la mejor calidad. El repertorio fue limitado.",
        approved: true
      },
      {
        service: createdServices[2]._id, // Banda Musical Los Fenix
        user: createdUsers[2]._id, // Juan Pérez
        name: "Gabriela Moreno",
        rating: 3,
        comment: "Música aceptable, pero falta mejor organización y comunicación antes del evento.",
        approved: true
      },
      
      // Reseñas para Plomero (3.5 estrellas promedio)
      {
        service: createdServices[3]._id, // Plomero 24/7
        user: createdUsers[1]._id, // Usuario Prueba
        name: "Javier Morales",
        rating: 4,
        comment: "Servicio rápido y eficiente. Resolvieron mi problema de plomería sin complicaciones y a un buen precio.",
        approved: true
      },
      {
        service: createdServices[3]._id, // Plomero 24/7
        user: createdUsers[0]._id, // Admin
        name: "Sofía Castillo",
        rating: 3,
        comment: "El trabajo quedó bien, pero tuvieron que regresar a corregir algunos detalles. Precio razonable.",
        approved: true
      },
      {
        service: createdServices[3]._id, // Plomero 24/7
        user: createdUsers[2]._id, // Juan Pérez
        name: "Alejandro Ruiz",
        rating: 5,
        comment: "Excelente servicio de emergencia. Llegaron en menos de una hora y resolvieron una fuga complicada. 100% recomendados.",
        approved: true
      },
      {
        service: createdServices[3]._id, // Plomero 24/7
        user: createdUsers[3]._id, // María García
        name: "Daniel Castro",
        rating: 2,
        comment: "Precio elevado y el trabajo no quedó como esperaba. Tuve que llamar a otro plomero para corregir algunos problemas.",
        approved: true
      }
    ];

    // Insertar reseñas
    const createdReviews = await Review.insertMany(reviews);
    console.log(`${createdReviews.length} reseñas insertadas.`);

    // Actualizar estadísticas de reseñas
    for (const service of createdServices) {
      await Service.calculateReviewStatistics(service._id);
    }
    console.log('Estadísticas de reseñas actualizadas.');

    console.log('¡Base de datos poblada exitosamente!');
    
    // Desconectar de MongoDB
    await mongoose.disconnect();
    console.log('Conexión a MongoDB cerrada.');
    
  } catch (error) {
    console.error('Error al poblar la base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar la función de poblar la base de datos
seedDatabase(); 