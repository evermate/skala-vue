<script setup>
import { ref } from 'vue'

const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음' },
  { id: 'city_02', name: '수원', temp: 24, status: '비' },
  { id: 'city_03', name: '부산', temp: 26, status: '구름' },
])

const searchText = ref('')
const selectedMessage = ref('')

function onSearchInput(e) {
  searchText.value = e.target.value
}

function selectCity(name) {
  selectedMessage.value = `${name}이 선택되었습니다.`
}

function showDetail(cityName, status) {
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.`)
}
</script>

<template>
  <div>
    <h2>과제 1: 날씨 (Mockup)</h2>

    <section>
      <h3>도시 검색</h3>
      <input
        type="text"
        placeholder="검색할 도시 이름 입력"
        :value="searchText"
        @input="onSearchInput"
      />
      <p>검색 중인 도시: {{ searchText }}</p>
    </section>

    <section>
      <h3>지역별 날씨 현황</h3>
      <ul>
        <li v-for="item in weatherList" :key="item.id" @click="selectCity(item.name)">
          <p>{{ item.name }} ({{ item.status }})</p>
          <p>현재 기온: {{ item.temp }}°C</p>
          <span v-if="item.temp >= 25">더움 (25도 이상)</span>
          <span v-else>선선함 (25도 미만)</span>
          <button @click.stop="showDetail(item.name, item.status)">상세보기</button>
        </li>
      </ul>
    </section>

    <p>{{ selectedMessage }}</p>
  </div>
</template>

<style scoped></style>
