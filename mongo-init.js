// Switch to admin database to create user
db = db.getSiblingDB('admin');

// Create root user if it doesn't exist
if (!db.getUser('sshlay')) {
    db.createUser({
        user: 'sshlay',
        pwd: 'sshlay_password',
        roles: [{ role: 'root', db: 'admin' }]
    });
}

// Switch to sshlay database
db = db.getSiblingDB('sshlay');

// Create collections with schemas
db.createCollection('ssh_connections', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'hostname', 'port', 'username'],
            properties: {
                name: {
                    bsonType: 'string',
                    description: 'Name of the SSH connection'
                },
                hostname: {
                    bsonType: 'string',
                    description: 'Hostname or IP address'
                },
                port: {
                    bsonType: 'int',
                    minimum: 1,
                    maximum: 65535,
                    description: 'Port number between 1 and 65535'
                },
                username: {
                    bsonType: 'string',
                    description: 'SSH username'
                },
                password: {
                    bsonType: ['string', 'null'],
                    description: 'Optional SSH password'
                },
                privateKey: {
                    bsonType: ['string', 'null'],
                    description: 'Optional SSH private key'
                },
                status: {
                    enum: ['connected', 'disconnected', 'error', null],
                    description: 'Connection status'
                },
                createdAt: {
                    bsonType: 'date',
                    description: 'Creation timestamp'
                },
                lastConnected: {
                    bsonType: ['date', 'null'],
                    description: 'Last successful connection timestamp'
                },
                importedFrom: {
                    enum: ['ssh_config', 'manual', 'import', null],
                    description: 'Source of the connection'
                }
            }
        }
    }
});

// Create indexes
db.ssh_connections.createIndex({ name: 1 }, { unique: true });
db.ssh_connections.createIndex({ hostname: 1, port: 1, username: 1 });
db.ssh_connections.createIndex({ status: 1 });
db.ssh_connections.createIndex({ createdAt: 1 });

// Create execution_history collection
db.createCollection('execution_history', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['code', 'devices', 'timestamp'],
            properties: {
                code: {
                    bsonType: 'string',
                    description: 'Executed code'
                },
                devices: {
                    bsonType: 'array',
                    description: 'List of target devices'
                },
                result: {
                    bsonType: 'object',
                    description: 'Execution result'
                },
                timestamp: {
                    bsonType: 'date',
                    description: 'Execution timestamp'
                }
            }
        }
    }
});

// Create index on timestamp for execution history
db.execution_history.createIndex({ timestamp: -1 });
