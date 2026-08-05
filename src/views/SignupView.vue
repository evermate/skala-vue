<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref(null)
const form = reactive({
  email: '',
  password: '',
  passwordConfirm: '',
  name: '',
  agree: false,
})

function validatePasswordConfirm(rule, value, callback) {
  if (value !== form.password) {
    callback(new Error('비밀번호가 일치하지 않습니다.'))
    return
  }
  callback()
}

function validateAgree(rule, value, callback) {
  if (!value) {
    callback(new Error('이용약관에 동의해야 가입할 수 있습니다.'))
    return
  }
  callback()
}

const rules = {
  email: [
    { required: true, message: '이메일을 입력해주세요.', trigger: 'blur' },
    { type: 'email', message: '올바른 이메일 형식이 아닙니다.', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '비밀번호를 입력해주세요.', trigger: 'blur' },
    { min: 4, message: '비밀번호는 4자 이상이어야 합니다.', trigger: 'blur' },
  ],
  passwordConfirm: [
    { required: true, message: '비밀번호를 한 번 더 입력해주세요.', trigger: 'blur' },
    { validator: validatePasswordConfirm, trigger: 'blur' },
  ],
  name: [{ required: true, message: '이름을 입력해주세요.', trigger: 'blur' }],
  agree: [{ validator: validateAgree, trigger: 'change' }],
}

const isFilling = ref(false)

// 테스트 편의용. 공통 틱 하나로 모든 필드 동시에 한 글자씩 채움, 짧은 필드는 먼저 멈춤.
async function fillTestValues() {
  if (isFilling.value) return
  isFilling.value = true

  const suffix = Date.now().toString(36).slice(-4)
  const targets = {
    email: `qa${suffix}@test.com`,
    name: '테스트',
    password: 'test1',
    passwordConfirm: 'test1',
  }

  for (const key of Object.keys(targets)) form[key] = ''
  form.agree = true

  const maxLength = Math.max(...Object.values(targets).map((value) => value.length))

  for (let length = 1; length <= maxLength; length += 1) {
    for (const [key, value] of Object.entries(targets)) {
      form[key] = value.slice(0, length)
    }
    await new Promise((resolve) => setTimeout(resolve, 40))
  }

  isFilling.value = false
}

async function submit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const success = await authStore.signup(form.email, form.password, form.name)
  if (success) {
    ElMessage.success('회원가입이 완료되었습니다. 로그인해주세요.')
    router.push('/login')
  }
}
</script>

<template>
  <div class="auth-view">
    <div class="auth-card">
      <h2 class="auth-card__title"><i class="fa-solid fa-user-plus"></i> 회원가입</h2>
      <p class="auth-card__note">가입 후 로그인하면 날씨 일지를 쓸 수 있어요.</p>

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
        <el-form-item label="이름" prop="name">
          <el-input v-model="form.name" placeholder="이름" />
        </el-form-item>
        <el-form-item label="비밀번호" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="4자 이상"
          />
        </el-form-item>
        <el-form-item label="비밀번호 확인" prop="passwordConfirm">
          <el-input
            v-model="form.passwordConfirm"
            type="password"
            show-password
            placeholder="비밀번호 재입력"
          />
        </el-form-item>
        <el-form-item prop="agree">
          <div class="auth-card__agree">
            <el-switch v-model="form.agree" />
            <span>개인정보 수집 및 필수 이용약관에 동의합니다.</span>
          </div>
        </el-form-item>

        <el-button
          class="auth-card__fill-btn"
          :loading="isFilling"
          :disabled="isFilling"
          @click="fillTestValues"
        >
          <i class="fa-solid fa-wand-magic-sparkles"></i> 양식 채우기
        </el-button>
        <el-button
          type="primary"
          class="auth-card__submit"
          :loading="authStore.isLoading"
          @click="submit"
        >
          회원가입하기
        </el-button>
      </el-form>

      <p class="auth-card__switch">
        이미 계정이 있으신가요? <RouterLink to="/login">로그인</RouterLink>
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

.auth-card__agree {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.auth-card__fill-btn {
  width: 100%;
  margin: 4px 0 0;
}

.auth-card__submit {
  width: 100%;
  margin: 10px 0 0;
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
