# SSHlay

A web-based SSH client and remote execution platform with Docker integration.

## Features

- SSH connection management
- Remote code execution
- Docker container management
- File explorer
- Real-time terminal
- System logs viewer

## Prerequisites

- Node.js v20+
- Docker and Docker Compose
- MongoDB
- Redis
- netcat-openbsd (for development)

## Development Setup

1. Install system dependencies:
```bash
sudo apt-get update
sudo apt-get install -y netcat-openbsd
```

2. Install project dependencies:
```bash
npm install
cd server && npm install && cd ..
```

3. Start development environment:
```bash
npm run start:dev
```

This will:
- Start MongoDB and Redis containers
- Launch the backend server
- Start the Next.js development server
- Monitor all services for crashes

To stop all services:
```bash
npm run stop
```

## Project Structure

- `/app` - Next.js pages and API routes
- `/components` - React components
- `/contexts` - React context providers
- `/lib` - Shared utilities
- `/scripts` - Development and utility scripts
- `/server` - Backend Express server
  - `/lib` - Server utilities
  - `/middleware` - Express middleware
  - `/routes` - API routes
- `/styles` - Global styles
- `/types` - TypeScript type definitions
- `/utils` - Frontend utilities

## Environment Variables

Create a `.env.local` file:

```env
MONGODB_URI=mongodb://sshlay:sshlay_password@localhost:27017/sshlay?authSource=admin
JWT_SECRET=your_secure_jwt_secret_here
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run start:dev` - Start full development environment
- `npm run stop` - Stop all services

## Error Handling

The application includes comprehensive error handling:
- Structured error logging to console and file
- Error boundary for React components
- API error handling with proper status codes
- Graceful shutdown handling

## Database Structure

### MongoDB Collections

- `ssh_connections` - Stores SSH connection details
- `execution_history` - Stores remote code execution history

### Redis

Used for:
- Real-time updates
- Caching
- Pub/sub for logs and terminal output

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
