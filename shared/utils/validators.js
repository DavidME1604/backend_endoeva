// Validación de email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validación de teléfono (formato Ecuador)
const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

// Validación de historia clínica (formato personalizado)
const isValidHistoriaClinica = (historiaClinica) => {
  const hcRegex = /^HC-\d{3,}$/;
  return hcRegex.test(historiaClinica);
};

// Sanitización de strings
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

// Validación de número de pieza dental
const isValidPiezaDental = (pieza) => {
  const piezaNum = parseInt(pieza);
  // Formato FDI: 11-18, 21-28, 31-38, 41-48
  // O formato simple: 1-32
  if (piezaNum >= 1 && piezaNum <= 32) return true;
  if ([11,12,13,14,15,16,17,18,21,22,23,24,25,26,27,28,
       31,32,33,34,35,36,37,38,41,42,43,44,45,46,47,48].includes(piezaNum)) {
    return true;
  }
  return false;
};

// Manejo de errores genérico
const handleError = (res, error, customMessage = 'Error en el servidor') => {
  console.error('Error:', error);
  return res.status(500).json({
    success: false,
    message: customMessage,
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

// Respuesta exitosa genérica
const successResponse = (res, data, message = 'Operación exitosa', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidHistoriaClinica,
  sanitizeString,
  isValidPiezaDental,
  handleError,
  successResponse
};
