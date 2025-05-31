import { FastifyInstance } from 'fastify'
import { getReleases, getStatistics, getCSV, getRepoList } from '../services/releaseService'

export default async function releaseRoutes(fastify: FastifyInstance) {
  // 저장소 목록 (메타데이터 포함)
  fastify.get('/api/repos', async (req, reply) => {
    return getRepoList()
  })

  // 전체 릴리즈 목록 (repo query)
  fastify.get('/api/releases', async (req, reply) => {
    const repo = (req.query as any).repo
    return getReleases(repo)
  })

  // 통계 정보 (repo query)
  fastify.get('/api/statistics', async (req, reply) => {
    const repo = (req.query as any).repo
    return getStatistics(repo)
  })

  // CSV 다운로드 (repo query)
  fastify.get('/api/releases/csv', async (req, reply) => {
    const repo = (req.query as any).repo
    const csv = getCSV(repo)
    reply.header('Content-Type', 'text/csv')
    reply.header('Content-Disposition', 'attachment; filename="releases.csv"')
    return csv
  })
} 