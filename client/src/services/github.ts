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

  // 평균 배포 주기 계산
  const sortedReleases = [...releases].sort((a, b) => 
    new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
  )
  
  let totalDays = 0
  for (let i = 1; i < sortedReleases.length; i++) {
    const prevDate = new Date(sortedReleases[i - 1].published_at)
    const currDate = new Date(sortedReleases[i].published_at)
    totalDays += (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
  }
  
  const avgTimeBetweenReleases = sortedReleases.length > 1 
    ? Math.round(totalDays / (sortedReleases.length - 1))
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