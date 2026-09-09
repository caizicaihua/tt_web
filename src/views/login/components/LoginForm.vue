<template>
  <section class="login-card" aria-labelledby="login-title">
    <div class="card-kicker"><span></span> 工作台登录</div>
    <h2 id="login-title">欢迎回来<span class="heading-dot">.</span></h2>
    <p class="card-description">登录广告数据后台，开启高效的一天。</p>
    <component :is="MockLoginHint" v-if="MockLoginHint" />

    <el-form
      ref="loginForm"
      :model="form"
      :rules="rules"
      label-position="top"
      size="large"
      class="login-form"
      @submit.prevent="submit"
    >
      <el-form-item label="企业账号" prop="username">
        <el-input
          v-model="form.username"
          name="username"
          autocomplete="username"
          placeholder="请输入企业账号"
          :prefix-icon="User"
          :maxlength="128"
          :disabled="loading"
        />
      </el-form-item>
      <el-form-item label="登录密码" prop="password">
        <el-input
          v-model="form.password"
          name="password"
          :type="passwordVisible ? 'text' : 'password'"
          autocomplete="current-password"
          placeholder="请输入登录密码"
          :prefix-icon="Lock"
          :maxlength="128"
          :disabled="loading"
        >
          <template #suffix>
            <button
              type="button"
              class="password-toggle"
              :aria-label="passwordVisible ? '隐藏密码' : '显示密码'"
              :aria-pressed="passwordVisible"
              :disabled="loading"
              @click="passwordVisible = !passwordVisible"
            >
              <el-icon><Hide v-if="passwordVisible" /><View v-else /></el-icon>
            </button>
          </template>
        </el-input>
      </el-form-item>
      <div class="form-options">
        <el-checkbox v-model="rememberUsername" :disabled="loading">记住账号</el-checkbox
        ><button type="button" class="text-button" @click="helpOpen = true">忘记密码？</button>
      </div>
      <div v-if="errorMessage" class="login-error" role="alert">
        <el-icon><Warning /></el-icon><span>{{ errorMessage }}</span>
      </div>
      <el-button type="primary" native-type="submit" class="submit-button" :loading="loading"
        ><span>{{ loading ? '正在登录' : '登 录' }}</span
        ><el-icon v-if="!loading"><Right /></el-icon
      ></el-button>
    </el-form>

    <div class="account-help">
      还没有账号？<button type="button" class="text-button" @click="helpOpen = true">
        联系管理员开通 <span>↗</span>
      </button>
    </div>
    <div class="card-bottom">
      <el-icon><Lock /></el-icon><span>企业专属空间，数据独立管理</span>
    </div>
    <el-dialog v-model="helpOpen" title="联系企业管理员" width="400px" align-center>
      <p class="help-copy">
        账号由企业管理员统一开通。如果你需要申请账号或重置密码，请联系所在公司的管理员处理。
      </p>
      <template #footer
        ><el-button type="primary" @click="helpOpen = false">我知道了</el-button></template
      >
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, useTemplateRef } from 'vue'
import type { FormInstance } from 'element-plus'
import { Hide, Lock, Right, User, View, Warning } from '@element-plus/icons-vue'
import { useLogin } from '../composables/useLogin'

const helpOpen = ref(false)
const MockLoginHint = __MOCK_ENABLED__
  ? defineAsyncComponent(() => import('./MockLoginHint.vue'))
  : null
const passwordVisible = ref(false)
const loginForm = useTemplateRef<FormInstance>('loginForm')
const { form, rules, loading, rememberUsername, errorMessage, submit } = useLogin(loginForm)
</script>

