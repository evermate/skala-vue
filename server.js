import http from 'node:http'

import { resetCities, listCities } from './mock-api/data/cityStore.js'
import { resetJournal, listJournal } from './mock-api/data/journalStore.js'
import { handleCityRoutes } from './mock-api/routes/cityRoutes.js'
import { handleJournalRoutes } from './mock-api/routes/journalRoutes.js'
import { sendError, sendJson } from './mock-api/utils/httpUtils.js'

const port = Number(process.env.API_PORT ?? 3001)

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204)
    return
  }

  const host = request.headers.host ?? `localhost:${port}`
  const url = new URL(request.url ?? '/', `http://${host}`)

  try {
    if (request.method === 'GET' && url.pathname === '/api/health') {
      sendJson(response, 200, {
        status: 'ok',
        cityCount: listCities().length,
        journalCount: listJournal().length,
      })
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/reset') {
      resetCities()
      resetJournal()
      sendJson(response, 200, { message: 'Mock 데이터가 초기화되었습니다.' })
      return
    }

    if (await handleCityRoutes(request, response, url)) return
    if (await handleJournalRoutes(request, response, url)) return

    sendJson(response, 404, { message: '존재하지 않는 API 경로입니다.' })
  } catch (error) {
    sendError(response, error)
  }
})

server.listen(port, () => {
  console.log(`Mock API 실행 중: http://localhost:${port}/api`)
})

export { server }
