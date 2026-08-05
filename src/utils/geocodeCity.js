import { fetchWithTimeout } from './fetchWithTimeout'

// Open-Meteo Geocoding API. 키가 필요 없고, forecast/air-quality용 api.open-meteo.com과는
// 다른 호스트라 weatherApi(axios) 대신 fetchWithTimeout으로 직접 호출한다.
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'

// 한글 도시명은 행정구역 접미사가 붙어야 정확히 매칭되는 경우가 많다. 예를 들어 "진주"만
// 검색하면 실제 진주시(인구 30만)가 아니라 전혀 다른 동명 소부락이 잡히고, "진주시"라고
// 붙여야 제대로 잡힌다(인천/대전/수원/창원/안동 등도 동일). 사용자가 접미사 없이
// 입력해도 흔한 접미사들을 붙인 쿼리를 같이 병렬로 날려서 보완한다.
const KOREAN_ADMIN_SUFFIXES = ['시', '군', '구', '특별시', '광역시', '특별자치시']
const HANGUL_RE = /[가-힣]/

// GeoNames feature_code. PPLC/PPLA~PPLA5는 행정구역 소재지인데 population 없는
// 경우 있음(여수 등) — population만으론 못 거름, 이 코드도 같이 봐야 함.
const ADMIN_FEATURE_CODES = new Set(['PPLC', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPLA5'])

function isSignificantPlace(item) {
  return item.population != null || ADMIN_FEATURE_CODES.has(item.feature_code)
}

// 접미사 추측 쿼리 때문에 이름이 "진주시"/"인천광역시"처럼 붙어서 나오는데, koreaCities.js
// 고정 목록은 죄다 "서울"/"부산"처럼 접미사 없는 이름이라 국내 결과만 떼서 맞춘다.
// 긴 접미사(특별자치시 등)부터 검사해야 "시"만 잘못 떼어내는 실수를 막을 수 있다.
const SUFFIXES_BY_LENGTH_DESC = [...KOREAN_ADMIN_SUFFIXES].sort((a, b) => b.length - a.length)

function stripAdminSuffix(name) {
  const suffix = SUFFIXES_BY_LENGTH_DESC.find(
    (candidate) => name.endsWith(candidate) && name.length > candidate.length,
  )
  return suffix ? name.slice(0, -suffix.length) : name
}

async function fetchRaw(name) {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(name)}&count=10&language=ko&format=json`
  const response = await fetchWithTimeout(url)
  if (!response.ok) {
    const error = new Error('위치 검색에 실패했습니다.')
    error.status = response.status
    throw error
  }
  const data = await response.json()
  return data.results ?? []
}

// name -> [{ name, lat, lon, country, countryCode, admin1 }]. 매칭 결과 없으면 빈 배열.
// population이 있는(=행정구역으로 인식된) 결과를 우선으로 정렬해서, 동명 소부락보다
// 실제 도시가 먼저 보이게 한다.
export async function geocodeCity(name) {
  const query = name.trim()
  if (!query) return []

  const needsSuffixGuess =
    HANGUL_RE.test(query) && !KOREAN_ADMIN_SUFFIXES.some((suffix) => query.endsWith(suffix))
  const suffixQueries = needsSuffixGuess
    ? KOREAN_ADMIN_SUFFIXES.map((suffix) => `${query}${suffix}`)
    : []

  // 원본 쿼리는 실패를 그대로 전파한다(네트워크 에러 등은 상위에서 안내 문구로 처리).
  // 접미사 추측 쿼리들은 어디까지나 보완용이라 실패해도 무시하고 빈 배열로 취급한다.
  const [primaryResults, ...suffixResultLists] = await Promise.all([
    fetchRaw(query),
    ...suffixQueries.map((q) => fetchRaw(q).catch(() => [])),
  ])

  const byId = new Map()
  ;[...primaryResults, ...suffixResultLists.flat()].forEach((item) => {
    if (!byId.has(item.id)) byId.set(item.id, item)
  })

  const merged = Array.from(byId.values())
  // 행정적으로 유의미한 후보가 하나라도 있으면 이름만 같은 동네(예: 밀양 옆에 딸려나오는
  // 북한 동명 마을)는 목록에서 아예 뺀다. 전부 유의미하지 않은 경우(정말 작은 동네만
  // 검색된 경우)엔 아무것도 안 남는 것보단 나으니 원래 후보를 그대로 둔다.
  const significant = merged.filter(isSignificantPlace)
  const candidates = significant.length > 0 ? significant : merged

  return candidates
    .sort((a, b) => (b.population ?? -1) - (a.population ?? -1))
    .slice(0, 10)
    .map((item) => ({
      name: item.country_code === 'KR' ? stripAdminSuffix(item.name) : item.name,
      lat: item.latitude,
      lon: item.longitude,
      country: item.country ?? '',
      countryCode: item.country_code ?? '',
      admin1: item.admin1 ?? '',
    }))
}
