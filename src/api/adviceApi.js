import axios from 'axios'

// api.adviceslip.com — 키 필요 없는 랜덤 영어 조언(격언) API. 로컬 mock 서버를 거치지 않는
// 순수 외부 API라 mockHttp가 아니라 별도 axios 인스턴스를 쓴다.
const adviceHttp = axios.create({
  baseURL: 'https://api.adviceslip.com',
  timeout: 6000,
})

// 네트워크가 아예 막힌 환경(오프라인 시연 등)에서도 게임이 죽지 않도록 두는 고정 폴백 목록.
const FALLBACK_ADVICES = [
  'Do what you can, with what you have, where you are.',
  'A smooth sea never made a skilled sailor.',
  'Well begun is half done.',
  'Fall seven times, stand up eight.',
  'The best time to plant a tree was 20 years ago. The second best time is now.',
  'Little by little, one travels far.',
  'Actions speak louder than words.',
  'Practice makes perfect.',
]

// CDN 캐싱이 공격적이라 같은 URL로 연달아 요청하면 같은 격언이 반복해서 오는 경우가 많다.
// 매 요청마다 무작위 쿼리 파라미터를 붙여 캐시를 우회한다.
async function fetchOne() {
  const res = await adviceHttp.get('/advice', { params: { _: `${Date.now()}-${Math.random()}` } })
  return res.data.slip
}

// count개의 서로 다른(id 중복 없는) 격언을 모은다. 실패하거나 목표치를 못 채우면 폴백 목록에서
// 부족한 만큼 채워서, API가 죽어도 사다리타기 자체는 항상 끝까지 진행되게 한다.
export async function fetchUniqueAdvices(count) {
  const collected = new Map()
  let attempts = 0

  while (collected.size < count && attempts < count * 4) {
    attempts += 1
    try {
      const slip = await fetchOne()
      collected.set(slip.id, slip.advice)
    } catch {
      break // 네트워크 자체가 막힌 상황으로 보고 바로 폴백으로 넘어간다
    }
  }

  const advices = [...collected.values()]
  const usedFallback = advices.length < count
  const shuffledFallback = [...FALLBACK_ADVICES].sort(() => Math.random() - 0.5)
  for (const fallback of shuffledFallback) {
    if (advices.length >= count) break
    if (!advices.includes(fallback)) advices.push(fallback)
  }

  return { advices: advices.slice(0, count), usedFallback }
}
