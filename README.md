# SSHLay

A remote server management system with SSH, Docker, and file management capabilities.

## MongoDB Setup

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

### MongoDB Connection Details

- Database Name: sshlay
- Username: sshlay
- Password: sshlay_password
- Connection URI: mongodb://sshlay:sshlay_password@localhost:27017/sshlay

## Development

1. Start MongoDB:
```bash
./scripts/mongo.sh start
```

2. Start the backend server:
```bash
cd server
npm install
node server.js
```

3. Start the frontend:
```bash
npm install
npm run dev
```

The application will be available at http://localhost:3000
