import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

export default function HomePage() {
  const features = [
    {
      title: 'SSH Connections',
      description: 'Manage and connect to remote servers via SSH',
      href: '/connections'
    },
    {
      title: 'Docker Management',
      description: 'Monitor and control Docker containers',
      href: '/docker'
    },
    {
      title: 'File Explorer',
      description: 'Browse and manage remote files',
      href: '/file-explorer'
    },
    {
      title: 'Terminal',
      description: 'Interactive terminal access',
      href: '/terminal'
    },
    {
      title: 'System Logs',
      description: 'View and search system logs',
      href: '/logs'
    },
    {
      title: 'Remote Execution',
      description: 'Execute code on remote devices',
      href: '/remote-execution'
    }
  ]

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Welcome to SSHlay</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Link key={feature.href} href={feature.href}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
