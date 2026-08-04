import { getWeatherInfo } from './weatherCode'

// cities: [{ id, name, lat, lon }] -> Open-Meteo 현재 날씨를 조회해 도시별 정보로 매핑
export async function fetchWeatherForCities(cities) {
  const latitude = cities.map((city) => city.lat).join(',')
  const longitude = cities.map((city) => city.lon).join(',')
  const fields =
    'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weathercode'
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=${fields}&timezone=Asia%2FSeoul`

  const response = await fetch(url)
  if (!response.ok) throw new Error('날씨 데이터를 불러오지 못했습니다.')

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
      windSpeed: current?.wind_speed_10m ?? 0,
      status,
      icon,
    }
  })
}
