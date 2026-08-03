<script setup>
defineProps({
  icon: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <section class="dashboard-card">
    <div class="dashboard-card__title-row">
      <h3 class="dashboard-card__title">
        <i v-if="icon" class="dashboard-card__icon" :class="icon"></i>
        {{ title }}
      </h3>
      <div v-if="$slots['title-extra']" class="dashboard-card__title-extra">
        <slot name="title-extra"></slot>
      </div>
    </div>
    <div class="dashboard-card__body">
      <slot></slot>
    </div>
  </section>
</template>

<style scoped>
.dashboard-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px 22px;
  margin-bottom: 18px;
  box-shadow: var(--shadow-sm);
}

.dashboard-card__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin: 0 0 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-soft);
}

.dashboard-card__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.dashboard-card__icon {
  font-size: 16px;
  color: var(--aurora-1);
}

.dashboard-card__title-extra {
  display: flex;
  align-items: center;
}

.dashboard-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
