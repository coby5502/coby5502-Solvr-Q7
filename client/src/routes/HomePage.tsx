import { useEffect, useState } from 'react'
import { Button } from '../components/common/Button'
import { Github, Download } from 'lucide-react'
import { releaseService, RepoMeta } from '../services/api'
import { useNavigate } from 'react-router-dom'

export function HomePage() {
  const navigate = useNavigate()
  const [repos, setRepos] = useState<RepoMeta[]>([])
  const [releases, setReleases] = useState<Record<string, any[]>>({})
  const [downloading, setDownloading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    releaseService.getRepos()
      .then((repos) => {
        setRepos(repos)
        // 미리 릴리즈 일부만 받아오기(선택적)
        repos.forEach(repo => {
          releaseService.getReleases(repo.id)
            .then(list => setReleases(prev => ({ ...prev, [repo.id]: list })))
        })
      })
      .catch(() => setError('저장소 목록을 불러올 수 없습니다.'))
  }, [])

  const handleDownloadCSV = async (repo: RepoMeta, e: React.MouseEvent) => {
    e.stopPropagation()
    setDownloading(repo.id)
    try {
      const blob = await releaseService.getCSV(repo.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${repo.id.replace('/', '-')}-releases.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } finally {
      setDownloading(null)
    }
  }

  if (error) return <div className="text-center py-8 text-red-500">{error}</div>

  return (
    <div className="flex flex-col items-center space-y-6 px-4 py-8 max-w-2xl mx-auto">
      {repos.map((repo) => (
        <div
          key={repo.id}
          tabIndex={0}
          role="button"
          onClick={() => navigate(`/dashboard/${encodeURIComponent(repo.id)}`)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`/dashboard/${encodeURIComponent(repo.id)}`) }}
          className="w-full bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4 transition hover:shadow-md hover:bg-orange-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-1">{repo.name}</h2>
          <p className="text-gray-600 mb-4 text-base">{repo.description}</p>
          <div className="flex justify-end items-center gap-2 mt-2">
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400"
              onClick={e => e.stopPropagation()}
            >
              <Github className="w-5 h-5 mr-2" />
              GitHub 저장소
            </a>
            <Button
              variant="primary"
              className="flex items-center"
              onClick={e => { e.stopPropagation(); handleDownloadCSV(repo, e) }}
              disabled={downloading === repo.id}
            >
              <Download className="w-4 h-4" />
              {downloading === repo.id ? '다운로드 중...' : 'CSV 다운로드'}
            </Button>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            최근 릴리즈: {releases[repo.id]?.[0]?.tag_name || '없음'}
          </div>
        </div>
      ))}
    </div>
  )
}
