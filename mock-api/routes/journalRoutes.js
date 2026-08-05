import {
  createJournal,
  deleteJournal,
  findJournalById,
  listJournal,
  updateJournal,
} from '../data/journalStore.js'
import { createHttpError, readJsonBody, sendJson } from '../utils/httpUtils.js'

const weatherTags = ['맑음', '흐림', '비', '눈', '기타']

function validate(body, partial = false) {
  if ((!partial || Object.hasOwn(body, 'cityName')) && !String(body.cityName ?? '').trim()) {
    return '관측 도시는 필수입니다.'
  }
  if ((!partial || Object.hasOwn(body, 'weatherTag')) && !weatherTags.includes(body.weatherTag)) {
    return `weatherTag는 ${weatherTags.join('/')} 중 하나여야 합니다.`
  }
  if ((!partial || Object.hasOwn(body, 'content')) && !String(body.content ?? '').trim()) {
    return '내용은 필수입니다.'
  }
  return null
}

function normalize(body) {
  const normalized = {}
  for (const field of ['cityName', 'weatherTag', 'content']) {
    if (Object.hasOwn(body, field)) normalized[field] = String(body[field]).trim()
  }
  return normalized
}

export async function handleJournalRoutes(request, response, url) {
  const itemMatch = url.pathname.match(/^\/api\/journal\/(\d+)$/)

  if (request.method === 'GET' && url.pathname === '/api/journal') {
    sendJson(response, 200, listJournal())
    return true
  }

  if (request.method === 'POST' && url.pathname === '/api/journal') {
    const body = await readJsonBody(request)
    const error = validate(body)
    if (error) throw createHttpError(400, error)

    const entry = createJournal(normalize(body))
    sendJson(response, 201, entry)
    return true
  }

  if (request.method === 'PATCH' && itemMatch) {
    const id = Number(itemMatch[1])
    if (!findJournalById(id)) throw createHttpError(404, '수정할 일지를 찾을 수 없습니다.')

    const body = await readJsonBody(request)
    const error = validate(body, true)
    if (error) throw createHttpError(400, error)

    sendJson(response, 200, updateJournal(id, normalize(body)))
    return true
  }

  if (request.method === 'DELETE' && itemMatch) {
    const deleted = deleteJournal(Number(itemMatch[1]))
    if (!deleted) throw createHttpError(404, '삭제할 일지를 찾을 수 없습니다.')
    sendJson(response, 200, deleted)
    return true
  }

  return false
}
