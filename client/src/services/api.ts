import axios from 'axios'

export interface RepoMeta {
  id: string
  name: string
  description: string
  url: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const releaseService = {
  getRepos: async (): Promise<RepoMeta[]> => {
    const res = await api.get('/repos')
    return res.data
  },
  getReleases: async (repo: string) => {
    const res = await api.get('/releases', { params: { repo } })
    return res.data
  },
  getStatistics: async (repo: string) => {
    const res = await api.get('/statistics', { params: { repo } })
    return res.data
  },
  getCSV: async (repo: string) => {
    const res = await api.get('/releases/csv', { params: { repo }, responseType: 'blob' })
    return res.data as Blob
  }
}

export default api
