import SSHConnectionManager from '../../components/ssh-connection-manager'

export default function ConnectionsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">SSH Connections</h1>
      <SSHConnectionManager />
    </div>
  )
}
