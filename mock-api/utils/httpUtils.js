const corsHeaders = {
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json; charset=utf-8',
}

export function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, corsHeaders)
  if (statusCode === 204) {
    response.end()
    return
  }
  response.end(JSON.stringify(payload))
}

export function createHttpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

export function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = []

    request.on('data', (chunk) => chunks.push(chunk))
    request.on('error', reject)
    request.on('end', () => {
      if (chunks.length === 0) {
        resolve({})
        return
      }
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
          reject(createHttpError(400, '요청 본문은 JSON 객체여야 합니다.'))
          return
        }
        resolve(body)
      } catch {
        reject(createHttpError(400, '올바른 JSON 형식이 아닙니다.'))
      }
    })
  })
}

export function sendError(response, error) {
  const statusCode = Number(error.statusCode) || 500
  const message = statusCode === 500 ? '서버 내부 오류가 발생했습니다.' : error.message
  if (statusCode === 500) console.error(error)
  sendJson(response, statusCode, { message })
}
