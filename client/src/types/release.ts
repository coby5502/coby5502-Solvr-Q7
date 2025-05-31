export interface Release {
  tag_name: string
  name: string
  published_at: string
  body: string
}

export interface ReleaseStats {
  yearly: Record<string, number>
  monthly: Record<string, number>
  weekly: Record<string, number>
  daily: Record<string, number>
} 