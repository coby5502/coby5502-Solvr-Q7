import { useState, useMemo } from 'react'
import { Release } from '../../types/release'
import { Loading } from '../common/Loading'
import ReactMarkdown from 'react-markdown'

interface ReleaseListProps {
  releases: Release[]
  isLoading: boolean
}

// 한국 시간대로 변환하는 유틸리티 함수
function toKST(date: Date): Date {
  return new Date(date.getTime() + (9 * 60 * 60 * 1000))
}

// 한국 시간 포맷팅 함수
function formatKSTDate(date: Date): string {
  const kstDate = toKST(date)
  return kstDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 한국 시간 날짜만 포맷팅 함수
function formatKSTDateOnly(date: Date): string {
  const kstDate = toKST(date)
  return kstDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const PAGE_SIZE = 10

export function ReleaseList({ releases, isLoading }: ReleaseListProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null)

  const filtered = useMemo(() =>
    releases.filter(r =>
      r.tag_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.name && r.name.toLowerCase().includes(search.toLowerCase()))
    ),
    [releases, search]
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // 페이지/검색어 변경 시 페이지를 1로
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  if (isLoading) {
    return <Loading />
  }

  if (releases.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">릴리즈 정보가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="릴리즈명 또는 버전명 검색"
          className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        {totalPages > 1 && (
          <div className="flex flex-row gap-1 w-full mt-2 sm:mt-0 overflow-x-auto whitespace-nowrap min-w-0 pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 justify-center sm:justify-end max-w-full">
            <button
              className="sm:px-2 px-1 py-1 rounded border sm:text-sm text-xs disabled:opacity-50 flex-shrink-0"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`sm:px-2 px-1 py-1 rounded border sm:text-sm text-xs flex-shrink-0 ${page === i + 1 ? 'bg-orange-100 border-orange-400 font-bold' : 'border-gray-200'}`}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="sm:px-2 px-1 py-1 rounded border sm:text-sm text-xs disabled:opacity-50 flex-shrink-0"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              다음
            </button>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed">
          <colgroup>
            <col style={{ width: '200px', minWidth: '200px', maxWidth: '200px' }} />
            <col style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }} />
            <col style={{ width: '200px', minWidth: '200px', maxWidth: '200px' }} />
          </colgroup>
          <thead className="bg-gray-50">
            <tr>
              <th style={{ width: '200px', minWidth: '200px', maxWidth: '200px' }} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap overflow-hidden truncate">버전</th>
              <th style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap overflow-hidden truncate">배포일</th>
              <th style={{ width: '200px', minWidth: '200px', maxWidth: '200px' }} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap overflow-hidden truncate">이름</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paged.map((release) => (
              <tr 
                key={release.tag_name}
                onClick={() => setSelectedRelease(release)}
                className="cursor-pointer hover:bg-gray-50"
              >
                <td style={{ width: '200px', minWidth: '200px', maxWidth: '200px' }} className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap overflow-hidden truncate">{release.tag_name}</td>
                <td style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }} className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap overflow-hidden truncate">{formatKSTDateOnly(new Date(release.published_at))}</td>
                <td style={{ width: '200px', minWidth: '200px', maxWidth: '200px' }} className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap overflow-hidden truncate">{release.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedRelease && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedRelease(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{selectedRelease.name}</h3>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedRelease(null)
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="text-sm text-gray-500 mb-4">
                <span className="font-medium">버전:</span> {selectedRelease.tag_name}
                <span className="mx-2">•</span>
                <span className="font-medium">배포일:</span> {formatKSTDate(new Date(selectedRelease.published_at))}
              </div>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown className="whitespace-pre-wrap text-gray-700">{selectedRelease.body || ''}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 