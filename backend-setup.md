# Backend Setup Guide

## Required API Routes

1. SSH Connections API:
```
/api/ssh-connections
  - GET: List all connections
  - POST: Create new connection
/api/ssh-connections/:id
  - GET: Get connection details
  - PUT: Update connection
  - DELETE: Delete connection
/api/ssh-connections/test
  - POST: Test connection
```

2. File Explorer API:
```
/api/files
  - GET: List files in directory
  - POST: Create directory
  - DELETE: Delete file/directory
  - PATCH: Rename file/directory
/api/files/upload
  - POST: Upload file
```

3. Docker API:
```
/api/docker/containers
  - GET: List containers
  - POST: Create container
/api/docker/containers/:id/:action
  - POST: Perform action (start/stop/remove)
```

4. Logs API:
```
/api/logs
  - GET: Fetch system logs
  - POST: Add log entry
```

## Required Dependencies

```bash
npm install ssh2 dockerode winston express-ws @prisma/client
```

## Database Setup (Prisma)

1. Install Prisma:
```bash
npm install prisma --save-dev
npx prisma init
```

2. Create schema:
```prisma
model SSHConnection {
  id        String   @id @default(cuid())
  name      String
  hostname  String
  port      Int      @default(22)
  username  String
  password  String?
  privateKey String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model LogEntry {
  id        String   @id @default(cuid())
  level     String
  message   String
  timestamp DateTime @default(now())
}
```

3. Generate Prisma Client:
```bash
npx prisma generate
npx prisma db push
```