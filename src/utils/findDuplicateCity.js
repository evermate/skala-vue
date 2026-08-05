import { KOREA_CITIES } from './koreaCities'
import { WORLD_CITIES } from './worldCities'

const NEARBY_THRESHOLD_KM = 5

function normalizeName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '')
}

// 두 좌표 사이 거리(km, Haversine). 지오코딩 응답 좌표와 고정 목록 좌표는 소수점
// 정밀도가 달라서 단순 반올림 비교만으론 같은 도시를 다르게 볼 수 있어 보조 기준으로 쓴다.
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function isSameCity(a, b) {
  if (normalizeName(a.name) === normalizeName(b.name)) return true
  return distanceKm(a.lat, a.lon, b.lat, b.lon) <= NEARBY_THRESHOLD_KM
}

// candidate: { name, lat, lon }. 고정 목록(국내/해외 둘 다) + 이미 추가된 커스텀 도시를
// 통틀어 검색해서, 실제로 매칭된 도시가 속한 region을 함께 돌려준다. 후보 자체의
// country_code 분류와 매칭된 기존 도시의 region이 다를 수 있어(교차 지역 중복) 구분해야 한다.
export function findDuplicateCity(candidate, customCities) {
  const domesticMatch = KOREA_CITIES.find((city) => isSameCity(city, candidate))
  if (domesticMatch) return { ...domesticMatch, region: 'domestic', source: 'fixed' }

  const internationalMatch = WORLD_CITIES.find((city) => isSameCity(city, candidate))
  if (internationalMatch) return { ...internationalMatch, region: 'international', source: 'fixed' }

  const customMatch = customCities.find((city) => isSameCity(city, candidate))
  if (customMatch) return { ...customMatch, source: 'custom' }

  return null
}
