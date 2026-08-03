<script setup>
import { ref, computed, watch, watchEffect } from 'vue'

const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음' },
  { id: 'city_02', name: '수원', temp: 24, status: '비' },
  { id: 'city_03', name: '부산', temp: 26, status: '구름' },
])

const searchQuery = ref('')
const selectedCityInfo = ref('')

const filteredWeatherList = computed(() =>
  weatherList.value.filter((item) => item.name.includes(searchQuery.value)),
)

function onSearchInput(e) {
  searchQuery.value = e.target.value
}

function selectCity(name) {
  selectedCityInfo.value = `${name}이 선택되었습니다.`
}

function showDetail(cityName, status) {
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.`)
}

watch(selectedCityInfo, (newValue) => {
  console.log('[watch 감지] 상태바 문구가 업데이트되었습니다 ->', newValue)
})

watchEffect(() => {
  console.log('[watchEffect 자동 호출] 현재 검색어:', searchQuery.value)
})
</script>

<template>
  <div>
    <h2>과제 2: 날씨 (컴포지션)</h2>

    <section>
      <h3>도시 검색</h3>
      <input
        type="text"
        placeholder="검색할 도시 이름 입력"
        :value="searchQuery"
        @input="onSearchInput"
      />
      <p>검색 중인 도시: {{ searchQuery }}</p>
    </section>

    <section>
      <h3>지역별 날씨 현황</h3>
      <ul v-if="filteredWeatherList.length > 0">
        <li v-for="item in filteredWeatherList" :key="item.id" @click="selectCity(item.name)">
          <p>{{ item.name }} ({{ item.status }})</p>
          <p>현재 기온: {{ item.temp }}°C</p>
          <span v-if="item.temp >= 25">더움 (25도 이상)</span>
          <span v-else>선선함 (25도 미만)</span>
          <button @click.stop="showDetail(item.name, item.status)">상세보기</button>
        </li>
      </ul>
      <p v-else>검색 결과가 일치하는 도시가 없습니다.</p>
    </section>

    <p>{{ selectedCityInfo }}</p>
  </div>
</template>

<style scoped></style>
