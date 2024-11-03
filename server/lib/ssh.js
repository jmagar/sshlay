import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';
import fs from 'fs/promises';
import { Client } from 'ssh2';
import SSHConfig from 'ssh-config';

/**
 * Get all SSH connections from the database
 * @returns {Promise<Array>} Array of SSH connections
 */
export async function getSSHConnections() {
  const { db } = await connectToDatabase();
  return db.collection('ssh_connections').find().toArray();
}

/**
 * Get a single SSH connection by ID
 * @param {string} id - Connection ID
 * @returns {Promise<Object>} SSH connection object
 */
export async function getSSHConnection(id) {
  const { db } = await connectToDatabase();
  return db.collection('ssh_connections').findOne({ _id: new ObjectId(id) });
}

/**
 * Add a new SSH connection
 * @param {Object} connection - SSH connection details
 * @returns {Promise<Object>} Created SSH connection
 */
export async function addSSHConnection(connection) {
  const { db } = await connectToDatabase();
  const result = await db.collection('ssh_connections').insertOne({
    ...connection,
    createdAt: new Date(),
    lastUsed: null,
    status: 'disconnected'
  });
  return { ...connection, _id: result.insertedId };
}

/**
 * Delete an SSH connection
 * @param {string} id - Connection ID
 */
export async function deleteSSHConnection(id) {
  const { db } = await connectToDatabase();
  await db.collection('ssh_connections').deleteOne({ _id: new ObjectId(id) });
}

/**
 * Test an SSH connection
 * @param {Object} connection - SSH connection details
 * @returns {Promise<Object>} Test result
 */
export async function testSSHConnection(connection) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let testOutput = '';
    let errorOutput = '';
    const timeout = setTimeout(() => {
      conn.end();
      reject({
        success: false,
        error: 'Connection timed out after 10 seconds',
        details: errorOutput || testOutput
      });
    }, 10000);

    conn.on('ready', () => {
      // Try to execute a simple command to verify we can actually do something
      conn.exec('echo "SSH connection test successful"', (err, stream) => {
        if (err) {
          clearTimeout(timeout);
          conn.end();
          reject({
            success: false,
            error: 'Failed to execute test command',
            details: err.message
          });
          return;
        }

        stream.on('data', (data) => {
          testOutput += data.toString();
        });

        stream.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        stream.on('close', () => {
          clearTimeout(timeout);
          conn.end();
          if (errorOutput) {
            reject({
              success: false,
              error: 'Command execution failed',
              details: errorOutput
            });
          } else {
            resolve({
              success: true,
              output: testOutput.trim(),
              details: {
                client: conn._client.identifier,
                serverVersion: conn._client.serverVersion
              }
            });
          }
        });
      });
    });

    conn.on('error', (err) => {
      clearTimeout(timeout);
      conn.end();
      reject({
        success: false,
        error: err.message,
        details: {
          level: err.level,
          code: err.code,
          description: err.description
        }
      });
    });

    // Try to establish connection
    const connectConfig = {
      host: connection.hostname,
      port: connection.port || 22,
      username: connection.username,
      readyTimeout: 10000,
      // If password is provided, use it
      password: connection.password,
      // If private key is provided, use it
      ...(connection.privateKey && {
        privateKey: connection.privateKey
      }),
      // If identity file is provided, try to read it
      ...(connection.identityFile && {
        privateKey: fs.readFileSync(expandHomePath(connection.identityFile))
      }),
      // Add any additional SSH options
      ...(connection.sshOptions && {
        compress: connection.sshOptions.compression === 'yes',
        readyTimeout: connection.sshOptions.connectTimeout
          ? parseInt(connection.sshOptions.connectTimeout) * 1000
          : 10000,
        strictHostKeyChecking: connection.sshOptions.strictHostKeyChecking !== 'no',
        ...(connection.sshOptions.userKnownHostsFile && {
          hostHash: 'sha1',
          hostVerifier: (hostkey) => true // You might want to implement actual host key verification
        })
      }),
      // Debug output for troubleshooting
      debug: (debug) => {
        if (debug.includes('Authentication failed')) {
          errorOutput += 'Authentication failed\n';
        }
        if (debug.includes('Disconnected')) {
          errorOutput += 'Connection was disconnected\n';
        }
      }
    };

    try {
      conn.connect(connectConfig);
    } catch (err) {
      clearTimeout(timeout);
      reject({
        success: false,
        error: 'Failed to initiate connection',
        details: err.message
      });
    }
  });
}

