import DockerManagement from '@/components/docker-management'

export default function DockerPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Docker Management</h1>
      <DockerManagement />
    </div>
  )
}
