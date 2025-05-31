import { Release } from '../types/release'

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN

export async function fetchReleases(url: string): Promise<Release[]> {
  const [owner, repo] = url.split('/').slice(-2)
  console.log('Fetching releases for:', owner, repo)

  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json'
  }

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases?per_page=100`,
    { headers }
  )
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Repository not found')
    }
    if (response.status === 403) {
      throw new Error('API rate limit exceeded')
    }
    throw new Error('Failed to fetch releases')
  }

  const data = await response.json()
  console.log('API Response:', data)

  if (!Array.isArray(data)) {
    console.error('Invalid API response:', data)
    throw new Error('Invalid API response')
  }

  const releases = data.map((release: any) => ({
    tag_name: release.tag_name,
    name: release.name || release.tag_name,
    published_at: release.published_at,
    body: release.body || ''
  }))

  console.log('Processed releases:', releases)
  return releases
}

// 두 날짜 사이의 근무일(월~금) 수 계산
function countBusinessDays(start: Date, end: Date): number {
  let count = 0
  let current = new Date(start)
  current.setHours(0, 0, 0, 0)
  end = new Date(end)
  end.setHours(0, 0, 0, 0)
  while (current < end) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++ // 0: 일, 6: 토
    current.setDate(current.getDate() + 1)
  }
  return count
}

export function calculateStats(releases: Release[]) {
  console.log('Calculating stats for releases:', releases)

  if (!releases.length) {
    console.log('No releases found, returning empty stats')
    return {
      totalReleases: 0,
      yearlyReleases: 0,
      avgTimeBetweenReleases: 0,
      monthlyStats: Array(12).fill({ month: '', count: 0 }),
      weeklyStats: Array(7).fill({ day: '', count: 0 }),
      dailyStats: Array(24).fill({ hour: 0, count: 0 })
    }
  }

  const now = new Date()
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // 연간 통계
  const yearlyReleases = releases.filter(release => 
    new Date(release.published_at) >= oneYearAgo
  ).length

  // 월간 통계
  const monthlyStats = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const count = releases.filter(release => {
      const date = new Date(release.published_at)
      return date >= month && date < nextMonth
    }).length
    return {
      month: month.toLocaleDateString('ko-KR', { month: 'short' }),
      count
    }
  }).reverse()

  // 주간 통계
  const weeklyStats = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const nextDay = new Date(now.getTime() - (i - 1) * 24 * 60 * 60 * 1000)
    const count = releases.filter(release => {
      const date = new Date(release.published_at)
      return date >= day && date < nextDay
    }).length
    return {
      day: day.toLocaleDateString('ko-KR', { weekday: 'short' }),
      count
    }
  }).reverse()

  // 일간 통계
  const dailyStats = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000)
    const nextHour = new Date(now.getTime() - (i - 1) * 60 * 60 * 1000)
    const count = releases.filter(release => {
      const date = new Date(release.published_at)
      return date >= hour && date < nextHour
    }).length
    return {
      hour: hour.getHours(),
      count
    }
  }).reverse()

  // 평균 배포 주기 계산 (근무일 기준)
  const sortedReleases = [...releases].sort((a, b) => 
    new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
  )
  
  let totalBusinessDays = 0
  for (let i = 1; i < sortedReleases.length; i++) {
    const prevDate = new Date(sortedReleases[i - 1].published_at)
    const currDate = new Date(sortedReleases[i].published_at)
    totalBusinessDays += countBusinessDays(prevDate, currDate)
  }
  const avgTimeBetweenReleases = sortedReleases.length > 1 
    ? Math.round(totalBusinessDays / (sortedReleases.length - 1))
    : 0

  const stats = {
    totalReleases: releases.length,
    yearlyReleases,
    avgTimeBetweenReleases,
    monthlyStats,
    weeklyStats,
    dailyStats
  }

  console.log('Calculated stats:', stats)
  return stats
}

export function generateCSV(releases: Release[], stats: any): string {
  const headers = ['Version', 'Release Date', 'Name', 'Description']
  const rows = releases.map(release => [
    release.tag_name,
    release.published_at,
    release.name,
    release.body
  ])

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
} 