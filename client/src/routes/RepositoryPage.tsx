import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Github, Download } from 'lucide-react'
import { ReleaseList } from '../components/statistics/ReleaseList'
import { Button } from '../components/common/Button'
import { fetchReleases, calculateStats, generateCSV } from '../services/github'
import { Release } from '../types/release'
import { ReleaseCharts } from '../components/statistics/ReleaseCharts'

const REPOSITORIES = {
  'stackflow': {
    name: 'Stackflow',
    description: 'React Native용 스택 기반 네비게이션 라이브러리',
    url: 'https://github.com/daangn/stackflow'
  },
  'seed-design': {
    name: 'Seed Design',
    description: '당근마켓의 디자인 시스템',
    url: 'https://github.com/daangn/seed-design'
  }
} as const

type Repository = typeof REPOSITORIES[keyof typeof REPOSITORIES]

function RepositoryHeader({ repository, onDownload }: { repository: Repository, onDownload: () => void }) {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-center space-x-4">
        <Link to="/" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{repository.name}</h1>
          <p className="text-gray-500">{repository.description}</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          onClick={() => window.open(repository.url, '_blank')}
          className="flex items-center px-4 py-2 text-base w-full sm:w-auto justify-center"
        >
          <Github className="w-5 h-5 mr-2" />
          <span>GitHub 저장소</span>
        </Button>
        <Button
          variant="primary"
          onClick={onDownload}
          className="flex items-center px-4 py-2 text-base w-full sm:w-auto justify-center"
        >
          <Download className="w-5 h-5 mr-2" />
          <span>CSV 다운로드</span>
        </Button>
      </div>
    </div>
  )
}

export function RepositoryPage() {
  const { repoId } = useParams<{ repoId: string }>()
  const [isLoading, setIsLoading] = useState(true)
  const [releases, setReleases] = useState<Release[]>([])
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  const repository = repoId ? REPOSITORIES[repoId as keyof typeof REPOSITORIES] : null

  useEffect(() => {
    if (!repository) {
      setError('Repository not found')
      setIsLoading(false)
      return
    }

    const loadReleases = async () => {
      try {
        const data = await fetchReleases(repository.url)
        setReleases(data)
        setStats(calculateStats(data))
        setError(null)
      } catch (err) {
        setError('Failed to load releases')
      } finally {
        setIsLoading(false)
      }
    }

    loadReleases()
  }, [repository])

  const handleDownloadCSV = () => {
    if (!releases.length) return
    const csv = generateCSV(releases, stats)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${repoId}-releases.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!repository) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Repository not found</p>
        <Link to="/" className="text-orange-500 hover:text-orange-600">
          Return to home
        </Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <Link to="/" className="text-orange-500 hover:text-orange-600">
          Return to home
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 px-2 md:px-0 max-w-5xl mx-auto">
      <RepositoryHeader repository={repository} onDownload={handleDownloadCSV} />
      {stats && <ReleaseCharts stats={stats} />}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">릴리즈 목록</h2>
        </div>
        <div className="p-4 overflow-x-auto">
          <ReleaseList releases={releases} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
} 