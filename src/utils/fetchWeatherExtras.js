import { getWeatherInfo } from './openMeteoCode'
import { fetchWithTimeout } from './fetchWithTimeout'

// 상세 페이지 전용 확장 데이터(미세먼지, 5일 예보). 도시 목록 화면에는 안 붙이고
// 상세 페이지에서 도시 1개 단위로만 호출해서 호출량 급증을 피한다.

function classifyUsAqi(usAqi) {
  if (usAqi <= 50) return '좋음'
  if (usAqi <= 100) return '보통'
  if (usAqi <= 200) return '나쁨'
  return '매우 나쁨'
}

export async function fetchAirQuality({ lat, lon }) {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,us_aqi`
  const response = await fetchWithTimeout(url)
  if (!response.ok) throw new Error('미세먼지 정보를 불러오지 못했습니다.')
  const data = await response.json()
  return {
    level: classifyUsAqi(data.current?.us_aqi ?? 0),
    pm10: Math.round(data.current?.pm10 ?? 0),
    pm2_5: Math.round(data.current?.pm2_5 ?? 0),
  }
}

export async function fetchForecast({ lat, lon }) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FSeoul&forecast_days=5`
  const response = await fetchWithTimeout(url)
  if (!response.ok) throw new Error('예보 정보를 불러오지 못했습니다.')
  const data = await response.json()
  const {
    time = [],
    weathercode = [],
    temperature_2m_max = [],
    temperature_2m_min = [],
  } = data.daily ?? {}

  return time.map((date, index) => {
    const { status, icon } = getWeatherInfo(weathercode[index])
    return {
      date,
      tempMax: Math.round(temperature_2m_max[index] ?? 0),
      tempMin: Math.round(temperature_2m_min[index] ?? 0),
      status,
      icon,
    }
  })
}

// 좌표 -> 지명. BigDataCloud는 키가 필요 없음(현재 위치 버튼처럼 임의 좌표를 다루는 곳 전용).
export async function reverseGeocode({ lat, lon }) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ko`
  const response = await fetchWithTimeout(url)
  if (!response.ok) throw new Error('위치 이름을 불러오지 못했습니다.')
  const data = await response.json()
  return data.locality || data.city || data.principalSubdivision || '알 수 없는 위치'
}
