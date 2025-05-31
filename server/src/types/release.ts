export interface Release {
  tag_name: string;
  name: string;
  published_at: string; // ISO 8601
  body: string;
}

export interface RepoInfo {
  id: string;
  name: string;
  description: string;
  url: string;
} 