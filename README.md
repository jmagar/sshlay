# SSHLay

A remote server management system with SSH, Docker, and file management capabilities.

## Prerequisites

- Node.js (v16 or later)
- Docker and Docker Compose
- Git

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/jmagar/sshlay.git
cd sshlay
```

2. Run the setup script:
```bash
./scripts/setup.sh
```

3. Start the backend server (in one terminal):
```bash
npm run server
```

4. Start the frontend development server (in another terminal):
```bash
npm run dev
```

5. Visit http://localhost:3000 in your browser

## Manual Setup

If you prefer to set up manually:

1. Install dependencies:
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server && npm install
cd ..
```

2. Start MongoDB:
```bash
./scripts/mongo.sh start
```

3. Create .env file with:
```
MONGODB_URI=mongodb://sshlay:sshlay_password@localhost:27017/sshlay
JWT_SECRET=your_secure_jwt_secret_here
PORT=3001
FRONTEND_URL=http://localhost:3000
```

4. Start the servers:
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run dev
```

## MongoDB Management

The project uses MongoDB running in Docker. To manage the MongoDB container:

```bash
# Start MongoDB
./scripts/mongo.sh start

# Stop MongoDB
./scripts/mongo.sh stop

# Restart MongoDB
./scripts/mongo.sh restart

# View MongoDB logs
./scripts/mongo.sh logs
```

## Development

The project is structured as follows:

- `/app` - Next.js frontend pages and API routes
- `/components` - React components
- `/contexts` - React context providers
- `/lib` - Utility functions and shared code
- `/server` - Express.js backend
  - `/routes` - API route handlers
  - `/middleware` - Express middleware

## Environment Variables

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT token generation
- `PORT` - Backend server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)
