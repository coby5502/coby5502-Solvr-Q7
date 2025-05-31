// @ts-ignore
import fetch from 'node-fetch'

export interface GithubRelease {
  tag_name: string
  name: string
  published_at: string
  body: string
}

export async function fetchGithubReleases(repo: string, token?: string): Promise<GithubRelease[]> {
  const url = `https://api.github.com/repos/${repo}/releases?per_page=100`
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json'
  }
  if (token) headers['Authorization'] = `token ${token}`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`Failed to fetch releases for ${repo}`)
  const data = await res.json()
  return Array.isArray(data)
    ? data.map(r => ({
        tag_name: r.tag_name,
        name: r.name || r.tag_name,
        published_at: r.published_at,
        body: r.body || ''
      }))
    : []
} 