import { initialJournal } from '@/mock/initialData.js'

const storageKey = 'skala-vue-mock:v1'
const weatherTags = ['맑음', '흐림', '비', '눈', '기타']

function clone(value) {
  return structuredClone(value)
}

function createInitialState() {
  return { version: 1, cities: [], journal: clone(initialJournal) }
}

function getStorage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function isValidState(value) {
  return value?.version === 1 && Array.isArray(value.cities) && Array.isArray(value.journal)
}

function readState() {
  const storage = getStorage()
  if (!storage) return createInitialState()

  try {
    const saved = JSON.parse(storage.getItem(storageKey))
    if (isValidState(saved)) return saved
  } catch {
    // 저장값이 손상됐으면 초기 상태로 교체
  }

  const initial = createInitialState()
  writeState(initial)
  return initial
}

function writeState(state) {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.setItem(storageKey, JSON.stringify(state))
  } catch {
    // 저장 공간이 없어도 요청 자체는 계속 성공 처리
  }
}

function response(config, status, data) {
  return { data, status, statusText: '', headers: {}, config, request: null }
}

function reject(config, status, message) {
  const error = new Error(message)
  error.config = config
  error.response = response(config, status, { message })
  return Promise.reject(error)
}

function parseBody(config) {
  if (config.data == null || config.data === '') return {}
  if (typeof config.data === 'object') return config.data
  try {
    return JSON.parse(config.data)
  } catch {
    return null
  }
}

function nextId(items) {
  return items.length === 0 ? 1 : Math.max(...items.map((item) => Number(item.id) || 0)) + 1
}

function handleSystem(config, method, pathname) {
  if (method === 'GET' && pathname === '/health') {
    const state = readState()
    return response(config, 200, { status: 'ok', cityCount: state.cities.length, journalCount: state.journal.length })
  }
  if (method === 'POST' && pathname === '/reset') {
    writeState(createInitialState())
    return response(config, 200, { message: 'Mock 데이터가 초기화되었습니다.' })
  }
  return null
}

function handleCities(config, method, pathname) {
  const state = readState()
  const itemMatch = pathname.match(/^\/custom-cities\/([^/]+)$/)

  if (method === 'GET' && pathname === '/custom-cities') {
    return response(config, 200, state.cities)
  }

  if (method === 'POST' && pathname === '/custom-cities') {
    const body = parseBody(config)
    if (!body?.id || !body?.name) return reject(config, 400, '도시 정보가 올바르지 않습니다.')
    if (state.cities.some((c) => c.id === body.id)) {
      return reject(config, 400, '이미 존재하는 도시 id입니다.')
    }
    const city = {
      id: body.id,
      name: body.name,
      lat: Number(body.lat),
      lon: Number(body.lon),
      region: body.region,
      memo: body.memo ?? '',
    }
    state.cities.push(city)
    writeState(state)
    return response(config, 201, city)
  }

  if (method === 'PATCH' && itemMatch) {
    const city = state.cities.find((c) => c.id === itemMatch[1])
    if (!city) return reject(config, 404, '수정할 도시를 찾을 수 없습니다.')
    const body = parseBody(config)
    if (Object.hasOwn(body, 'memo')) city.memo = body.memo
    writeState(state)
    return response(config, 200, city)
  }

  if (method === 'DELETE' && itemMatch) {
    const index = state.cities.findIndex((c) => c.id === itemMatch[1])
    if (index === -1) return reject(config, 404, '삭제할 도시를 찾을 수 없습니다.')
    const [deleted] = state.cities.splice(index, 1)
    writeState(state)
    return response(config, 200, deleted)
  }

  return null
}

function validateJournal(body, partial) {
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

function handleJournal(config, method, pathname) {
  const state = readState()
  const itemMatch = pathname.match(/^\/journal\/(\d+)$/)

  if (method === 'GET' && pathname === '/journal') {
    return response(config, 200, state.journal.toSorted((a, b) => b.id - a.id))
  }

  if (method === 'POST' && pathname === '/journal') {
    const body = parseBody(config)
    const error = validateJournal(body, false)
    if (error) return reject(config, 400, error)

    const now = new Date().toISOString()
    const entry = {
      id: nextId(state.journal),
      cityName: body.cityName.trim(),
      weatherTag: body.weatherTag,
      content: body.content.trim(),
      createdAt: now,
      updatedAt: now,
    }
    state.journal.push(entry)
    writeState(state)
    return response(config, 201, entry)
  }

  if (method === 'PATCH' && itemMatch) {
    const entry = state.journal.find((e) => e.id === Number(itemMatch[1]))
    if (!entry) return reject(config, 404, '수정할 일지를 찾을 수 없습니다.')
    const body = parseBody(config)
    const error = validateJournal(body, true)
    if (error) return reject(config, 400, error)

    for (const field of ['cityName', 'weatherTag', 'content']) {
      if (Object.hasOwn(body, field)) entry[field] = String(body[field]).trim()
    }
    entry.updatedAt = new Date().toISOString()
    writeState(state)
    return response(config, 200, entry)
  }

  if (method === 'DELETE' && itemMatch) {
    const index = state.journal.findIndex((e) => e.id === Number(itemMatch[1]))
    if (index === -1) return reject(config, 404, '삭제할 일지를 찾을 수 없습니다.')
    const [deleted] = state.journal.splice(index, 1)
    writeState(state)
    return response(config, 200, deleted)
  }

  return null
}

export async function staticMockAdapter(config) {
  const method = (config.method ?? 'get').toUpperCase()
  const fullUrl = new URL(config.url ?? '/', 'https://mock.invalid')
  const pathname = fullUrl.pathname.replace(/^\/api(?=\/|$)/, '') || '/'

  const handlers = [handleSystem, handleCities, handleJournal]
  for (const handle of handlers) {
    const result = handle(config, method, pathname)
    if (result) return result
  }

  return reject(config, 404, '존재하지 않는 Mock API 경로입니다.')
}
