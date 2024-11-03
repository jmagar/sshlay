#!/bin/bash

# Store the project root directory
PROJECT_ROOT="$(pwd)"
TIMEOUT=30  # Timeout in seconds for service startup
LOG_DIR="$PROJECT_ROOT/logs"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RESET='\033[0m'

# Function to log with timestamp
log() {
    local color="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${color}${timestamp} ${message}${RESET}"
}

# Setup logging
setup_logging() {
    mkdir -p "$LOG_DIR"
    : > "$LOG_DIR/dev.log"
    : > "$LOG_DIR/backend.log"
    : > "$LOG_DIR/frontend.log"
}

# Function to wait for MongoDB
wait_for_mongodb() {
    log "$BLUE" "Waiting for MongoDB..."
    for i in {1..30}; do
        if mongosh "mongodb://sshlay:sshlay_password@localhost:27017/admin" --eval "db.adminCommand('ping')" --quiet >/dev/null 2>&1; then
            log "$GREEN" "MongoDB is ready"
            return 0
        fi
        sleep 1
    done
    log "$RED" "MongoDB failed to start"
    return 1
}

# Function to wait for Redis
wait_for_redis() {
    log "$BLUE" "Waiting for Redis..."
    for i in {1..30}; do
        if redis-cli ping >/dev/null 2>&1; then
            log "$GREEN" "Redis is ready"
            return 0
        fi
        sleep 1
    done
    log "$RED" "Redis failed to start"
    return 1
}

# Function to wait for a port
wait_for_port() {
    local port=$1
    local service=$2
    local retries=$TIMEOUT
    while ! nc -z localhost $port >/dev/null 2>&1; do
        retries=$((retries-1))
        if [ $retries -eq 0 ]; then
            log "$RED" "Timeout waiting for $service"
            return 1
        fi
        sleep 1
    done
    return 0
}

# Function to kill process tree
kill_tree() {
    local pid=$1
    local signal=${2:-TERM}

    # Get child processes
    local children=$(pgrep -P $pid)

    # Kill children first
    for child in $children; do
        kill_tree $child $signal
    done

    # Kill the parent
    kill -$signal $pid 2>/dev/null || true
}

# Function to stop services
stop_services() {
    log "$YELLOW" "Stopping services..."

    # Find and kill all Node.js processes related to our app
    local pids=$(ps aux | grep '[n]ode' | grep -E 'next|server.js' | awk '{print $2}')
    for pid in $pids; do
        kill_tree $pid TERM
    done
    sleep 2

    # Force kill any remaining processes
    for pid in $pids; do
        kill_tree $pid KILL 2>/dev/null || true
    done

    # Stop Docker services
    cd "$PROJECT_ROOT"
    docker compose down --remove-orphans

    log "$GREEN" "Services stopped"
}

# Function to cleanup on exit
cleanup() {
    stop_services
    exit 0
}

# Register cleanup handler
trap cleanup SIGINT SIGTERM EXIT

# Initialize logging
setup_logging

# Stop existing services
log "$YELLOW" "Stopping existing services..."
stop_services
sleep 2

# Start Docker services
log "$BLUE" "Starting Docker services..."
cd "$PROJECT_ROOT"
docker compose up -d mongodb redis

# Wait for services to be ready
wait_for_mongodb || exit 1
wait_for_redis || exit 1
log "$GREEN" "Docker services ready"

# Start backend server
log "$BLUE" "Starting backend server..."
cd "$PROJECT_ROOT/server"
NODE_ENV=development npm run dev > >(while read line; do
    echo "[Backend] $line" | tee -a "$LOG_DIR/backend.log"
done) 2>&1 &
BACKEND_PID=$!

# Wait for backend
wait_for_port 3001 "Backend" || exit 1
log "$GREEN" "Backend server ready"

# Start frontend server
log "$BLUE" "Starting frontend server..."
cd "$PROJECT_ROOT"
NODE_ENV=development npm run dev > >(while read line; do
    echo "[Frontend] $line" | tee -a "$LOG_DIR/frontend.log"
done) 2>&1 &
FRONTEND_PID=$!

# Wait for frontend
wait_for_port 3000 "Frontend" || exit 1
log "$GREEN" "Frontend server ready"

# Print service information
log "$GREEN" "All services running"
echo -e "\nServices:"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001"
echo "MongoDB: localhost:27017"
echo "Redis:   localhost:6379"
echo -e "\nPress Ctrl+C to stop all services\n"

# Monitor processes and show important logs
while true; do
    if ! ps -p $FRONTEND_PID >/dev/null || ! ps -p $BACKEND_PID >/dev/null; then
        log "$RED" "Service crashed. Check logs for details."
        exit 1
    fi

    # Show any new errors or warnings
    for log_file in backend.log frontend.log; do
        if [ -f "$LOG_DIR/$log_file" ]; then
            tail -n 1 "$LOG_DIR/$log_file" | grep -i "error\|warn\|fail" || true
        fi
    done

    sleep 5
done
