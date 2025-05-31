export interface Release {
  id: string
  tag_name: string
  name: string
  body: string
  published_at: string
  html_url: string
}

export interface RepoMeta {
  id: string
  name: string
  description: string
  url: string
}

export interface ReleaseStats {
  yearly: Record<string, number>
  monthly: Record<string, number>
  weekly: Record<string, number>
  daily: Record<string, number>
} 