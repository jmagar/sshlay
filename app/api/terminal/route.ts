import { Server } from 'socket.io';
import { Client } from 'ssh2';

const io = new Server();

io.on('connection', (socket) => {
  let ssh: Client | null = null;

  socket.on('connect-ssh', async (connectionData) => {
    ssh = new Client();

    ssh.on('ready', () => {
      ssh.shell((err, stream) => {
        if (err) {
          socket.emit('error', 'Failed to create shell');
          return;
        }

        socket.on('data', (data) => {
          stream.write(data);
        });

        stream.on('data', (data) => {
          socket.emit('data', data.toString('utf-8'));
        });

        stream.on('close', () => {
          ssh?.end();
        });
      });
    });

    ssh.on('error', (err) => {
      socket.emit('error', err.message);
    });

    try {
      ssh.connect({
        host: connectionData.hostname,
        port: connectionData.port,
        username: connectionData.username,
        password: connectionData.password,
        privateKey: connectionData.privateKey,
      });
    } catch (err) {
      socket.emit('error', 'Failed to connect');
    }
  });

  socket.on('disconnect', () => {
    if (ssh) {
      ssh.end();
    }
  });
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default io;