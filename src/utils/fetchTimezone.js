import { fetchWithTimeout } from './fetchWithTimeout'

// Open-Meteo에 timezone=auto로 물어보면 이 좌표의 IANA 타임존을 키 없이 알려준다.
// 메인 날씨 호출(fetchWeather.js)은 모든 도시를 timezone=Asia/Seoul로 고정해서 요청하므로
// (예보 날짜 그룹핑을 국내 기준으로 일관되게 맞추려는 것) 그 응답엔 도시별 실제 타임존이
// 안 들어있다 — 현지 시각 표시용으로 여기서 좌표만으로 따로 조회한다.
export async function fetchTimezone({ lat, lon }) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=auto`

  try {
    const response = await fetchWithTimeout(url)
    if (!response.ok) return null
    const data = await response.json()
    return data.timezone ?? null
  } catch {
    return null
  }
}
