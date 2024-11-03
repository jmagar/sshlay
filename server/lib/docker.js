import { exec } from 'child_process';
import { promisify } from 'util';
import redis from '../redis.js';

const execAsync = promisify(exec);

export async function getContainers() {
  try {
    const cachedContainers = await redis.get('containers');
    if (cachedContainers) {
      return JSON.parse(cachedContainers);
    }

    const { stdout } = await execAsync('docker ps --format "{{json .}}"');
    const containers = stdout.trim().split('\n').map(line => JSON.parse(line));

    await redis.set('containers', JSON.stringify(containers), 'EX', 60); // Cache for 1 minute
    return containers;
  } catch (error) {
    console.error('Error getting containers:', error);
    throw new Error('Failed to fetch containers');
  }
}

export async function performContainerAction(id, action) {
  try {
    if (!id) {
      throw new Error('Container ID is required');
    }

    switch (action) {
      case 'start':
      case 'stop':
      case 'restart':
        await execAsync(`docker ${action} ${id}`);
        break;
      case 'remove':
        await execAsync(`docker rm -f ${id}`);
        break;
      default:
        throw new Error(`Invalid action: ${action}`);
    }

    // Invalidate cache after any action
    await redis.del('containers');
    return true;
  } catch (error) {
    console.error(`Error performing docker action ${action}:`, error);
    throw new Error(`Failed to ${action} container: ${error.message}`);
  }
}

export async function getContainerLogs(id, tail = 100) {
  try {
    if (!id) {
      throw new Error('Container ID is required');
    }

    const { stdout } = await execAsync(`docker logs --tail ${tail} ${id}`);
    return stdout;
  } catch (error) {
    console.error('Error getting container logs:', error);
    throw new Error(`Failed to fetch logs for container: ${error.message}`);
  }
}

export async function inspectContainer(id) {
  try {
    if (!id) {
      throw new Error('Container ID is required');
    }

    const { stdout } = await execAsync(`docker inspect ${id}`);
    return JSON.parse(stdout)[0];
  } catch (error) {
    console.error('Error inspecting container:', error);
    throw new Error(`Failed to inspect container: ${error.message}`);
  }
}
