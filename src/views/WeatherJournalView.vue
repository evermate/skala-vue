<script setup>
import { onMounted, reactive, ref } from 'vue'
import { journalApi } from '@/api/journalApi'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import MockApiStatusBanner from '@/components/MockApiStatusBanner.vue'

const weatherTags = ['맑음', '흐림', '비', '눈', '기타']

const entries = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const editingId = ref(null)

const emptyForm = () => ({ cityName: '', weatherTag: '맑음', content: '', author: '' })
const form = reactive(emptyForm())

async function load() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    entries.value = await journalApi.getAll()
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
}

function resetForm() {
  editingId.value = null
  Object.assign(form, emptyForm())
}

function startEdit(entry) {
  editingId.value = entry.id
  Object.assign(form, {
    cityName: entry.cityName,
    weatherTag: entry.weatherTag,
    content: entry.content,
    author: entry.author,
  })
}

async function submit() {
  if (!form.cityName.trim() || !form.content.trim()) return
  try {
    if (editingId.value) {
      await journalApi.update(editingId.value, { ...form })
    } else {
      await journalApi.create({ ...form })
    }
    resetForm()
    await load()
  } catch (error) {
    errorMessage.value = error.message
  }
}

async function remove(id) {
  try {
    await journalApi.remove(id)
    await load()
  } catch (error) {
    errorMessage.value = error.message
  }
}

onMounted(load)
</script>

<template>
  <div class="journal-view">
    <BaseDashboardCard icon="fa-solid fa-book" title="날씨 일지">
      <MockApiStatusBanner />

      <form class="journal-form" @submit.prevent="submit">
        <div class="journal-form__row">
          <input v-model="form.cityName" type="text" placeholder="관측 도시" required />
          <select v-model="form.weatherTag">
            <option v-for="tag in weatherTags" :key="tag" :value="tag">{{ tag }}</option>
          </select>
        </div>
        <textarea v-model="form.content" placeholder="오늘 날씨는 어땠나요?" rows="3" required />
        <div class="journal-form__row">
          <input v-model="form.author" type="text" placeholder="작성자 (선택)" />
          <button type="submit">{{ editingId ? '수정' : '등록' }}</button>
          <button v-if="editingId" type="button" class="journal-form__cancel" @click="resetForm">
            취소
          </button>
        </div>
      </form>

      <p v-if="isLoading" class="journal-empty">불러오는 중...</p>
      <p v-else-if="errorMessage" class="journal-error">{{ errorMessage }}</p>
      <p v-else-if="entries.length === 0" class="journal-empty">아직 일지가 없습니다.</p>

      <ul v-else class="journal-list">
        <li v-for="entry in entries" :key="entry.id" class="journal-item">
          <div class="journal-item__head">
            <strong>{{ entry.cityName }}</strong>
            <span class="journal-item__tag">{{ entry.weatherTag }}</span>
            <span class="journal-item__author">{{ entry.author }}</span>
          </div>
          <p class="journal-item__content">{{ entry.content }}</p>
          <div class="journal-item__actions">
            <button type="button" @click="startEdit(entry)">수정</button>
            <button type="button" @click="remove(entry.id)">삭제</button>
          </div>
        </li>
      </ul>
    </BaseDashboardCard>
  </div>
</template>

<style scoped>
.journal-view {
  max-width: 640px;
  margin: 32px auto;
  padding: 0 16px;
}

.journal-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.journal-form__row {
  display: flex;
  gap: 8px;
}

.journal-form input,
.journal-form select,
.journal-form textarea {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-medium);
  background: var(--color-card-background);
  color: var(--color-text);
  font-size: 13px;
  font-family: inherit;
}

.journal-form button {
  padding: 8px 14px;
  border: none;
  border-radius: var(--border-radius-medium);
  background: var(--color-primary-darker);
  color: #ffffff;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}

.journal-form__cancel {
  background: var(--color-card-background);
  color: var(--color-text-secondary);
  border: 1px solid var(--border-color-default) !important;
}

.journal-empty,
.journal-error {
  font-size: 13px;
  color: var(--color-text-light);
  text-align: center;
}

.journal-error {
  color: var(--color-error);
}

.journal-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.journal-item {
  padding: 12px 14px;
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-medium);
  background: var(--color-card-background);
}

.journal-item__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 13px;
}

.journal-item__tag {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-primary-opacity-10);
  font-size: 11px;
  font-weight: 700;
}

.journal-item__author {
  margin-left: auto;
  color: var(--color-text-light);
  font-size: 12px;
}

.journal-item__content {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--color-text);
}

.journal-item__actions {
  display: flex;
  gap: 8px;
}

.journal-item__actions button {
  padding: 4px 10px;
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-small);
  background: var(--color-card-background);
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
}
</style>
