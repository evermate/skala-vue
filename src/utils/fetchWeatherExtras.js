import { weatherApi } from './axiosClient'
import { getWeatherInfo as getOpenWeatherStatus } from './openWeatherCode'
import { getWeatherInfo as getOpenMeteoStatus } from './openMeteoCode'
import { fetchWithTimeout } from './fetchWithTimeout'
import { DEMO_WEATHER_PRESETS, hashString, baseFallbackTemp } from './demoPresets'

// 상세 페이지 전용 확장 데이터(미세먼지, 5일 예보). 도시 목록 화면에는 안 붙이고
// 상세 페이지에서 도시 1개 단위로만 호출해서 호출량 급증을 피한다.
// (notes/weather-api-roadmap.md 참고)

function classifyOpenWeatherAqi(aqi) {
  if (aqi <= 1) return '좋음'
  if (aqi === 2) return '보통'
  if (aqi === 3) return '나쁨'
  return '매우 나쁨'
}

function classifyUsAqi(usAqi) {
  if (usAqi <= 50) return '좋음'
  if (usAqi <= 100) return '보통'
  if (usAqi <= 200) return '나쁨'
  return '매우 나쁨'
}

async function fetchAirQualityFromOpenWeather({ lat, lon }) {
  const response = await weatherApi.get('/air_pollution', { params: { lat, lon } })
  const entry = response.data.list?.[0]
  return {
    level: classifyOpenWeatherAqi(entry?.main?.aqi ?? 0),
    pm10: Math.round(entry?.components?.pm10 ?? 0),
    pm2_5: Math.round(entry?.components?.pm2_5 ?? 0),
  }
}

async function fetchAirQualityFromOpenMeteo({ lat, lon }) {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,us_aqi`
  const response = await fetchWithTimeout(url)
  if (!response.ok) {
    const error = new Error('미세먼지 정보를 불러오지 못했습니다.')
    error.status = response.status
    throw error
  }
  const data = await response.json()
  return {
    level: classifyUsAqi(data.current?.us_aqi ?? 0),
    pm10: Math.round(data.current?.pm10 ?? 0),
    pm2_5: Math.round(data.current?.pm2_5 ?? 0),
  }
}

const AQI_LEVELS = ['좋음', '보통', '나쁨']

// 메인 날씨(fetchWeather.js)와 동일하게, 둘 다 실패해도 빈 상태 대신 데모 값으로 채운다.
function createFallbackAirQuality(city, mockReason) {
  const seed = hashString(city.id)
  return {
    level: AQI_LEVELS[seed % AQI_LEVELS.length],
    pm10: 20 + (seed % 40),
    pm2_5: 10 + (hashString(city.name) % 25),
    mocked: true,
    mockReason,
  }
}

function describeExtrasFetchError(error) {
  if (error?.status === 429) return '요청 한도 초과(Too Many Requests)'
  return 'API 연결 실패'
}

export async function fetchAirQuality(city) {
  const hasApiKey = Boolean(import.meta.env.VITE_OPENWEATHER_API_KEY)

  if (hasApiKey) {
    try {
      return await fetchAirQualityFromOpenWeather(city)
    } catch {
      // 아래 Open-Meteo 폴백으로 이어진다.
    }
  }

  try {
    return await fetchAirQualityFromOpenMeteo(city)
  } catch (error) {
    return createFallbackAirQuality(city, describeExtrasFetchError(error))
  }
}

// 3시간 간격 40개 항목을 날짜별로 묶어 일별 최고/최저·대표 날씨로 정리한다.
function groupOwmForecastByDay(list) {
  const byDate = new Map()

  list.forEach((entry) => {
    const date = entry.dt_txt.slice(0, 10)
    if (!byDate.has(date)) byDate.set(date, [])
    byDate.get(date).push(entry)
  })

  return Array.from(byDate.entries())
    .slice(0, 5)
    .map(([date, entries]) => {
      const temps = entries.map((e) => e.main.temp)
      // 정오에 가장 가까운 항목을 그 날의 대표 날씨로 쓴다.
      const noonEntry = entries.reduce((closest, e) => {
        const hour = Number(e.dt_txt.slice(11, 13))
        const closestHour = Number(closest.dt_txt.slice(11, 13))
        return Math.abs(hour - 12) < Math.abs(closestHour - 12) ? e : closest
      })
      const { status, icon } = getOpenWeatherStatus(noonEntry.weather?.[0]?.id)
      return {
        date,
        tempMax: Math.round(Math.max(...temps)),
        tempMin: Math.round(Math.min(...temps)),
        status,
        icon,
      }
    })
}

async function fetchForecastFromOpenWeather({ lat, lon }) {
  const response = await weatherApi.get('/forecast', { params: { lat, lon } })
  return groupOwmForecastByDay(response.data.list ?? [])
}

async function fetchForecastFromOpenMeteo({ lat, lon }) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FSeoul&forecast_days=5`
  const response = await fetchWithTimeout(url)
  if (!response.ok) {
    const error = new Error('예보 정보를 불러오지 못했습니다.')
    error.status = response.status
    throw error
  }
  const data = await response.json()
  const {
    time = [],
    weathercode = [],
    temperature_2m_max = [],
    temperature_2m_min = [],
  } = data.daily ?? {}

  return time.map((date, index) => {
    const { status, icon } = getOpenMeteoStatus(weathercode[index])
    return {
      date,
      tempMax: Math.round(temperature_2m_max[index] ?? 0),
      tempMin: Math.round(temperature_2m_min[index] ?? 0),
      status,
      icon,
    }
  })
}

function localDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 메인 날씨(fetchWeather.js)와 같은 프리셋으로, 오늘부터 5일치 데모 예보를 만든다.
function createFallbackForecast(city, mockReason) {
  const seed = hashString(city.id)
  const baseTemp = baseFallbackTemp(city.lat)

  const days = Array.from({ length: 5 }, (_, i) => {
    const preset = DEMO_WEATHER_PRESETS[(seed + i) % DEMO_WEATHER_PRESETS.length]
    const date = new Date()
    date.setDate(date.getDate() + i)
    return {
      date: localDateString(date),
      tempMax: Math.round(baseTemp + preset.tempOffset + 2),
      tempMin: Math.round(baseTemp + preset.tempOffset - 4),
      status: preset.status,
      icon: preset.icon,
    }
  })

  return { days, mocked: true, mockReason }
}

export async function fetchForecast(city) {
  const hasApiKey = Boolean(import.meta.env.VITE_OPENWEATHER_API_KEY)

  if (hasApiKey) {
    try {
      return { days: await fetchForecastFromOpenWeather(city), mocked: false }
    } catch {
      // 아래 Open-Meteo 폴백으로 이어진다.
    }
  }

  try {
    return { days: await fetchForecastFromOpenMeteo(city), mocked: false }
  } catch (error) {
    return createFallbackForecast(city, describeExtrasFetchError(error))
  }
}

// 좌표 -> 지명. BigDataCloud는 키가 필요 없어서 OWM 키 유무와 상관없이 이거 하나로 통일한다.
// 현재 위치 버튼처럼 임의 좌표를 다루는 곳에서만 쓰고, 미리 정해둔 도시 목록에는 필요 없다.
export async function reverseGeocode({ lat, lon }) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ko`
  const response = await fetchWithTimeout(url)
  if (!response.ok) throw new Error('위치 이름을 불러오지 못했습니다.')
  const data = await response.json()
  return data.locality || data.city || data.principalSubdivision || '알 수 없는 위치'
}
