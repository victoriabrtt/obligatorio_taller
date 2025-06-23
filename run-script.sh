#!/bin/bash

# Script para facilitar la ejecución de los scripts organizados

# Colores para la consola
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
NC="\033[0m" # No Color

# Función para mostrar ayuda
show_help() {
  echo -e "${BLUE}DAO Script Helper${NC}"
  echo "Uso: ./run-script.sh <categoría> <script> [opciones]"
  echo ""
  echo "Categorías disponibles:"
  echo "  deploy  - Scripts de despliegue"
  echo "  gov     - Scripts de gobernanza"
  echo "  utils   - Scripts de utilidades"
  echo "  tokens  - Scripts de gestión de tokens"
  echo ""
  echo "Ejemplos:"
  echo "  ./run-script.sh deploy quick_deploy"
  echo "  ./run-script.sh utils send_eth_to_account --recipient=0x123..."
  echo "  ./run-script.sh utils check_dao"
  echo "  ./run-script.sh gov unpause_dao"
  echo ""
  echo "Opciones comunes:"
  echo "  --dao=<address>      - Dirección del contrato DAO"
  echo "  --recipient=<address> - Dirección del destinatario para enviar ETH"
  echo "  --user=<address>     - Dirección del usuario para operaciones"
  echo "  --amount=<eth>       - Cantidad de ETH para enviar"
  echo "  --time=<seconds>     - Segundos para avanzar en el tiempo"
}

# Si no hay argumentos o se solicita ayuda
if [ "$1" == "" ] || [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
  show_help
  exit 0
fi

# Asignar la categoría y el script
CATEGORY=$1
SCRIPT_NAME=$2
shift 2

# Mapeo de rutas de scripts
case $CATEGORY in
  deploy|deployment)
    SCRIPT_PATH="scripts/deployment/${SCRIPT_NAME}.js"
    ;;
  gov|governance)
    SCRIPT_PATH="scripts/governance/${SCRIPT_NAME}.js"
    ;;
  utils|util)
    SCRIPT_PATH="scripts/utils/${SCRIPT_NAME}.js"
    ;;
  tokens|token)
    SCRIPT_PATH="scripts/tokens/${SCRIPT_NAME}.js"
    ;;
  *)
    echo -e "${YELLOW}Categoría '$CATEGORY' no reconocida.${NC}"
    show_help
    exit 1
    ;;
esac

# Verificar que el script existe
if [ ! -f "$SCRIPT_PATH" ]; then
  echo -e "${YELLOW}El script '$SCRIPT_NAME' no existe en la categoría '$CATEGORY'.${NC}"
  echo "Scripts disponibles en '$CATEGORY':"
  ls -1 "scripts/${CATEGORY}" | grep .js | sed 's/\.js$//'
  exit 1
fi

# Procesar opciones
ENV_VARS=""

for arg in "$@"; do
  case $arg in
    --dao=*)
      DAO_ADDRESS="${arg#*=}"
      ENV_VARS+="DAO_ADDRESS=${DAO_ADDRESS} "
      ;;
    --recipient=*)
      RECIPIENT="${arg#*=}"
      ENV_VARS+="RECIPIENT=${RECIPIENT} "
      ;;
    --user=*)
      USER_ADDRESS="${arg#*=}"
      ENV_VARS+="USER_ADDRESS=${USER_ADDRESS} "
      ;;
    --amount=*)
      AMOUNT="${arg#*=}"
      ENV_VARS+="AMOUNT=${AMOUNT} "
      ;;
    --time=*)
      ADVANCE_TIME="${arg#*=}"
      ENV_VARS+="ADVANCE_TIME=${ADVANCE_TIME} "
      ;;
    *)
      # Opciones desconocidas las pasamos directamente
      ENV_VARS+="$arg "
      ;;
  esac
done

# Ejecutar el script con Hardhat
echo -e "${GREEN}Ejecutando: $ENV_VARS npx hardhat run $SCRIPT_PATH --network localhost${NC}"
eval "$ENV_VARS npx hardhat run $SCRIPT_PATH --network localhost"
