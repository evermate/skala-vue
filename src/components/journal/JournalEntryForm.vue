<script setup>
defineProps({
  cityName: {
    type: String,
    required: true,
  },
  weatherTag: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  weatherTags: {
    type: Array,
    required: true,
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
})

defineEmits(['update:cityName', 'update:weatherTag', 'update:content', 'submit', 'cancel'])
</script>

<template>
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
      <el-input
        :model-value="cityName"
        placeholder="다녀온 곳"
        class="field-city"
        @update:model-value="$emit('update:cityName', $event)"
      />
      <el-select
        :model-value="weatherTag"
        class="field-tag"
        @update:model-value="$emit('update:weatherTag', $event)"
      >
        <el-option v-for="tag in weatherTags" :key="tag" :label="tag" :value="tag" />
      </el-select>
      <el-input
        :model-value="content"
        type="textarea"
        :rows="2"
        placeholder="오늘 날씨는 어땠나요?"
        class="field-content"
        @update:model-value="$emit('update:content', $event)"
      />
      <div class="journal-form__actions">
        <el-button v-if="isEditing" @click="$emit('cancel')">취소</el-button>
        <el-button type="primary" @click="$emit('submit')">{{
          isEditing ? '수정 완료' : '기록하기'
        }}</el-button>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
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

@media (max-width: 560px) {
  .journal-form {
    grid-template-columns: 1fr;
  }
}
</style>
