#!/bin/bash

# Store the project root directory
PROJECT_ROOT="$(pwd)"
TIMEOUT=30  # Timeout in seconds for service startup

# Function to log with timestamp and color
log() {
    local color="$1"
    local message="$2"
    local reset='\033[0m'
    echo -e "${color}$(date '+%Y-%m-%d %H:%M:%S') ${message}${reset}"
}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'

# Function to wait for a port to be ready
wait_for_port() {
    local port=$1
    local service=$2
    local retries=$TIMEOUT
    local wait=1
    while ! nc -z localhost $port >/dev/null 2>&1; do
        retries=$((retries-1))
        if [ $retries -eq 0 ]; then
            log "$RED" "Timeout waiting for $service on port $port"
            return 1
        fi
        log "$YELLOW" "Waiting for $service on port $port... ($retries retries left)"
        sleep $wait
    done
    log "$GREEN" "$service is ready on port $port"
    return 0
}

# Function to cleanup processes and containers
cleanup() {
    log "$YELLOW" "Shutting down services..."

    # Send SIGTERM to allow graceful shutdown
    if [ ! -z "$FRONTEND_PID" ]; then
        kill -TERM $FRONTEND_PID 2>/dev/null
    fi
    if [ ! -z "$BACKEND_PID" ]; then
        kill -TERM $BACKEND_PID 2>/dev/null
    fi

    # Wait a moment for graceful shutdown
    sleep 2

    # Force kill if still running
    if ps -p $FRONTEND_PID >/dev/null 2>&1; then
        kill -9 $FRONTEND_PID 2>/dev/null
    fi
    if ps -p $BACKEND_PID >/dev/null 2>&1; then
        kill -9 $BACKEND_PID 2>/dev/null
    fi

    # Stop Docker services
    docker compose down

    log "$GREEN" "All services stopped"
    exit 0
}

# Register cleanup handler
trap cleanup SIGINT SIGTERM

# Kill any existing Node processes and stop Docker services
log "$YELLOW" "Stopping existing services..."
docker compose down
sudo pkill -9 node

# Wait for processes to be fully killed
sleep 2

# Start Docker services
log "$BLUE" "Starting Docker services..."
if ! docker compose up -d mongodb redis; then
    log "$RED" "Failed to start Docker services"
    exit 1
fi

# Wait for Docker services to be ready
log "$BLUE" "Waiting for Docker services..."
wait_for_port 27017 "MongoDB" || exit 1
wait_for_port 6379 "Redis" || exit 1
log "$GREEN" "Docker services are ready"

# Start backend server
log "$BLUE" "Starting backend server..."
cd "$PROJECT_ROOT/server"
NODE_ENV=development DEBUG=* npm run dev &
BACKEND_PID=$!

# Wait for backend to be ready
log "$BLUE" "Waiting for backend server..."
wait_for_port 3001 "Backend" || exit 1
log "$GREEN" "Backend server is ready"

# Start frontend server
log "$BLUE" "Starting frontend server..."
cd "$PROJECT_ROOT"
NODE_ENV=development DEBUG=* npm run dev &
FRONTEND_PID=$!

# Wait for frontend to be ready
log "$BLUE" "Waiting for frontend server..."
wait_for_port 3000 "Frontend" || exit 1
log "$GREEN" "Frontend server is ready"

# Print service information
log "$GREEN" "All services are running!"
echo -e "\nServices:"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001"
echo "MongoDB: localhost:27017"
echo "Redis: localhost:6379"
echo -e "\nPress Ctrl+C to stop all services\n"

# Monitor child processes
while true; do
    # Check if either process has exited
    if ! ps -p $FRONTEND_PID >/dev/null || ! ps -p $BACKEND_PID >/dev/null; then
        log "$RED" "One of the services crashed. Initiating shutdown..."
        cleanup
        exit 1
    fi
    sleep 1
done
