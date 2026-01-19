const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const pool = require('../shared/utils/database');
const { generateToken } = require('../shared/middleware/auth');
const { isValidEmail, handleError, successResponse } = require('../shared/utils/validators');

const app = express();
const PORT = process.env.AUTH_PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'auth-service' });
});

// Ruta de registro de usuarios
app.post('/register', [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('rol').optional().isIn(['administrador', 'odontologo']).withMessage('Rol inválido')
], async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { nombre, email, password, rol = 'odontologo' } = req.body;

    // Verificar si el usuario ya existe
    const userExists = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya existe con ese email'
      });
    }

    // Hashear la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insertar nuevo usuario
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol, created_at',
      [nombre, email.toLowerCase(), passwordHash, rol]
    );

    const newUser = result.rows[0];

    // Generar token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      rol: newUser.rol
    });

    return successResponse(res, {
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        email: newUser.email,
        rol: newUser.rol
      },
      token
    }, 'Usuario registrado exitosamente', 201);

  } catch (error) {
    return handleError(res, error, 'Error al registrar usuario');
  }
});

// Ruta de login
app.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es requerida')
], async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Buscar usuario
    const result = await pool.query(
      'SELECT id, nombre, email, password_hash, rol, activo FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = result.rows[0];

    // Verificar si el usuario está activo
    if (!user.activo) {
      return res.status(403).json({
        success: false,
        message: 'Usuario inactivo. Contacte al administrador'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token
    const token = generateToken({
      id: user.id,
      email: user.email,
      rol: user.rol
    });

    return successResponse(res, {
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      },
      token
    }, 'Login exitoso');

  } catch (error) {
    return handleError(res, error, 'Error al iniciar sesión');
  }
});

// Ruta para verificar token
app.post('/verify', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return res.status(403).json({ 
        success: false, 
        message: 'Token no proporcionado' 
      });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_super_seguro_aqui_cambiar_en_produccion');

    // Verificar que el usuario aún existe y está activo
    const result = await pool.query(
      'SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0 || !result.rows[0].activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no válido'
      });
    }

    return successResponse(res, {
      user: result.rows[0],
      valid: true
    }, 'Token válido');

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
});

// Ruta para cambiar contraseña
app.post('/change-password', [
  body('email').isEmail().withMessage('Email inválido'),
  body('oldPassword').notEmpty().withMessage('La contraseña actual es requerida'),
  body('newPassword').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, oldPassword, newPassword } = req.body;

    // Buscar usuario
    const result = await pool.query(
      'SELECT id, password_hash FROM usuarios WHERE email = $1 AND activo = true',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = result.rows[0];

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(oldPassword, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Hashear nueva contraseña
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    await pool.query(
      'UPDATE usuarios SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, user.id]
    );

    return successResponse(res, null, 'Contraseña actualizada exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al cambiar contraseña');
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🔐 Auth Service corriendo en puerto ${PORT}`);
});
