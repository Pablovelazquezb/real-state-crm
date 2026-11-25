#!/usr/bin/env bash
# Nova CRM · arranque local/producción en un solo proceso (API + interfaz compilada)
#
#   ./scripts/nova.sh start     # compila si hace falta y arranca en segundo plano
#   ./scripts/nova.sh stop      # detiene el servidor
#   ./scripts/nova.sh restart   # reinicia
#   ./scripts/nova.sh status    # dice si está arriba y en qué URL
#   ./scripts/nova.sh logs      # sigue el log en vivo
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$ROOT/server"
LOG_DIR="$ROOT/logs"
LOG_FILE="$LOG_DIR/nova-crm.log"
PID_FILE="$LOG_DIR/nova-crm.pid"
PORT="${PORT:-5001}"
URL="http://localhost:${PORT}"

mkdir -p "$LOG_DIR"

# Caché local de npm: evita fallos cuando ~/.npm no es escribible.
export npm_config_cache="${NPM_CACHE_DIR:-$ROOT/.npm-cache}"

is_running() {
  if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    return 0
  fi
  return 1
}

start() {
  if is_running; then
    echo "Nova CRM ya está corriendo (pid $(cat "$PID_FILE")) en $URL"
    return 0
  fi

  if [ ! -d "$ROOT/client/node_modules" ]; then
    echo "Instalando dependencias del cliente..."
    npm --prefix "$ROOT/client" install --no-audit --no-fund
  fi

  if [ ! -f "$ROOT/client/build/index.html" ]; then
    echo "Compilando la interfaz..."
    npm --prefix "$ROOT/client" run build
  fi

  if [ ! -d "$SERVER_DIR/node_modules" ]; then
    echo "Instalando dependencias del servidor..."
    npm --prefix "$SERVER_DIR" install --no-audit --no-fund
  fi

  echo "Arrancando Nova CRM en el puerto $PORT..."
  (
    cd "$SERVER_DIR"
    nohup env NODE_ENV=production PORT="$PORT" node index.js >>"$LOG_FILE" 2>&1 &
    echo $! >"$PID_FILE"
  )

  # Espera a que la API responda (máx. ~15 s)
  for _ in $(seq 1 15); do
    if curl -s -o /dev/null --max-time 2 "$URL/api"; then
      break
    fi
    sleep 1
  done

  if is_running; then
    echo "✅ Nova CRM arriba en $URL  (log: $LOG_FILE)"
  else
    echo "❌ No arrancó. Últimas líneas del log:"
    tail -25 "$LOG_FILE" || true
    exit 1
  fi
}

stop() {
  if is_running; then
    kill "$(cat "$PID_FILE")" 2>/dev/null || true
    rm -f "$PID_FILE"
    echo "Servidor detenido."
  else
    # Limpieza por si el pid file se perdió
    pkill -f "$SERVER_DIR/index.js" 2>/dev/null || true
    rm -f "$PID_FILE"
    echo "No había un servidor activo."
  fi
}

status() {
  if is_running; then
    echo "🟢 Activo (pid $(cat "$PID_FILE")) · $URL"
  else
    echo "🔴 Detenido · inicia con: ./scripts/nova.sh start"
  fi
}

case "${1:-start}" in
  start) start ;;
  stop) stop ;;
  restart) stop; sleep 1; start ;;
  status) status ;;
  logs) tail -f "$LOG_FILE" ;;
  *)
    echo "Uso: $0 {start|stop|restart|status|logs}"
    exit 1
    ;;
esac
