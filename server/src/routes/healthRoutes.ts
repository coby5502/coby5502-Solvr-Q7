import { FastifyInstance } from 'fastify'

// 헬스 체크 라우트 등록
export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (req, reply) => {
    return { status: 'ok' }
  })
}
