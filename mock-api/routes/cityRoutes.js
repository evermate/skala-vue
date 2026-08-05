import {
  createCity,
  deleteCity,
  findCityById,
  listCities,
  updateCity,
} from '../data/cityStore.js'
import { createHttpError, readJsonBody, sendJson } from '../utils/httpUtils.js'

function validateCreate(body) {
  if (typeof body.id !== 'string' || !body.id) return '도시 id는 필수입니다.'
  if (typeof body.name !== 'string' || !body.name.trim()) return '도시명은 필수입니다.'
  if (!Number.isFinite(Number(body.lat)) || !Number.isFinite(Number(body.lon))) {
    return '좌표가 올바르지 않습니다.'
  }
  if (body.region !== 'domestic' && body.region !== 'international') {
    return 'region 값이 올바르지 않습니다.'
  }
  return null
}

export async function handleCityRoutes(request, response, url) {
  const itemMatch = url.pathname.match(/^\/api\/custom-cities\/([^/]+)$/)

  if (request.method === 'GET' && url.pathname === '/api/custom-cities') {
    sendJson(response, 200, listCities())
    return true
  }

  if (request.method === 'POST' && url.pathname === '/api/custom-cities') {
    const body = await readJsonBody(request)
    const error = validateCreate(body)
    if (error) throw createHttpError(400, error)
    if (findCityById(body.id)) throw createHttpError(400, '이미 존재하는 도시 id입니다.')

    const city = createCity({
      id: body.id,
      name: body.name.trim(),
      lat: Number(body.lat),
      lon: Number(body.lon),
      region: body.region,
      memo: body.memo ?? '',
    })
    sendJson(response, 201, city)
    return true
  }

  if (request.method === 'PATCH' && itemMatch) {
    const id = itemMatch[1]
    if (!findCityById(id)) throw createHttpError(404, '수정할 도시를 찾을 수 없습니다.')

    const body = await readJsonBody(request)
    const patch = {}
    if (Object.hasOwn(body, 'memo')) {
      if (typeof body.memo !== 'string') throw createHttpError(400, '메모는 문자열이어야 합니다.')
      patch.memo = body.memo
    }

    sendJson(response, 200, updateCity(id, patch))
    return true
  }

  if (request.method === 'DELETE' && itemMatch) {
    const deleted = deleteCity(itemMatch[1])
    if (!deleted) throw createHttpError(404, '삭제할 도시를 찾을 수 없습니다.')
    sendJson(response, 200, deleted)
    return true
  }

  return false
}
