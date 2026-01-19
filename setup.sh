#!/bin/bash

echo "======================================"
echo "Sistema de Gestión Odontológica"
echo "Script de Inicialización"
echo "======================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    echo "Por favor instale Docker primero: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose no está instalado${NC}"
    echo "Por favor instale Docker Compose primero: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker y Docker Compose están instalados${NC}"
echo ""

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creando archivo .env...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Archivo .env creado${NC}"
    echo -e "${YELLOW}⚠️  Por favor revise y modifique .env según sus necesidades${NC}"
else
    echo -e "${GREEN}✅ Archivo .env ya existe${NC}"
fi
echo ""

# Preguntar si desea usar Docker
echo "¿Desea iniciar el sistema con Docker? (y/n)"
read -r use_docker

if [ "$use_docker" = "y" ] || [ "$use_docker" = "Y" ]; then
    echo ""
    echo -e "${YELLOW}🐳 Construyendo e iniciando contenedores Docker...${NC}"
    echo "Esto puede tomar varios minutos..."
    echo ""
    
    docker-compose up --build -d
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}======================================"
        echo "✅ Sistema iniciado exitosamente"
        echo "======================================${NC}"
        echo ""
        echo "Servicios disponibles:"
        echo -e "${GREEN}🚀 API Gateway: http://localhost:3000${NC}"
        echo -e "${GREEN}🔐 Auth Service: http://localhost:3001${NC}"
        echo -e "${GREEN}👥 Patient Service: http://localhost:3002${NC}"
        echo -e "${GREEN}📋 Ficha Service: http://localhost:3003${NC}"
        echo -e "${GREEN}🦷 Odontogram Service: http://localhost:3004${NC}"
        echo -e "${GREEN}💰 Budget Service: http://localhost:3005${NC}"
        echo ""
        echo "Para ver los logs:"
        echo "  docker-compose logs -f"
        echo ""
        echo "Para detener los servicios:"
        echo "  docker-compose down"
        echo ""
        echo "Credenciales de usuario de prueba:"
        echo "  Email: admin@endonova.com"
        echo "  Password: admin123"
        echo ""
    else
        echo -e "${RED}❌ Error al iniciar los servicios${NC}"
        exit 1
    fi
else
    echo ""
    echo -e "${YELLOW}📦 Instalando dependencias de cada servicio...${NC}"
    echo ""
    
    services=("auth-service" "patient-service" "ficha-service" "odontogram-service" "budget-service" "api-gateway")
    
    for service in "${services[@]}"; do
        echo -e "${YELLOW}Instalando dependencias de $service...${NC}"
        cd "$service" && npm install && cd ..
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ $service instalado${NC}"
        else
            echo -e "${RED}❌ Error instalando $service${NC}"
            exit 1
        fi
    done
    
    echo ""
    echo -e "${GREEN}======================================"
    echo "✅ Dependencias instaladas"
    echo "======================================${NC}"
    echo ""
    echo "Pasos siguientes:"
    echo "1. Asegúrese de que PostgreSQL esté corriendo"
    echo "2. Cree la base de datos:"
    echo "   psql -U postgres -c 'CREATE DATABASE odontologia_db;'"
    echo "3. Ejecute las migraciones:"
    echo "   psql -U postgres -d odontologia_db -f database/migrations/001_create_tables.sql"
    echo "4. (Opcional) Inserte datos de prueba:"
    echo "   psql -U postgres -d odontologia_db -f database/seeds/001_sample_data.sql"
    echo "5. Inicie cada servicio en terminales separadas:"
    echo "   cd auth-service && npm start"
    echo "   cd patient-service && npm start"
    echo "   cd ficha-service && npm start"
    echo "   cd odontogram-service && npm start"
    echo "   cd budget-service && npm start"
    echo "   cd api-gateway && npm start"
    echo ""
fi