/**
 * Expand home directory in file paths
 * @param {string} path - File path that might contain ~
 * @returns {string} Expanded file path
 */
function expandHomePath(path) {
  if (path.startsWith('~/')) {
    return path.replace('~', process.env.HOME || process.env.USERPROFILE);
  }
  return path;
}

/**
 * Import SSH config from content
 * @param {string} configContent - SSH config file content
 * @returns {Promise<Object>} Import result
 */
export async function importSSHConfig(configContent) {
  try {
    // Parse the SSH config using ssh-config
    const config = SSHConfig.parse(configContent);
    const { db } = await connectToDatabase();
    const results = [];

    // Process each host entry
    for (const entry of config) {
      if (entry.param !== 'Host' || entry.value === '*') continue;

      // Find all config values for this host
      const hostConfig = {};
      for (const param of config.find(entry.value)) {
        switch (param.param.toLowerCase()) {
          case 'hostname':
            hostConfig.HostName = param.value;
            break;
          case 'user':
            hostConfig.User = param.value;
            break;
          case 'port':
            hostConfig.Port = param.value;
            break;
          case 'identityfile':
            if (!hostConfig.IdentityFile) hostConfig.IdentityFile = [];
            hostConfig.IdentityFile.push(param.value);
            break;
          case 'forwardagent':
            hostConfig.ForwardAgent = param.value;
            break;
          case 'compression':
            hostConfig.Compression = param.value;
            break;
          case 'connecttimeout':
            hostConfig.ConnectTimeout = param.value;
            break;
          case 'stricthostkeychecking':
            hostConfig.StrictHostKeyChecking = param.value;
            break;
          case 'userknownhostsfile':
            hostConfig.UserKnownHostsFile = param.value;
            break;
          case 'proxycommand':
            hostConfig.ProxyCommand = param.value;
            break;
        }
      }

      const connection = {
        name: entry.value,
        hostname: hostConfig.HostName || entry.value,
        port: hostConfig.Port ? parseInt(hostConfig.Port, 10) : 22,
        username: hostConfig.User,
        identityFile: hostConfig.IdentityFile?.[0],
        createdAt: new Date(),
        lastUsed: null,
        status: 'disconnected',
        importedFrom: 'ssh_config',
        forwardAgent: hostConfig.ForwardAgent === 'yes',
        proxyCommand: hostConfig.ProxyCommand,
        sshOptions: {
          compression: hostConfig.Compression,
          connectTimeout: hostConfig.ConnectTimeout,
          strictHostKeyChecking: hostConfig.StrictHostKeyChecking,
          userKnownHostsFile: hostConfig.UserKnownHostsFile
        }
      };

      // If an identity file is specified, try to read its contents
      if (connection.identityFile) {
        try {
          const privateKey = await fs.readFile(expandHomePath(connection.identityFile), 'utf8');
          connection.privateKey = privateKey;
        } catch (error) {
          console.warn(`Could not read identity file ${connection.identityFile} for host ${connection.name}`);
        }
      }

      // Test the connection before saving
      try {
        const testResult = await testSSHConnection(connection);
        connection.lastTest = {
          success: testResult.success,
          timestamp: new Date(),
          details: testResult.details
        };
      } catch (error) {
        connection.lastTest = {
          success: false,
          timestamp: new Date(),
          error: error.message
        };
      }

      // Insert the connection into MongoDB
      try {
        const result = await db.collection('ssh_connections').insertOne(connection);
        results.push({
          success: true,
          name: connection.name,
          _id: result.insertedId,
          testResult: connection.lastTest
        });
      } catch (error) {
        results.push({
          success: false,
          name: connection.name,
          error: error.message
        });
      }
    }

    return {
      success: true,
      imported: results
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Import SSH config from file
 * @param {string} filePath - Path to SSH config file
 * @returns {Promise<Object>} Import result
 */
export async function importSSHConfigFile(filePath) {
  try {
    const configContent = await fs.readFile(expandHomePath(filePath), 'utf8');
    return importSSHConfig(configContent);
  } catch (error) {
    return {
      success: false,
      error: `Failed to read SSH config file: ${error.message}`
    };
  }
}

/**
 * Update connection status
 * @param {string} id - Connection ID
 * @param {string} status - New status
 */
export async function updateConnectionStatus(id, status) {
  const { db } = await connectToDatabase();
  await db.collection('ssh_connections').updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status,
        lastUsed: status === 'connected' ? new Date() : undefined
      }
    }
  );
}
