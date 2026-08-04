import axios from 'axios'
import { weatherApi } from './axiosClient'
import { getWeatherInfo } from './openWeatherCode'

// cities: [{ id, name, lat, lon }] -> OpenWeatherMap 현재 날씨를 도시별로 조회해 매핑
// OpenWeatherMap Current Weather API는 Open-Meteo와 달리 좌표를 한 번에 묶어 조회할 수 없어서
// 도시마다 개별 요청을 axios.all로 병렬 실행한다.
export async function fetchWeatherForCities(cities) {
  const requests = cities.map((city) =>
    weatherApi.get('/weather', { params: { lat: city.lat, lon: city.lon } }),
  )
  const responses = await axios.all(requests)

  return responses.map((response, index) => {
    const city = cities[index]
    const data = response.data
    const { status, icon } = getWeatherInfo(data.weather?.[0]?.id)
    return {
      id: city.id,
      name: city.name,
      lat: city.lat,
      lon: city.lon,
      temp: Math.round(data.main?.temp ?? 0),
      feelsLike: Math.round(data.main?.feels_like ?? 0),
      humidity: Math.round(data.main?.humidity ?? 0),
      windSpeed: data.wind?.speed ?? 0,
      status,
      icon,
    }
  })
}
