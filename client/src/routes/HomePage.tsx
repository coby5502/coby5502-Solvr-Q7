import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { Github, Download } from 'lucide-react'
import { fetchReleases, generateCSV, calculateStats } from '../services/github'
import { useState } from 'react'

const REPOSITORIES = [
  {
    name: 'Stackflow',
    description: 'React Native용 스택 기반 라우팅 라이브러리',
    url: 'https://github.com/daangn/stackflow',
    path: '/stackflow'
  },
  {
    name: 'Seed Design',
    description: '당근마켓의 디자인 시스템',
    url: 'https://github.com/daangn/seed-design',
    path: '/seed-design'
  }
]

export function HomePage() {
  const navigate = useNavigate()
  const [downloading, setDownloading] = useState<string | null>(null)

  const handleDownloadCSV = async (repo: typeof REPOSITORIES[number]) => {
    setDownloading(repo.path)
    try {
      const releases = await fetchReleases(repo.url)
      const stats = calculateStats(releases)
      const csv = generateCSV(releases, stats)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${repo.path}-releases.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-6 px-4 py-8 max-w-lg mx-auto">
      {REPOSITORIES.map((repo) => (
        <div
          key={repo.path}
          tabIndex={0}
          role="button"
          onClick={() => navigate(repo.path)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(repo.path) }}
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
              onClick={e => { e.stopPropagation(); handleDownloadCSV(repo) }}
              disabled={downloading === repo.path}
            >
              <Download className="w-4 h-4" />
              {downloading === repo.path ? '다운로드 중...' : 'CSV 다운로드'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
