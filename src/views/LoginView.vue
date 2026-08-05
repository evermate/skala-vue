<script setup>
import { onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const formRef = ref(null)
const form = reactive({ email: '', password: '' })

const rules = {
  email: [
    { required: true, message: '이메일을 입력해주세요.', trigger: 'blur' },
    { type: 'email', message: '올바른 이메일 형식이 아닙니다.', trigger: 'blur' },
  ],
  password: [{ required: true, message: '비밀번호를 입력해주세요.', trigger: 'blur' }],
}

onMounted(() => {
  // 회원가입 화면에서 방금 가입한 계정으로 넘어온 경우, 폼을 자동으로 채워준다(1회용).
  if (authStore.pendingLoginCredentials) {
    form.email = authStore.pendingLoginCredentials.email
    form.password = authStore.pendingLoginCredentials.password
    authStore.pendingLoginCredentials = null
  }
})

async function submit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const success = await authStore.login(form.email, form.password)
  if (success) {
    router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/journal')
  }
}
</script>

<template>
  <div class="auth-view">
    <div class="auth-card">
      <h2 class="auth-card__title"><i class="fa-solid fa-right-to-bracket"></i> 로그인</h2>
      <p class="auth-card__note">날씨 일지는 로그인해야 볼 수 있어요.</p>

      <el-alert
        v-if="authStore.errorMessage"
        :title="authStore.errorMessage"
        type="error"
        show-icon
        :closable="false"
        class="auth-card__alert"
      />

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submit"
      >
        <el-form-item label="이메일" prop="email">
          <el-input v-model="form.email" placeholder="example@email.com" />
        </el-form-item>
        <el-form-item label="비밀번호" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="비밀번호"
          />
        </el-form-item>
        <el-button
          type="primary"
          class="auth-card__submit"
          :loading="authStore.isLoading"
          @click="submit"
        >
          로그인
        </el-button>
      </el-form>

      <p class="auth-card__switch">
        계정이 없으신가요? <RouterLink to="/signup">회원가입</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-view {
  display: flex;
  justify-content: center;
  padding: 60px 16px;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 28px 26px;
  background: var(--color-card-background);
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-card);
}

.auth-card__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 6px;
  font-size: 20px;
  color: var(--color-text);
}

.auth-card__title i {
  color: var(--color-primary-darker);
}

.auth-card__note {
  margin: 0 0 18px;
  font-size: 12px;
  color: var(--color-text-light);
}

.auth-card__alert {
  margin-bottom: 14px;
}

.auth-card__submit {
  width: 100%;
  margin-top: 4px;
}

.auth-card__switch {
  margin: 16px 0 0;
  font-size: 13px;
  text-align: center;
  color: var(--color-text-secondary);
}

.auth-card__switch a {
  color: var(--color-primary-darker);
  font-weight: 700;
  text-decoration: none;
}

.auth-card__switch a:hover {
  text-decoration: underline;
}
</style>
