import crypto from 'node:crypto'

import { createUser, findUserByEmail, findUserById } from '../data/userStore.js'
import { createHttpError, readJsonBody, sendJson } from '../utils/httpUtils.js'

const jwtSecret = process.env.MOCK_JWT_SECRET || 'skala-vue-classroom-only'
const tokenTtlSeconds = 15 * 60

function toPublicUser(user) {
  // 비밀번호는 클라이언트에 절대 응답하지 않는다.
  const { password: _password, ...publicUser } = user
  return publicUser
}

function encodeJson(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

/**
 * header.payload.signature 구조의 HMAC SHA-256 JWT를 생성한다.
 * 외부 라이브러리 없이 JWT 흐름을 보여주기 위한 mock 구현.
 */
function createAccessToken(user) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = {
    sub: String(user.id),
    email: user.email,
    name: user.name,
    iat: issuedAt,
    exp: issuedAt + tokenTtlSeconds,
    iss: 'skala-vue-mock-api',
  }

  const unsignedToken = `${encodeJson(header)}.${encodeJson(payload)}`
  const signature = crypto
    .createHmac('sha256', jwtSecret)
    .update(unsignedToken)
    .digest('base64url')

  return `${unsignedToken}.${signature}`
}

/**
 * Authorization 헤더로 받은 토큰의 형식, 서명, 만료 시간을 검사한다.
 */
function verifyAccessToken(token) {
  const segments = token.split('.')
  if (segments.length !== 3) {
    throw createHttpError(401, '올바른 JWT 형식이 아닙니다.')
  }

  const [encodedHeader, encodedPayload, receivedSignature] = segments
  const unsignedToken = `${encodedHeader}.${encodedPayload}`
  const expectedSignature = crypto
    .createHmac('sha256', jwtSecret)
    .update(unsignedToken)
    .digest('base64url')

  const expectedBuffer = Buffer.from(expectedSignature)
  const receivedBuffer = Buffer.from(receivedSignature)
  const signatureMatches =
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)

  if (!signatureMatches) {
    throw createHttpError(401, 'JWT 서명이 올바르지 않습니다.')
  }

  let payload
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))
  } catch {
    throw createHttpError(401, 'JWT Payload를 해석할 수 없습니다.')
  }

  const now = Math.floor(Date.now() / 1000)
  if (!payload.exp || payload.exp <= now) {
    throw createHttpError(401, 'Access Token이 만료되었습니다.')
  }

  return payload
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * journalRoutes 등 다른 라우트에서 "로그인 필요" 게이트로 재사용한다.
 * 실패하면 401 HttpError를 던진다.
 */
export function authenticateRequest(request) {
  const authorization = request.headers.authorization ?? ''
  const [tokenType, token] = authorization.split(' ')

  if (tokenType !== 'Bearer' || !token) {
    throw createHttpError(401, 'Bearer Access Token이 필요합니다.')
  }

  const payload = verifyAccessToken(token)
  const user = findUserById(Number(payload.sub))

  if (!user) {
    throw createHttpError(401, '토큰의 사용자를 찾을 수 없습니다.')
  }

  return toPublicUser(user)
}

export async function handleAuthRoutes(request, response, url) {
  // 1. 회원가입: 이메일/비밀번호/이름을 받아 유저를 생성한다. 가입 후 자동 로그인은
  // 안 시키고(토큰 발급 없음) 유저 정보만 응답 — 프론트에서 로그인 화면으로 보낸다.
  if (request.method === 'POST' && url.pathname === '/api/auth/signup') {
    const body = await readJsonBody(request)
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const name = body.name?.trim()

    if (!email || !EMAIL_PATTERN.test(email)) {
      throw createHttpError(400, '올바른 이메일 형식이 아닙니다.')
    }
    if (!password || password.length < 4) {
      throw createHttpError(400, '비밀번호는 4자 이상이어야 합니다.')
    }
    if (!name) {
      throw createHttpError(400, '이름을 입력해주세요.')
    }
    if (findUserByEmail(email)) {
      throw createHttpError(409, '이미 가입된 이메일입니다.')
    }

    const user = createUser({ email, password, name })

    sendJson(response, 201, {
      message: '회원가입이 완료되었습니다.',
      user: toPublicUser(user),
    })
    return true
  }

  // 2. 로그인: 이메일/비밀번호를 받고 토큰과 프로필을 응답한다.
  if (request.method === 'POST' && url.pathname === '/api/auth/login') {
    const body = await readJsonBody(request)
    const email = body.email?.trim().toLowerCase()
    const password = body.password

    if (!email || !password) {
      throw createHttpError(400, '이메일과 비밀번호를 입력해주세요.')
    }

    const user = findUserByEmail(email)
    if (!user || user.password !== password) {
      throw createHttpError(401, '이메일 또는 비밀번호가 올바르지 않습니다.')
    }

    const accessToken = createAccessToken(user)

    sendJson(response, 200, {
      message: '로그인에 성공했습니다.',
      tokenType: 'Bearer',
      accessToken,
      expiresIn: tokenTtlSeconds,
      user: toPublicUser(user),
    })
    return true
  }

  return false
}
