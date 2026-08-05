<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchUniqueAdvices } from '@/api/adviceApi'
import { generateRungs, traceAll } from '@/utils/ladder'

const MIN_PLAYERS = 2
const MAX_PLAYERS = 8
const PLAYER_COLORS = [
  '#f44336',
  '#2196f3',
  '#4caf50',
  '#ff9800',
  '#9c27b0',
  '#00bcd6',
  '#e91e63',
  '#795548',
]

// 세로줄 간격/가로줄 촘촘함/여백. rung 좌표(rungY)와 svg 크기 계산이 전부 이 값에서 파생된다.
const GEO = { colGap: 88, rowGap: 32, padX: 24, padY: 20 }

const names = ref(['플레이어1', '플레이어2', '플레이어3', '플레이어4'])
const isLoading = ref(false)
const errorMessage = ref('')
const usedFallback = ref(false)
const ladder = ref(null) // { rowCount, playerCount, traces }
const results = ref([]) // [{ name, advice, color, start, end }]

const canAddPlayer = computed(() => names.value.length < MAX_PLAYERS)
const canRemovePlayer = computed(() => names.value.length > MIN_PLAYERS)
const canPlay = computed(() => names.value.every((n) => n.trim()))

function addPlayer() {
  if (!canAddPlayer.value) return
  names.value.push(`플레이어${names.value.length + 1}`)
}

function removePlayer(index) {
  if (!canRemovePlayer.value) return
  names.value.splice(index, 1)
}

function rowCountFor(playerCount) {
  return Math.min(16, Math.max(8, playerCount * 3))
}

