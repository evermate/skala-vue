<script setup>
defineProps({
  entry: {
    type: Object,
    required: true,
  },
  tagColor: {
    type: String,
    required: true,
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['edit', 'remove'])
</script>

<template>
  <div class="entry" :class="{ 'is-editing': isEditing }">
    <div class="entry__head">
      <strong>{{ entry.cityName }}</strong>
      <span class="entry__tag" :style="{ color: tagColor }">{{ entry.weatherTag }}</span>
    </div>
    <p class="entry__content">{{ entry.content }}</p>
    <div class="entry__actions">
      <el-button size="small" text @click="$emit('edit')">수정</el-button>
      <el-button size="small" text type="danger" @click="$emit('remove')">삭제</el-button>
    </div>
  </div>
</template>

<style scoped>
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
</style>
