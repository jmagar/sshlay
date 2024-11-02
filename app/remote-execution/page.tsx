import RemoteCodeExecution from '@/components/remote-code-execution'

export default function RemoteExecutionPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Remote Execution</h1>
      <RemoteCodeExecution />
    </div>
  )
}
