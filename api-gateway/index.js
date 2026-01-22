const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../shared/middleware/auth');

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

// Configuración de servicios
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  patients: process.env.PATIENT_SERVICE_URL || 'http://localhost:3002',
  fichas: process.env.FICHA_SERVICE_URL || 'http://localhost:3003',
  odontogramas: process.env.ODONTOGRAM_SERVICE_URL || 'http://localhost:3004',
  presupuestos: process.env.BUDGET_SERVICE_URL || 'http://localhost:3005',
  citas: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3006'
};

// Middlewares globales
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 peticiones por ventana
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP, por favor intente más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiting a todas las rutas
app.use(limiter);

// Health check del gateway
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    services: {
      auth: SERVICES.auth,
      patients: SERVICES.patients,
      fichas: SERVICES.fichas,
      odontogramas: SERVICES.odontogramas,
      presupuestos: SERVICES.presupuestos,
      citas: SERVICES.citas
    }
  });
});

// Endpoint de información del API
app.get('/', (req, res) => {
  res.json({
    message: 'Sistema de Gestión Odontológica - API Gateway',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/*',
      patients: '/api/patients/*',
      fichas: '/api/fichas/*',
      odontogramas: '/api/odontogramas/*',
      presupuestos: '/api/presupuestos/*',
      citas: '/api/citas/*'
    },
    documentation: '/api/docs'
  });
});

// Configuración de proxies

// Servicio de autenticación (sin protección JWT para login y register)
app.use('/api/auth', createProxyMiddleware({
  target: SERVICES.auth,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '', // Eliminar /api/auth del path
  },
  onError: (err, req, res) => {
    console.error('Error en proxy auth:', err);
    res.status(500).json({
      success: false,
      message: 'Error al comunicarse con el servicio de autenticación'
    });
  }
}));

// Servicio de pacientes (protegido)
app.use('/api/patients', verifyToken, createProxyMiddleware({
  target: SERVICES.patients,
  changeOrigin: true,
  pathRewrite: {
    '^/api/patients': '/patients',
  },
  onError: (err, req, res) => {
    console.error('Error en proxy patients:', err);
    res.status(500).json({
      success: false,
      message: 'Error al comunicarse con el servicio de pacientes'
    });
  }
}));

// Servicio de fichas (protegido)
app.use('/api/fichas', verifyToken, createProxyMiddleware({
  target: SERVICES.fichas,
  changeOrigin: true,
  pathRewrite: {
    '^/api/fichas': '/fichas',
  },
  onError: (err, req, res) => {
    console.error('Error en proxy fichas:', err);
    res.status(500).json({
      success: false,
      message: 'Error al comunicarse con el servicio de fichas'
    });
  }
}));

// Servicio de odontogramas (protegido)
app.use('/api/odontogramas', verifyToken, createProxyMiddleware({
  target: SERVICES.odontogramas,
  changeOrigin: true,
  pathRewrite: {
    '^/api/odontogramas': '/odontogramas',
  },
  onError: (err, req, res) => {
    console.error('Error en proxy odontogramas:', err);
    res.status(500).json({
      success: false,
      message: 'Error al comunicarse con el servicio de odontogramas'
    });
  }
}));

// Servicio de presupuestos (protegido)
app.use('/api/presupuestos', verifyToken, createProxyMiddleware({
  target: SERVICES.presupuestos,
  changeOrigin: true,
  pathRewrite: {
    '^/api/presupuestos': '/presupuestos',
  },
  onError: (err, req, res) => {
    console.error('Error en proxy presupuestos:', err);
    res.status(500).json({
      success: false,
      message: 'Error al comunicarse con el servicio de presupuestos'
    });
  }
}));

// Servicio de citas (protegido)
app.use('/api/citas', verifyToken, createProxyMiddleware({
  target: SERVICES.citas,
  changeOrigin: true,
  pathRewrite: {
    '^/api/citas': '/citas',
  },
  onError: (err, req, res) => {
    console.error('Error en proxy citas:', err);
    res.status(500).json({
      success: false,
      message: 'Error al comunicarse con el servicio de citas'
    });
  }
}));

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 API Gateway corriendo en puerto ${PORT}`);
  console.log(`📍 Endpoint principal: http://localhost:${PORT}`);
  console.log('');
  console.log('Servicios configurados:');
  console.log(`  🔐 Auth Service: ${SERVICES.auth}`);
  console.log(`  👥 Patient Service: ${SERVICES.patients}`);
  console.log(`  📋 Ficha Service: ${SERVICES.fichas}`);
  console.log(`  🦷 Odontogram Service: ${SERVICES.odontogramas}`);
  console.log(`  💰 Budget Service: ${SERVICES.presupuestos}`);
  console.log(`  📅 Appointment Service: ${SERVICES.citas}`);
});
