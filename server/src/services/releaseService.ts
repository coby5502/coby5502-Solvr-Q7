import { fetchGithubReleases, GithubRelease } from './githubService'
import { RepoInfo } from '../types/release'

interface RepoReleases {
  [repo: string]: GithubRelease[]
}

let releasesByRepo: RepoReleases = {}
let repoList: RepoInfo[] = []

const REPO_META: Record<string, { name: string; description: string; url: string }> = {
  'daangn/stackflow': {
    name: 'Stackflow',
    description: 'React Native용 스택 기반 네비게이션 라이브러리',
    url: 'https://github.com/daangn/stackflow'
  },
  'daangn/seed-design': {
    name: 'Seed Design',
    description: '당근마켓의 디자인 시스템',
    url: 'https://github.com/daangn/seed-design'
  }
}

export async function loadAllReleasesFromGithub() {
  const repo1 = process.env.GITHUB_REPO_1
  const repo2 = process.env.GITHUB_REPO_2
  const token = process.env.GITHUB_TOKEN
  const repos = [repo1, repo2].filter(Boolean) as string[]
  repoList = repos.map(id => ({
    id,
    name: REPO_META[id]?.name || id,
    description: REPO_META[id]?.description || '',
    url: REPO_META[id]?.url || `https://github.com/${id}`
  }))
  for (const repo of repos) {
    try {
      releasesByRepo[repo] = await fetchGithubReleases(repo, token)
    } catch (e) {
      releasesByRepo[repo] = []
      console.error(`Failed to fetch releases for ${repo}:`, e)
    }
  }
}

export function getRepoList() {
  return repoList
}

export function getReleases(repo?: string) {
  if (!repo) {
    // 전체 릴리즈를 합쳐서 반환할 때도 정렬
    return Object.values(releasesByRepo).flat().sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  }
  // 개별 저장소 릴리즈도 정렬
  return (releasesByRepo[repo] || []).slice().sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
}

export function getStatistics(repo?: string) {
  const releases = repo ? (releasesByRepo[repo] || []) : Object.values(releasesByRepo).flat()
  // UTC 기준
  const now = new Date()
  // 연간
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
  const yearlyReleases = releases.filter(r => new Date(r.published_at) >= oneYearAgo).length
  // 월별
  const monthlyStats = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const count = releases.filter(r => {
      const d = new Date(r.published_at)
      return d.getFullYear() === now.getFullYear() && d.getMonth() + 1 === month
    }).length
    return { month, count }
  })
  // 주간 (이번 달)
  const weeks: { start: number; end: number }[] = []
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  let current = new Date(firstDay)
  while (current.getDay() !== 1 && current <= lastDay) current.setDate(current.getDate() + 1)
  while (current <= lastDay) {
    const start = current.getDate()
    let end = start
    for (let i = 1; i < 5 && current < lastDay; i++) {
      current.setDate(current.getDate() + 1)
      end = current.getDate()
    }
    const weekStart = new Date(now.getFullYear(), now.getMonth(), start)
    const weekEnd = new Date(now.getFullYear(), now.getMonth(), end)
    if (weekEnd > lastDay) weekEnd.setDate(lastDay.getDate())
    const daysInMonth = Array.from({ length: weekEnd.getDate() - weekStart.getDate() + 1 }, (_, i) => weekStart.getDate() + i)
      .filter(d => d >= 1 && d <= lastDay.getDate())
    if (weekStart.getMonth() === now.getMonth() && daysInMonth.length >= 3) {
      weeks.push({ start: weekStart.getDate(), end: weekEnd.getDate() })
    }
    current.setDate(end + 1)
    while (current.getDay() !== 1 && current <= lastDay) current.setDate(current.getDate() + 1)
  }
  const weeklyStats = weeks.map(w => {
    const count = releases.filter(r => {
      const d = new Date(r.published_at)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() >= w.start && d.getDate() <= w.end
    }).length
    return { week: `${w.start}~${w.end}`, count }
  })
  // 일간 (오늘, UTC 기준)
  const nowUTC = now
  const dailyStats = Array.from({ length: 24 }, (_, hour) => {
    const count = releases.filter(r => {
      const d = new Date(r.published_at)
      return d.getFullYear() === nowUTC.getFullYear() &&
             d.getMonth() === nowUTC.getMonth() &&
             d.getDate() === nowUTC.getDate() &&
             d.getHours() === hour
    }).length
    return { hour, count }
  })
  return {
    totalReleases: releases.length,
    yearlyReleases,
    monthlyStats,
    weeklyStats,
    dailyStats
  }
}

export function getCSV(repo?: string) {
  const releases = repo ? (releasesByRepo[repo] || []) : Object.values(releasesByRepo).flat()
  const headers = ['Repo', 'Version', 'Release Date', 'Name', 'Description']
  const rows = releases.map(r => [repo || '', r.tag_name, r.published_at, r.name, r.body])
  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
} 