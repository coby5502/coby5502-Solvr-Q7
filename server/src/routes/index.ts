import { FastifyInstance } from 'fastify'
import healthRoutes from './healthRoutes'
import releaseRoutes from './releaseRoutes'

// 모든 라우트 등록
export const createRoutes = () => async (fastify: FastifyInstance) => {
  // 헬스 체크 라우트
  fastify.register(healthRoutes, { prefix: '/api/health' })

  // 릴리스 관련 라우트
  fastify.register(releaseRoutes)
}
