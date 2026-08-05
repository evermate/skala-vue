<script setup>
import { onMounted, ref } from 'vue'
import { mockSystemApi } from '@/api/mockSystemApi'
import { isStaticMockMode } from '@/api/mockHttp'

const status = ref('checking')

onMounted(async () => {
  try {
    await mockSystemApi.getHealth()
    status.value = 'ok'
  } catch {
    status.value = 'error'
  }
})
</script>

<template>
  <p class="mock-status" :class="status">
    <i class="fa-solid" :class="status === 'error' ? 'fa-triangle-exclamation' : 'fa-plug'"></i>
    Mock API: {{ isStaticMockMode ? '브라우저 어댑터' : '로컬 Node 서버' }}
    <span v-if="status === 'checking'">확인 중...</span>
    <span v-else-if="status === 'ok'">정상</span>
    <span v-else>연결 실패</span>
  </p>
</template>

<style scoped>
.mock-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.mock-status.error {
  color: var(--color-error);
}
</style>
