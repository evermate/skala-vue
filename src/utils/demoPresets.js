// fetchWeather.js와 fetchWeatherExtras.js가 공통으로 쓰는 데모 폴백 재료.
// 같은 도시는 항상 같은 프리셋을 골라야(재조회해도 값이 안 튀어야) 해서 해시 기반으로 고른다.
export const DEMO_WEATHER_PRESETS = [
  { status: '맑음', icon: 'fa-solid fa-sun', tempOffset: 3 },
  { status: '구름조금', icon: 'fa-solid fa-cloud-sun', tempOffset: 1 },
  { status: '흐림', icon: 'fa-solid fa-cloud', tempOffset: -2 },
  { status: '비', icon: 'fa-solid fa-cloud-showers-heavy', tempOffset: -4 },
]

export function hashString(value) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) % 997
  return hash
}

// 25도를 기준으로 흩어지게 해서(WeatherCard의 warm/cool 25도 기준선) 데모 카드도 파랑/빨강이
// 섞여 보이게 한다. 위도는 그 기준선 주변에서 소폭만 흔든다.
export function baseFallbackTemp(lat) {
  return 25 + (36 - Math.abs(lat ?? 36)) * 0.3
}
