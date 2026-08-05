<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { journalApi } from '@/api/journalApi'
import MockApiStatusBanner from '@/components/MockApiStatusBanner.vue'

const weatherTags = ['맑음', '흐림', '비', '눈', '기타']
const tagColor = { 맑음: '#e6a23c', 흐림: '#909399', 비: '#409eff', 눈: '#79bbff', 기타: '#c0c4cc' }

const entries = ref([])
const isLoading = ref(false)
const activeTag = ref('전체')
const editingId = ref(null)
const errorMessage = ref('')

const emptyForm = () => ({ cityName: '', weatherTag: '맑음', content: '' })
const form = reactive(emptyForm())

const visibleEntries = computed(() => {
  if (activeTag.value === '전체') return entries.value
  return entries.value.filter((entry) => entry.weatherTag === activeTag.value)
})

function formatDate(iso) {
  return new Date(iso).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function load() {
  isLoading.value = true
  try {
    entries.value = await journalApi.getAll()
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    isLoading.value = false
  }
}

function resetForm() {
  editingId.value = null
  Object.assign(form, emptyForm())
  errorMessage.value = ''
}

function startEdit(entry) {
  editingId.value = entry.id
  Object.assign(form, {
    cityName: entry.cityName,
    weatherTag: entry.weatherTag,
    content: entry.content,
  })
  errorMessage.value = ''
}

async function submit() {
  if (!form.cityName.trim() || !form.content.trim()) {
    errorMessage.value = '관측 도시와 내용은 필수입니다.'
    return
  }

  try {
    if (editingId.value) {
      await journalApi.update(editingId.value, { ...form })
      ElMessage.success('일지가 수정되었습니다.')
    } else {
      await journalApi.create({ ...form })
      ElMessage.success('일지가 기록되었습니다.')
    }
    resetForm()
    await load()
  } catch (error) {
    errorMessage.value = error.message
  }
}

async function remove(entry) {
  try {
    await ElMessageBox.confirm(`"${entry.cityName}" 기록을 삭제할까요?`, '삭제 확인', {
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      type: 'warning',
    })
  } catch {
    return
  }

  try {
    await journalApi.remove(entry.id)
    if (editingId.value === entry.id) resetForm()
    ElMessage.success('삭제되었습니다.')
    await load()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

onMounted(load)
</script>

<template>
  <div class="journal-view">
    <header class="journal-intro">
      <h2>날씨 일지</h2>
      <MockApiStatusBanner />
      <p class="journal-intro__note">내가 다녀온 곳의 날씨를 기록해두는 개인 메모장.</p>
    </header>

    <el-card shadow="never" class="journal-form-card">
      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        show-icon
        :closable="false"
        class="form-alert"
      />
      <div class="journal-form">
        <el-input v-model="form.cityName" placeholder="다녀온 곳" class="field-city" />
        <el-select v-model="form.weatherTag" class="field-tag">
          <el-option v-for="tag in weatherTags" :key="tag" :label="tag" :value="tag" />
        </el-select>
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="2"
          placeholder="오늘 날씨는 어땠나요?"
          class="field-content"
        />
        <div class="journal-form__actions">
          <el-button v-if="editingId" @click="resetForm">취소</el-button>
          <el-button type="primary" @click="submit">{{ editingId ? '수정 완료' : '기록하기' }}</el-button>
        </div>
      </div>
    </el-card>

    <div class="journal-filter">
      <el-check-tag
        v-for="tag in ['전체', ...weatherTags]"
        :key="tag"
        :checked="activeTag === tag"
        @change="activeTag = tag"
      >
        {{ tag }}
      </el-check-tag>
    </div>

    <el-empty v-if="!isLoading && visibleEntries.length === 0" description="기록이 없습니다." />

    <el-timeline v-else v-loading="isLoading">
      <el-timeline-item
        v-for="entry in visibleEntries"
        :key="entry.id"
        :color="tagColor[entry.weatherTag]"
        :timestamp="formatDate(entry.createdAt)"
      >
        <div class="entry" :class="{ 'is-editing': editingId === entry.id }">
          <div class="entry__head">
            <strong>{{ entry.cityName }}</strong>
            <span class="entry__tag" :style="{ color: tagColor[entry.weatherTag] }">{{ entry.weatherTag }}</span>
          </div>
          <p class="entry__content">{{ entry.content }}</p>
          <div class="entry__actions">
            <el-button size="small" text @click="startEdit(entry)">수정</el-button>
            <el-button size="small" text type="danger" @click="remove(entry)">삭제</el-button>
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<style scoped>
.journal-view {
  max-width: 640px;
  margin: 32px auto;
  padding: 0 16px;
}

.journal-intro {
  margin-bottom: 16px;
}

.journal-intro h2 {
  margin: 0 0 6px;
  font-size: 20px;
  color: var(--color-text);
}

.journal-intro__note {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--color-text-light);
}

.journal-form-card {
  margin-bottom: 16px;
}

.journal-form {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 10px;
}

.field-content {
  grid-column: 1 / -1;
}

.journal-form__actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.form-alert {
  margin-bottom: 12px;
}

.journal-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 20px;
}

.entry {
  padding: 10px 14px;
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-medium);
  background: var(--color-card-background);
}

.entry.is-editing {
  border-color: var(--color-primary-darker);
}

.entry__head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.entry__tag {
  font-weight: 700;
}

.entry__content {
  margin: 6px 0 4px;
  font-size: 13px;
  color: var(--color-text);
}

.entry__actions {
  display: flex;
  gap: 4px;
}

@media (max-width: 560px) {
  .journal-form {
    grid-template-columns: 1fr;
  }
}
</style>
