import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Github } from 'lucide-react'
import { ReleaseList } from '../components/statistics/ReleaseList'
import { Button } from '../components/common/Button'
import { releaseService } from '../services/api'
import { Release, RepoMeta } from '../types/release'
import { ReleaseCharts } from '../components/statistics/ReleaseCharts'
import { Loading } from '../components/common/Loading'

export function RepositoryPage() {
  const { repoId } = useParams<{ repoId: string }>()
  const [isLoading, setIsLoading] = useState(true)
  const [releases, setReleases] = useState<Release[]>([])
  const [error, setError] = useState<string | null>(null)
  const [repoInfo, setRepoInfo] = useState<RepoMeta | null>(null)

  useEffect(() => {
    if (!repoId) return
    setIsLoading(true)
    Promise.all([
      releaseService.getReleases(repoId),
      releaseService.getRepos()
    ])
      .then(([rel, repos]) => {
        setReleases(rel)
        const currentRepo = repos.find(r => r.id === repoId)
        setRepoInfo(currentRepo || null)
        setError(null)
      })
      .catch(() => setError('릴리즈/통계 정보를 불러올 수 없습니다.'))
      .finally(() => setIsLoading(false))
  }, [repoId])

  const handleDownloadCSV = async () => {
    if (!repoId) return
    try {
      const blob = await releaseService.getCSV(repoId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${repoId.replace('/', '-')}-releases.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {}
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  return (
    <div className="space-y-8 px-2 md:px-0 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{repoInfo?.name || repoId}</h1>
            <p className="text-gray-500">{repoInfo?.description || ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {repoInfo?.url && (
            <a
              href={repoInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400"
            >
              <Github className="w-5 h-5 mr-2" />
              GitHub 저장소
            </a>
          )}
          <Button
            onClick={handleDownloadCSV}
            variant="primary"
            disabled={!repoId}
          >
            <Download className="w-4 h-4" />
            CSV 다운로드
          </Button>
        </div>
      </div>
      {releases && <ReleaseCharts releases={releases} />}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">릴리즈 목록</h2>
        </div>
        <div className="p-4 overflow-x-auto">
          <ReleaseList releases={releases} isLoading={false} />
        </div>
      </div>
    </div>
  )
} 