<style scoped>
.login-card {
  background: #fff;
  border: 1px solid #e3e9e3;
  border-radius: 22px;
  padding: 40px 40px 0;
  box-shadow:
    0 20px 70px #28433309,
    0 3px 9px #28433303;
  width: 420px;
  max-width: 100%;
  position: relative;
}
.card-kicker {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #89978e;
  font-size: 11px;
  letter-spacing: 1px;
}
.card-kicker > span {
  width: 13px;
  height: 3px;
  background: var(--brand);
  border-radius: 2px;
}
h2 {
  margin: 20px 0 11px;
  font-size: 29px;
  font-weight: 650;
  letter-spacing: -0.5px;
}
.heading-dot {
  color: var(--brand);
  margin-left: 3px;
}
.card-description {
  color: #919b95;
  font-size: 12px;
  margin: 0;
}
.login-form {
  margin-top: 33px;
}
.login-form :deep(.el-form-item) {
  margin-bottom: 24px;
}
.login-form :deep(.el-form-item__label) {
  font-size: 12px;
  font-weight: 500;
  color: #485b50;
  margin-bottom: 9px;
  padding: 0;
  line-height: 20px;
}
.login-form :deep(.el-form-item__label::before) {
  display: none;
}
.login-form :deep(.el-input__wrapper) {
  height: 48px;
  border-radius: 9px;
  background: #fcfdfc;
  padding: 1px 14px;
  box-shadow: 0 0 0 1px #e2e8e2 inset;
  transition:
    box-shadow 0.2s,
    background 0.2s;
}
.login-form :deep(.el-input__wrapper.is-focus) {
  background: #fff;
  box-shadow:
    0 0 0 1px var(--brand) inset,
    0 0 0 3px #087f680c;
}
.login-form :deep(.el-input__inner) {
  font-size: 12px;
}
.login-form :deep(.el-input__inner::placeholder) {
  color: #b2b9b3;
}
.login-form :deep(.el-input__prefix) {
  color: #98a59b;
  font-size: 16px;
  margin-right: 3px;
}
.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: -7px;
  margin-bottom: 22px;
}
.form-options :deep(.el-checkbox__label) {
  font-size: 11px;
  color: #869389;
  font-weight: 400;
}
.form-options :deep(.el-checkbox__inner) {
  border-radius: 4px;
}
.text-button {
  border: 0;
  padding: 3px 0;
  background: none;
  font-size: 11px;
  color: var(--brand);
}
.password-toggle {
  display: grid;
  place-items: center;
  border: 0;
  padding: 5px;
  background: transparent;
  color: #8c9c91;
  border-radius: 5px;
  font-size: 16px;
}
.password-toggle:hover {
  color: var(--brand);
}
.text-button:hover {
  color: var(--brand-dark);
  text-decoration: underline;
  text-underline-offset: 4px;
}
.submit-button {
  width: 100%;
  height: 47px;
  border-radius: 9px;
  font-size: 14px;
  box-shadow: 0 6px 13px #087f6816;
}
.submit-button :deep(> span) {
  width: 100%;
  justify-content: center;
  position: relative;
}
.submit-button .el-icon {
  position: absolute;
  right: 4px;
  font-size: 17px;
  opacity: 0.85;
}
.login-error {
  display: flex;
  gap: 7px;
  color: #b54b3c;
  background: #fff7f5;
  border: 1px solid #fae8e2;
  border-radius: 8px;
  font-size: 11px;
  line-height: 1.7;
  padding: 10px;
  margin-bottom: 14px;
}
.login-error .el-icon {
  margin-top: 3px;
  flex-shrink: 0;
}
.account-help {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin: 24px 0 30px;
  font-size: 11px;
  color: #9aa49c;
}
.account-help span {
  margin-left: 2px;
}
.card-bottom {
  margin: 0 -40px;
  padding: 17px 20px;
  border-top: 1px solid #edf1ed;
  border-radius: 0 0 22px 22px;
  background: #fdfefd;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  font-size: 10px;
  letter-spacing: 0.25px;
  color: #99a79b;
}
.card-bottom .el-icon {
  font-size: 12px;
  color: #82a18b;
}
.help-copy {
  margin-top: 0;
  font-size: 14px;
}
@media (max-width: 480px) {
  .login-card {
    padding: 30px 25px 0;
    border-radius: 18px;
  }
  .card-bottom {
    margin-inline: -25px;
    border-radius: 0 0 18px 18px;
  }
}
</style>
