import { Client } from 'ssh2';
import { getSSHConnection } from './ssh.js';

export async function executeCode(code, devices) {
  try {
    const results = await Promise.all(
      devices.map(async (deviceId) => {
        try {
          const connection = await getSSHConnection(deviceId);
          if (!connection) {
            throw new Error(`Device ${deviceId} not found`);
          }
          const output = await executeOnDevice(connection, code);
          return { deviceId, success: true, output };
        } catch (error) {
          return {
            deviceId,
            success: false,
            error: error.message || 'Execution failed'
          };
        }
      })
    );
    return { results };
  } catch (error) {
    throw new Error(`Code execution failed: ${error.message}`);
  }
}

function executeOnDevice(connection, code) {
  return new Promise((resolve, reject) => {
    const client = new Client();

    client.on('ready', () => {
      client.exec(code, (err, stream) => {
        if (err) {
          client.end();
          return reject(err);
        }

        let output = '';
        let errorOutput = '';

        stream.on('close', () => {
          client.end();
          if (errorOutput) {
            reject(new Error(errorOutput));
          } else {
            resolve(output);
          }
        }).on('data', (data) => {
          output += data;
        }).stderr.on('data', (data) => {
          errorOutput += data;
        });
      });
    }).on('error', (err) => {
      reject(err);
    }).connect({
      host: connection.hostname,
      port: connection.port || 22,
      username: connection.username,
      password: connection.password // In production, use private keys instead
    });
  });
}
