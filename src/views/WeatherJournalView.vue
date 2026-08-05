<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { journalApi } from '@/api/journalApi'
import MockApiStatusBanner from '@/components/MockApiStatusBanner.vue'
import JournalEntryForm from '@/components/journal/JournalEntryForm.vue'
import JournalEntryItem from '@/components/journal/JournalEntryItem.vue'

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

    <JournalEntryForm
      v-model:city-name="form.cityName"
      v-model:weather-tag="form.weatherTag"
      v-model:content="form.content"
      :weather-tags="weatherTags"
      :is-editing="Boolean(editingId)"
      :error-message="errorMessage"
      @submit="submit"
      @cancel="resetForm"
    />

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
        <JournalEntryItem
          :entry="entry"
          :tag-color="tagColor[entry.weatherTag]"
          :is-editing="editingId === entry.id"
          @edit="startEdit(entry)"
          @remove="remove(entry)"
        />
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

.journal-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 20px;
}
</style>
