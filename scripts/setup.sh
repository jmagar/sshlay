#!/bin/bash

# Make sure we're in the project root
cd "$(dirname "$0")/.."

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Create server directory if it doesn't exist
mkdir -p server

# Copy backend files if they don't exist in server/
if [ ! -f "server/server.js" ]; then
  echo "Setting up server files..."
  cp -r server.js db.js routes middleware server/
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd server && npm install
cd ..

# Start MongoDB
echo "Starting MongoDB..."
./scripts/mongo.sh start

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
sleep 5

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  echo "MONGODB_URI=mongodb://sshlay:sshlay_password@localhost:27017/sshlay
JWT_SECRET=your_secure_jwt_secret_here
PORT=3001
FRONTEND_URL=http://localhost:3000" > .env
fi

echo "Setup complete! To start the application:"
echo "1. In one terminal: npm run server"
echo "2. In another terminal: npm run dev"
echo "3. Visit http://localhost:3000 in your browser"
