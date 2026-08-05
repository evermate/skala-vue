import { initialJournal, initialUsers } from '@/mock/initialData.js'

const storageKey = 'skala-vue-mock:v2'
const weatherTags = ['맑음', '흐림', '비', '눈', '기타']

// Node crypto.createHmac가 브라우저엔 없어서, 같은 HMAC-SHA256 서명/검증을
// Web Crypto API(SubtleCrypto)로 재구현한다. 새 의존성 필요 없음(브라우저 표준 API).
const JWT_SECRET = 'skala-vue-classroom-only'
const TOKEN_TTL_SECONDS = 15 * 60
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clone(value) {
  return structuredClone(value)
}

function createInitialState() {
  return { version: 2, cities: [], journal: clone(initialJournal), users: clone(initialUsers) }
}

function getStorage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function isValidState(value) {
  return (
    value?.version === 2 &&
    Array.isArray(value.cities) &&
    Array.isArray(value.journal) &&
    Array.isArray(value.users)
  )
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

function getAuthorizationHeader(config) {
  const headers = config.headers
  if (!headers) return null
  if (typeof headers.get === 'function') return headers.get('Authorization')
  return headers.Authorization ?? headers.authorization ?? null
}

// ── JWT (Web Crypto HMAC-SHA256) ──────────────────────────────────────────

function base64UrlEncodeBytes(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function base64UrlEncodeJson(value) {
  return base64UrlEncodeBytes(new TextEncoder().encode(JSON.stringify(value)))
}

function base64UrlDecodeToBytes(value) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function base64UrlDecodeToString(value) {
  return new TextDecoder().decode(base64UrlDecodeToBytes(value))
}

function getHmacKey() {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function createAccessToken(user) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = {
    sub: String(user.id),
    email: user.email,
    name: user.name,
    iat: issuedAt,
    exp: issuedAt + TOKEN_TTL_SECONDS,
    iss: 'skala-vue-static-mock',
  }

  const unsignedToken = `${base64UrlEncodeJson(header)}.${base64UrlEncodeJson(payload)}`
  const key = await getHmacKey()
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(unsignedToken),
  )

  return `${unsignedToken}.${base64UrlEncodeBytes(new Uint8Array(signatureBuffer))}`
}

// 유효하면 payload, 아니면 null. 서버 쪽처럼 throw 안 함 — 호출부에서 401 reject로
// 바꾸기 편하라고 값으로 돌려줌.
async function verifyAccessToken(token) {
  const segments = token.split('.')
  if (segments.length !== 3) return null

  const [encodedHeader, encodedPayload, receivedSignature] = segments
  const unsignedToken = `${encodedHeader}.${encodedPayload}`

  const key = await getHmacKey()
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlDecodeToBytes(receivedSignature),
    new TextEncoder().encode(unsignedToken),
  )
  if (!isValid) return null

  let payload
  try {
    payload = JSON.parse(base64UrlDecodeToString(encodedPayload))
  } catch {
    return null
  }

  const now = Math.floor(Date.now() / 1000)
  if (!payload.exp || payload.exp <= now) return null

  return payload
}

function toPublicUser(user) {
  const { password: _password, ...publicUser } = user
  return publicUser
}

// 인증 성공 시 공개 유저 정보, 실패 시 null.
async function authenticateStaticRequest(config, state) {
  const authorization = getAuthorizationHeader(config) ?? ''
  const [tokenType, token] = authorization.split(' ')
  if (tokenType !== 'Bearer' || !token) return null

  const payload = await verifyAccessToken(token)
  if (!payload) return null

  const user = state.users.find((item) => String(item.id) === payload.sub)
  return user ? toPublicUser(user) : null
}

// ── 시스템/도시/일지 핸들러 (기존과 동일) ──────────────────────────────────

function handleSystem(config, method, pathname) {
  if (method === 'GET' && pathname === '/health') {
    const state = readState()
    return response(config, 200, {
      status: 'ok',
      cityCount: state.cities.length,
      journalCount: state.journal.length,
    })
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

async function handleJournal(config, method, pathname) {
  const state = readState()
  const itemMatch = pathname.match(/^\/journal\/(\d+)$/)
  const isJournalPath = pathname === '/journal' || Boolean(itemMatch)

  // 날씨 일지 CRUD는 로그인해야 쓸 수 있다(조회 포함). Node 서버 쪽 journalRoutes.js와
  // 동일한 규칙.
  if (isJournalPath) {
    const user = await authenticateStaticRequest(config, state)
    if (!user) return reject(config, 401, 'Bearer Access Token이 필요합니다.')
  }

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

// ── 인증 핸들러 ─────────────────────────────────────────────────────────

async function handleAuth(config, method, pathname) {
  const state = readState()

  if (method === 'POST' && pathname === '/auth/signup') {
    const body = parseBody(config)
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const name = body.name?.trim()

    if (!email || !EMAIL_PATTERN.test(email)) {
      return reject(config, 400, '올바른 이메일 형식이 아닙니다.')
    }
    if (!password || password.length < 4) {
      return reject(config, 400, '비밀번호는 4자 이상이어야 합니다.')
    }
    if (!name) {
      return reject(config, 400, '이름을 입력해주세요.')
    }
    if (state.users.some((user) => user.email === email)) {
      return reject(config, 409, '이미 가입된 이메일입니다.')
    }

    const user = { id: nextId(state.users), email, password, name }
    state.users.push(user)
    writeState(state)

    return response(config, 201, {
      message: '회원가입이 완료되었습니다.',
      user: toPublicUser(user),
    })
  }

  if (method === 'POST' && pathname === '/auth/login') {
    const body = parseBody(config)
    const email = body.email?.trim().toLowerCase()
    const password = body.password

    if (!email || !password) {
      return reject(config, 400, '이메일과 비밀번호를 입력해주세요.')
    }

    const user = state.users.find((item) => item.email === email)
    if (!user || user.password !== password) {
      return reject(config, 401, '이메일 또는 비밀번호가 올바르지 않습니다.')
    }

    const accessToken = await createAccessToken(user)

    return response(config, 200, {
      message: '로그인에 성공했습니다.',
      tokenType: 'Bearer',
      accessToken,
      expiresIn: TOKEN_TTL_SECONDS,
      user: toPublicUser(user),
    })
  }

  return null
}

export async function staticMockAdapter(config) {
  const method = (config.method ?? 'get').toUpperCase()
  const fullUrl = new URL(config.url ?? '/', 'https://mock.invalid')
  const pathname = fullUrl.pathname.replace(/^\/api(?=\/|$)/, '') || '/'

  const handlers = [handleAuth, handleSystem, handleCities, handleJournal]
  for (const handle of handlers) {
    const result = await handle(config, method, pathname)
    if (result) return result
  }

  return reject(config, 404, '존재하지 않는 Mock API 경로입니다.')
}
