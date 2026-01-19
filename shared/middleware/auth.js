const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_aqui_cambiar_en_produccion';

// Middleware para verificar el token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(403).json({ 
      success: false, 
      message: 'Token no proporcionado' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Añadir información del usuario al request
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido o expirado' 
    });
  }
};

// Middleware para verificar roles específicos
const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ 
        success: false, 
        message: 'Usuario no autenticado' 
      });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tiene permisos para realizar esta acción' 
      });
    }

    next();
  };
};

// Función para generar token
const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

module.exports = {
  verifyToken,
  verifyRole,
  generateToken,
  JWT_SECRET
};
