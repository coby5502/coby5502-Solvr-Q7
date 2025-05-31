import { useState } from 'react'
import { Input } from '../common/Input'
import { Button } from '../common/Button'

interface RepositoryFormProps {
  onSubmit: (url: string) => Promise<void>
  isLoading: boolean
}

export function RepositoryForm({ onSubmit, isLoading }: RepositoryFormProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!url) {
      setError('Please enter a repository URL')
      return
    }

    setError(null)
    try {
      await onSubmit(url)
    } catch (err) {
      setError('Failed to fetch releases. Please check the repository URL.')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Select Repositories</h2>
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Repository URL (e.g., https://github.com/daangn/stackflow)"
            error={error || undefined}
          />
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Add Repository'}
          </Button>
        </div>
      </div>
    </div>
  )
} 