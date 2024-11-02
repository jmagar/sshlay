# SSHLay

SSHLay is a modern web-based SSH and Docker management system built with Next.js 13. It provides a user-friendly interface for managing SSH connections, executing remote commands, managing Docker containers, and exploring remote file systems.

## Features

- 🔐 SSH Connection Management
- 🐳 Docker Container Management
- 📁 Remote File Explorer
- 💻 Interactive Terminal
- 🚀 Remote Code Execution
- 📊 Real-time Logs
- 🔄 File Upload/Download
- 🔑 SSH Key Authentication Support

## Tech Stack

- Next.js 13 (App Router)
- TypeScript
- MongoDB
- TailwindCSS
- shadcn/ui Components
- SSH2
- Dockerode
- Socket.IO

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/sshlay.git
cd sshlay
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```bash
MONGODB_URI=your_mongodb_uri
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
sshlay/
├── app/                    # Next.js 13 app directory
│   ├── api/               # API routes
│   ├── connections/       # SSH connections page
│   ├── docker/           # Docker management page
│   ├── file-explorer/    # File explorer page
│   ├── logs/            # Logs page
│   ├── remote-execution/ # Remote code execution page
│   └── terminal/        # Terminal page
├── components/           # React components
│   ├── ui/              # UI components
│   └── ...              # Feature components
└── lib/                 # Utility functions and configurations
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE)
