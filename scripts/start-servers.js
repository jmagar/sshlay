/**
 * Server Startup Script
 *
 * Handles shutdown and startup of:
 * - Docker Compose services (MongoDB, Redis)
 * - Backend server
 * - Frontend server
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import net from 'net';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const SERVER_DIR = join(PROJECT_ROOT, 'server');

const PORTS = {
  BACKEND: 3001,
  FRONTEND: 3000,
  MONGODB: 27017,
  REDIS: 6379
};

const DB_STARTUP_TIMEOUT = 30000; // 30 seconds

/**
 * Execute sudo command with password
 */
const execSudo = async (command) => {
  const password = process.env.SUDO_PASSWORD;
  if (!password) {
    throw new Error('Sudo password not provided');
  }
  return execAsync(`echo "${password}" | sudo -S ${command}`);
};

/**
 * Check if a port is in use
 */
const isPortInUse = async (port) => {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', () => resolve(true))
      .once('listening', () => {
        server.close();
        resolve(false);
      })
      .listen(port);
  });
};

/**
 * Execute a command and return its output
 */
const execCommand = async (command, options = {}) => {
  try {
    const { stdout, stderr } = await execAsync(command, options);
    return { success: true, stdout, stderr };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * Check Docker Compose service health
 */
const checkDockerHealth = async (service) => {
  try {
    const { stdout } = await execAsync(`docker compose ps ${service} --format json`);
    const containerInfo = JSON.parse(stdout);
    return containerInfo.some(container =>
      container.State === 'running' &&
      (!container.Health || container.Health === 'healthy')
    );
  } catch (error) {
    return false;
  }
};

/**
 * Wait for Docker services to be healthy
 */
const waitForDockerHealth = async (services, timeout = DB_STARTUP_TIMEOUT) => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const checks = await Promise.all(
      services.map(async service => ({
        service,
        healthy: await checkDockerHealth(service)
      }))
    );

    const unhealthy = checks.filter(check => !check.healthy);
    if (unhealthy.length === 0) {
      return true;
    }

    console.log('Waiting for services to be healthy:',
      unhealthy.map(check => check.service).join(', '));

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error(`Services failed to become healthy within ${timeout}ms`);
};

/**
 * Start a server process
 */
const startServer = (command, cwd, env = {}) => {
  const [cmd, ...args] = command.split(' ');
  const proc = spawn(cmd, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: true
  });

  proc.on('error', (error) => {
    console.error(`Failed to start server: ${error.message}`);
  });

  return proc;
};

/**
 * Kill running processes
 */
const killProcesses = async () => {
  // Stop Docker services
  console.log('Stopping Docker services...');
  await execCommand('docker compose down');

  // Kill Node processes with sudo
  console.log('Killing Node processes...');
  try {
    await execSudo('pkill -9 node');
  } catch (error) {
    if (!error.message.includes('no process found')) {
      throw error;
    }
  }

  // Wait for ports to be released
  await new Promise(resolve => setTimeout(resolve, 1000));
};

/**
 * Main startup function
 */
const startup = async () => {
  try {
    console.log('Checking for running services...');

    // Check ports
    const portsInUse = await Promise.all(
      Object.entries(PORTS).map(async ([service, port]) => ({
        service,
        port,
        inUse: await isPortInUse(port)
      }))
    );

    const runningServices = portsInUse.filter(s => s.inUse);
    if (runningServices.length > 0) {
      console.log('Found running services:',
        runningServices.map(s => `${s.service} (${s.port})`).join(', '));

      await killProcesses();
    }

    console.log('Starting services...');

    // Start Docker services
    console.log('Starting Docker services...');
    await execCommand('docker compose up -d mongodb redis');

    // Wait for Docker services to be healthy
    console.log('Waiting for Docker services to be healthy...');
    await waitForDockerHealth(['mongodb', 'redis']);

    // Start backend server
    console.log('Starting backend server...');
    const backendProc = startServer(
      'npm run dev',
      SERVER_DIR,
      { NODE_ENV: 'development', DEBUG: '*' }
    );

    // Wait for backend to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start frontend server
    console.log('Starting frontend server...');
    const frontendProc = startServer(
      'npm run dev',
      PROJECT_ROOT,
      { NODE_ENV: 'development', DEBUG: '*' }
    );

    // Handle process termination
    const cleanup = async () => {
      console.log('\nShutting down services...');
      await killProcesses();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

  } catch (error) {
    console.error('Startup failed:', error);
    process.exit(1);
  }
};

// Run startup
startup().catch(error => {
  console.error('Fatal error during startup:', error);
  process.exit(1);
});
