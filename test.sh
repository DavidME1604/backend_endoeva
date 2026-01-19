#!/bin/bash

# Script de Pruebas del Sistema de Gestión Odontológica

BASE_URL="http://localhost:3000/api"
TOKEN=""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "======================================"
echo "Pruebas del Sistema Odontológico"
echo "======================================"
echo ""

# Función para hacer requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth=$4
    
    if [ -n "$auth" ]; then
        if [ -n "$data" ]; then
            curl -s -X "$method" "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $TOKEN" \
                -d "$data"
        else
            curl -s -X "$method" "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $TOKEN"
        fi
    else
        if [ -n "$data" ]; then
            curl -s -X "$method" "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data"
        else
            curl -s -X "$method" "$BASE_URL$endpoint"
        fi
    fi
}

# Verificar que los servicios estén corriendo
echo -e "${YELLOW}1. Verificando servicios...${NC}"
response=$(curl -s http://localhost:3000/health)
if echo "$response" | grep -q "OK"; then
    echo -e "${GREEN}✅ API Gateway está corriendo${NC}"
else
    echo -e "${RED}❌ API Gateway no responde${NC}"
    exit 1
fi

# Test 1: Registro de usuario
echo ""
echo -e "${YELLOW}2. Probando registro de usuario...${NC}"
register_data='{
  "nombre": "Test User",
  "email": "test@example.com",
  "password": "test123456",
  "rol": "odontologo"
}'
response=$(make_request "POST" "/auth/register" "$register_data")
if echo "$response" | grep -q "success"; then
    echo -e "${GREEN}✅ Usuario registrado exitosamente${NC}"
    TOKEN=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
    echo -e "${YELLOW}⚠️  Usuario ya existe o error en registro${NC}"
fi

# Test 2: Login
echo ""
echo -e "${YELLOW}3. Probando login...${NC}"
login_data='{
  "email": "test@example.com",
  "password": "test123456"
}'
response=$(make_request "POST" "/auth/login" "$login_data")
if echo "$response" | grep -q "success"; then
    echo -e "${GREEN}✅ Login exitoso${NC}"
    TOKEN=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "Token obtenido: ${TOKEN:0:20}..."
else
    echo -e "${RED}❌ Error en login${NC}"
    echo "$response"
    exit 1
fi

# Test 3: Verificar token
echo ""
echo -e "${YELLOW}4. Verificando token...${NC}"
response=$(make_request "POST" "/auth/verify" "" "auth")
if echo "$response" | grep -q "valid"; then
    echo -e "${GREEN}✅ Token válido${NC}"
else
    echo -e "${RED}❌ Token inválido${NC}"
    exit 1
fi

# Test 4: Crear paciente
echo ""
echo -e "${YELLOW}5. Creando paciente...${NC}"
patient_data='{
  "historia_clinica": "HC-TEST-001",
  "nombres": "Juan",
  "apellidos": "Pérez Test",
  "edad": 30,
  "domicilio": "Test Address 123",
  "telefono": "0999999999"
}'
response=$(make_request "POST" "/patients" "$patient_data" "auth")
if echo "$response" | grep -q "success"; then
    echo -e "${GREEN}✅ Paciente creado exitosamente${NC}"
    PATIENT_ID=$(echo "$response" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "ID del paciente: $PATIENT_ID"
else
    echo -e "${YELLOW}⚠️  Paciente ya existe o error en creación${NC}"
    # Intentar obtener el paciente existente
    response=$(make_request "GET" "/patients/historia/HC-TEST-001" "" "auth")
    PATIENT_ID=$(echo "$response" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
fi

# Test 5: Listar pacientes
echo ""
echo -e "${YELLOW}6. Listando pacientes...${NC}"
response=$(make_request "GET" "/patients?page=1&limit=5" "" "auth")
if echo "$response" | grep -q "success"; then
    echo -e "${GREEN}✅ Pacientes listados exitosamente${NC}"
    patient_count=$(echo "$response" | grep -o '"total":[0-9]*' | cut -d':' -f2)
    echo "Total de pacientes: $patient_count"
else
    echo -e "${RED}❌ Error al listar pacientes${NC}"
fi

# Test 6: Crear ficha endodóntica
echo ""
echo -e "${YELLOW}7. Creando ficha endodóntica...${NC}"
if [ -n "$PATIENT_ID" ]; then
    ficha_data="{
      \"paciente_id\": $PATIENT_ID,
      \"pieza_dental\": \"16\",
      \"motivo_consulta\": \"Dolor intenso en molar\",
      \"causa_caries\": true,
      \"dolor_naturaleza\": \"Intenso\",
      \"dolor_calidad\": \"Pulsátil\",
      \"movilidad\": 1,
      \"camara_normal\": true
    }"
    response=$(make_request "POST" "/fichas" "$ficha_data" "auth")
    if echo "$response" | grep -q "success"; then
        echo -e "${GREEN}✅ Ficha creada exitosamente${NC}"
        FICHA_ID=$(echo "$response" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
        echo "ID de la ficha: $FICHA_ID"
    else
        echo -e "${RED}❌ Error al crear ficha${NC}"
        echo "$response"
    fi
else
    echo -e "${RED}❌ No se pudo obtener ID del paciente${NC}"
fi

# Test 7: Crear odontograma
echo ""
echo -e "${YELLOW}8. Creando odontograma...${NC}"
if [ -n "$FICHA_ID" ]; then
    odonto_data="{
      \"ficha_id\": $FICHA_ID,
      \"dientes\": [
        {
          \"diente_numero\": 16,
          \"cuadrante\": 1,
          \"estado\": \"Caries\",
          \"notas\": \"Caries profunda\"
        },
        {
          \"diente_numero\": 17,
          \"cuadrante\": 1,
          \"estado\": \"Sano\"
        }
      ]
    }"
    response=$(make_request "POST" "/odontogramas" "$odonto_data" "auth")
    if echo "$response" | grep -q "success"; then
        echo -e "${GREEN}✅ Odontograma creado exitosamente${NC}"
    else
        echo -e "${RED}❌ Error al crear odontograma${NC}"
        echo "$response"
    fi
