import { getWeatherInfo } from './openMeteoCode'
import { fetchWithTimeout } from './fetchWithTimeout'

async function fetchFromOpenMeteo(cities) {
  const latitude = cities.map((city) => city.lat).join(',')
  const longitude = cities.map((city) => city.lon).join(',')
  const fields =
    'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weathercode'
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=${fields}&timezone=Asia%2FSeoul`

  const response = await fetchWithTimeout(url)
  if (!response.ok) {
    const error = new Error('날씨 데이터를 불러오지 못했습니다.')
    error.status = response.status
    throw error
  }

  const data = await response.json()
  // Open-Meteo는 좌표가 1개일 때는 단일 객체를, 2개 이상일 때는 배열을 반환한다.
  const results = Array.isArray(data) ? data : [data]

  return cities.map((city, index) => {
    const current = results[index]?.current
    const { status, icon } = getWeatherInfo(current?.weathercode)
    return {
      id: city.id,
      name: city.name,
      lat: city.lat,
      lon: city.lon,
      temp: Math.round(current?.temperature_2m ?? 0),
      feelsLike: Math.round(current?.apparent_temperature ?? 0),
      humidity: Math.round(current?.relative_humidity_2m ?? 0),
      windSpeed: Math.round(((current?.wind_speed_10m ?? 0) / 3.6) * 10) / 10,
      status,
      icon,
    }
  })
}

// Open-Meteo가 실패해도(네트워크 차단, 요청 한도 초과 등) 시연이 끊기지 않게 쓰는 고정 데모 데이터.
// mockReason은 화면 상단에 "왜 데모 데이터인지" 보여주는 용도.
function createFallbackWeather(city, mockReason) {
  return {
    id: city.id,
    name: city.name,
    lat: city.lat,
    lon: city.lon,
    temp: 20,
    feelsLike: 19,
    humidity: 55,
    windSpeed: 2.1,
    status: '맑음',
    icon: 'fa-solid fa-sun',
    mocked: true,
    mockReason,
  }
}

function describeFetchError(error) {
  if (error?.status === 429) return 'Open-Meteo 요청 한도 초과(Too Many Requests)'
  return 'Open-Meteo 연결 실패'
}

// cities: [{ id, name, lat, lon }] -> 현재 날씨를 도시별로 조회해 매핑.
export async function fetchWeatherForCities(cities) {
  try {
    return await fetchFromOpenMeteo(cities)
  } catch (error) {
    const reason = describeFetchError(error)
    return cities.map((city) => createFallbackWeather(city, reason))
  }
}

// fetchWeatherForCities가 던진 에러를 화면에 보여줄 문구로 변환한다.
export function getWeatherErrorMessage(error) {
  if (error?.status === 429) {
    return '요청이 너무 많습니다 (429 Too Many Requests). 잠시 후 다시 시도해 주세요.'
  }
  return '날씨 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
}
