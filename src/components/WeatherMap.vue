<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { convertTemp } from '@/utils/temperature'
import { useDisplayTemp } from '@/composables/useDisplayTemp'

// Vite로 번들링하면 Leaflet 기본 마커 이미지 경로가 깨져서 직접 재지정한다.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const props = defineProps({
  cities: {
    type: Array,
    default: () => [],
  },
  // 지도 확대/축소 범위 계산 전용 — 검색으로 걸러지지 않은 해당 지역 전체 도시 목록.
  // cities는 필터링될 때마다 바뀌므로, 그걸로 fitBounds를 하면 검색할 때마다 지도가
  // 확 확대/축소된다. 마커 표시(cities)와 지도 범위(allCities)를 분리해서 이를 막는다.
  allCities: {
    type: Array,
    default: () => [],
  },
  focusedCityId: {
    type: String,
    default: null,
  },
  region: {
    type: String,
    default: 'domestic',
  },
})

const emit = defineEmits(['select-city'])

const { unit, unitSymbol } = useDisplayTemp()

const mapContainer = ref(null)
let map = null
const markers = new Map()
// 전체 도시가 한눈에 보이는 기준 줌. 카드 클릭 시 이 값을 기준으로 상대적으로만 확대한다.
let baseZoom = 6

function drawMarkers() {
  if (!map) return

  markers.forEach((marker) => marker.remove())
  markers.clear()

  props.cities.forEach((city) => {
    if (city.lat == null || city.lon == null) return
    const marker = L.marker([city.lat, city.lon]).addTo(map)
    const temp = convertTemp(city.temp, unit.value)
    marker.bindPopup(
      `<strong>${city.name}</strong><br />${city.status} · ${temp}${unitSymbol.value}`,
    )
    marker.on('click', () => emit('select-city', city.id))
    markers.set(city.id, marker)
  })
}

function fitToBounds() {
  if (!map || props.allCities.length === 0) return

  const bounds = L.latLngBounds(props.allCities.map((city) => [city.lat, city.lon]))
  const padding = [30, 30]
  baseZoom = map.getBoundsZoom(bounds, false, padding)
  // 국내는 도시들이 다 보이는 줌보다 더 축소하지 못하게 막고, 해외는 지구 전체를 볼 수 있게 자유롭게 둔다.
  map.setMinZoom(props.region === 'domestic' ? baseZoom : 1)
  map.fitBounds(bounds, { padding })
}

onMounted(() => {
  map = L.map(mapContainer.value, { scrollWheelZoom: false }).setView([36.5, 127.8], 6)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map)
  drawMarkers()
  fitToBounds()
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
})

// 검색/필터로 cities가 바뀌어도 마커만 다시 그리고, 지도 확대/축소는 건드리지 않는다.
watch(() => props.cities, drawMarkers)
watch(unit, drawMarkers)
// allCities는 지역(region) 전환이나 최초 로딩 때만 바뀌므로, 이때만 지도 범위를 다시 맞춘다.
watch(() => props.allCities, fitToBounds)

watch(
  () => props.focusedCityId,
  (cityId) => {
    if (!map || !cityId) return
    const marker = markers.get(cityId)
    if (!marker) return
    // 국내는 기준 줌 대비 살짝만 확대하고, 해외는 도시 간 거리가 워낙 멀어서 추가 확대 없이 이동만 한다.
    const targetZoom = props.region === 'domestic' ? Math.min(baseZoom + 2, 10) : baseZoom
    map.flyTo(marker.getLatLng(), targetZoom, { duration: 0.8 })
    marker.openPopup()
  },
)
</script>

<template>
  <div ref="mapContainer" class="weather-map"></div>
</template>

<style scoped>
.weather-map {
  width: 100%;
  min-height: 360px;
  height: 100%;
  border-radius: var(--border-radius-medium);
  overflow: hidden;
}
</style>