else
    echo -e "${RED}❌ No se pudo obtener ID de la ficha${NC}"
fi

# Test 8: Crear presupuesto
echo ""
echo -e "${YELLOW}9. Creando presupuesto...${NC}"
if [ -n "$FICHA_ID" ]; then
    budget_data="{
      \"ficha_id\": $FICHA_ID,
      \"actos\": [
        {
          \"numero\": 1,
          \"actividad\": \"Diagnóstico y Radiografía\",
          \"costo_unitario\": 50.00,
          \"cantidad\": 1
        },
        {
          \"numero\": 2,
          \"actividad\": \"Tratamiento de Conducto\",
          \"costo_unitario\": 250.00,
          \"cantidad\": 1
        }
      ]
    }"
    response=$(make_request "POST" "/presupuestos" "$budget_data" "auth")
    if echo "$response" | grep -q "success"; then
        echo -e "${GREEN}✅ Presupuesto creado exitosamente${NC}"
        BUDGET_ID=$(echo "$response" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
        echo "ID del presupuesto: $BUDGET_ID"
    else
        echo -e "${RED}❌ Error al crear presupuesto${NC}"
        echo "$response"
    fi
else
    echo -e "${RED}❌ No se pudo obtener ID de la ficha${NC}"
fi

# Test 9: Registrar pago
echo ""
echo -e "${YELLOW}10. Registrando pago...${NC}"
if [ -n "$BUDGET_ID" ]; then
    payment_data='{
      "valor": 50.00,
      "actividad": "Pago inicial - Diagnóstico"
    }'
    response=$(make_request "POST" "/presupuestos/$BUDGET_ID/pagos" "$payment_data" "auth")
    if echo "$response" | grep -q "success"; then
        echo -e "${GREEN}✅ Pago registrado exitosamente${NC}"
    else
        echo -e "${RED}❌ Error al registrar pago${NC}"
        echo "$response"
    fi
else
    echo -e "${RED}❌ No se pudo obtener ID del presupuesto${NC}"
fi

# Test 10: Obtener datos completos
echo ""
echo -e "${YELLOW}11. Obteniendo datos completos...${NC}"
if [ -n "$PATIENT_ID" ]; then
    response=$(make_request "GET" "/patients/$PATIENT_ID" "" "auth")
    if echo "$response" | grep -q "success"; then
        echo -e "${GREEN}✅ Datos del paciente obtenidos${NC}"
    fi
fi

if [ -n "$FICHA_ID" ]; then
    response=$(make_request "GET" "/fichas/$FICHA_ID" "" "auth")
    if echo "$response" | grep -q "success"; then
        echo -e "${GREEN}✅ Datos de la ficha obtenidos${NC}"
    fi
fi

if [ -n "$BUDGET_ID" ]; then
    response=$(make_request "GET" "/presupuestos/$BUDGET_ID" "" "auth")
    if echo "$response" | grep -q "success"; then
        echo -e "${GREEN}✅ Datos del presupuesto obtenidos${NC}"
    fi
fi

echo ""
echo "======================================"
echo -e "${GREEN}✅ Pruebas completadas${NC}"
echo "======================================"
echo ""
echo "Resumen de IDs creados:"
echo "  • Paciente ID: $PATIENT_ID"
echo "  • Ficha ID: $FICHA_ID"
echo "  • Presupuesto ID: $BUDGET_ID"
echo ""
echo "Para limpiar los datos de prueba, puede eliminar:"
echo "  curl -X DELETE $BASE_URL/patients/$PATIENT_ID -H \"Authorization: Bearer $TOKEN\""
echo ""