async function play() {
  if (!canPlay.value) {
    errorMessage.value = '참가자 이름을 모두 입력해주세요.'
    return
  }

  errorMessage.value = ''
  isLoading.value = true

  try {
    const trimmedNames = names.value.map((n) => n.trim())
    const playerCount = trimmedNames.length
    const rowCount = rowCountFor(playerCount)
    const rungs = generateRungs(playerCount, rowCount)
    const traces = traceAll(rungs, playerCount)
    const { advices, usedFallback: fellBack } = await fetchUniqueAdvices(playerCount)

    ladder.value = { rowCount, playerCount, rungs, traces }
    usedFallback.value = fellBack
    results.value = trimmedNames.map((name, i) => ({
      name,
      advice: advices[traces[i].end],
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      start: i,
      end: traces[i].end,
    }))

    if (fellBack) {
      ElMessage.warning('격언 API 응답이 부족해 일부는 준비된 격언으로 채웠습니다.')
    }
  } catch (error) {
    errorMessage.value = error.message || '사다리를 만드는 중 문제가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
}

function reset() {
  ladder.value = null
  results.value = []
  errorMessage.value = ''
}

function x(col) {
  return GEO.padX + col * GEO.colGap
}

function rungY(row) {
  return GEO.padY + row * GEO.rowGap + GEO.rowGap / 2
}

const svgWidth = computed(() => (ladder.value ? 2 * GEO.padX + (ladder.value.playerCount - 1) * GEO.colGap : 0))
const svgHeight = computed(() => (ladder.value ? 2 * GEO.padY + ladder.value.rowCount * GEO.rowGap : 0))
const topY = computed(() => GEO.padY)
const bottomY = computed(() => (ladder.value ? GEO.padY + ladder.value.rowCount * GEO.rowGap : 0))

function pathPoints(trace) {
  const points = [[x(trace.start), topY.value]]
  let col = trace.start
  trace.moves.forEach(({ row, toCol }) => {
    const y = rungY(row)
    points.push([x(col), y])
    col = toCol
    points.push([x(col), y])
  })
  points.push([x(col), bottomY.value])
  return points.map(([px, py]) => `${px},${py}`).join(' ')
}
</script>

<template>
  <div class="ladder-view">
    <header class="ladder-intro">
      <h2>사다리타기</h2>
      <p class="ladder-intro__note">참가자를 입력하고 사다리를 타면, 당첨자마다 오늘의 영어 격언이 하나씩 배정됩니다.</p>
    </header>

    <el-card shadow="never" class="ladder-form-card">
      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        show-icon
        :closable="false"
        class="form-alert"
      />

      <div class="players">
        <div v-for="(name, index) in names" :key="index" class="players__row">
          <span class="players__color" :style="{ background: PLAYER_COLORS[index % PLAYER_COLORS.length] }" />
          <el-input v-model="names[index]" :placeholder="`참가자 ${index + 1}`" maxlength="12" />
          <el-button
            circle
            text
            type="danger"
            :disabled="!canRemovePlayer"
            @click="removePlayer(index)"
          >
            <i class="fa-solid fa-xmark"></i>
          </el-button>
        </div>
      </div>

      <div class="players__actions">
        <el-button :disabled="!canAddPlayer" @click="addPlayer">
          <i class="fa-solid fa-plus"></i>
          <span>참가자 추가</span>
        </el-button>
        <span class="players__count">{{ names.length }} / {{ MAX_PLAYERS }}명</span>
      </div>

      <div class="ladder-form__actions">
        <el-button v-if="ladder" @click="reset">다시 만들기</el-button>
        <el-button type="primary" :loading="isLoading" @click="play">사다리 타기</el-button>
      </div>
    </el-card>

    <el-card v-if="ladder" shadow="never" class="ladder-board-card">
      <div class="ladder-board" :style="{ width: `${svgWidth}px` }">
        <svg :width="svgWidth" :height="svgHeight" :viewBox="`0 0 ${svgWidth} ${svgHeight}`">
          <line
            v-for="col in ladder.playerCount"
            :key="`v-${col}`"
            :x1="x(col - 1)"
            :y1="topY"
            :x2="x(col - 1)"
            :y2="bottomY"
            class="rung-base"
          />
          <template v-for="(row, r) in ladder.rungs" :key="`row-${r}`">
            <line
              v-for="(hasRung, c) in row"
              v-show="hasRung"
              :key="`h-${r}-${c}`"
              :x1="x(c)"
              :y1="rungY(r)"
              :x2="x(c + 1)"
              :y2="rungY(r)"
              class="rung-base"
            />
          </template>
          <polyline
            v-for="result in results"
            :key="`path-${result.start}`"
            :points="pathPoints(ladder.traces[result.start])"
            fill="none"
            :stroke="result.color"
            class="rung-path"
          />
          <text
            v-for="(result, i) in results"
            :key="`label-${i}`"
            :x="x(i)"
            :y="topY - 6"
            text-anchor="middle"
            :fill="result.color"
            class="rung-name"
          >
            {{ result.name }}
          </text>
        </svg>
      </div>
    </el-card>

    <div v-if="results.length" class="results">
      <el-card v-for="result in results" :key="result.name" shadow="hover" class="result-card">
        <div class="result-card__head">
          <span class="players__color" :style="{ background: result.color }" />
          <strong>{{ result.name }}</strong>
        </div>
        <blockquote class="result-card__quote">“{{ result.advice }}”</blockquote>
        <span class="result-card__tag">오늘의 영어 격언</span>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.ladder-view {
  max-width: 720px;
  margin: 32px auto;
  padding: 0 16px;
}

.ladder-intro {
  margin-bottom: 16px;
}

.ladder-intro h2 {
  margin: 0 0 6px;
  font-size: 20px;
  color: var(--color-text);
}

.ladder-intro__note {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--color-text-light);
}

.ladder-form-card {
  margin-bottom: 16px;
}

.form-alert {
  margin-bottom: 12px;
}

.players {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.players__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.players__color {
  flex: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.players__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.players__count {
  font-size: 12px;
  color: var(--color-text-light);
}

.ladder-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.ladder-board-card {
  margin-bottom: 16px;
  overflow-x: auto;
}

.ladder-board {
  margin: 0 auto;
}

.rung-base {
  stroke: var(--border-color-default);
  stroke-width: 2;
}

.rung-path {
  stroke-width: 3;
  opacity: 0.85;
}

.rung-name {
  font-size: 12px;
  font-weight: 700;
}

.results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.result-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--color-text);
}

.result-card__quote {
  margin: 0 0 8px;
  padding: 0;
  font-size: 13px;
  font-style: italic;
  color: var(--color-text-secondary);
  border: none;
}

.result-card__tag {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-primary-darker);
}
</style>
