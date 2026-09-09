<template>
  <main>
    <BrandMark />
    <p class="error-number">{{ route.path === '/403' ? '403' : '404' }}</p>
    <h1>{{ route.path === '/403' ? '你暂时没有访问权限' : '这个页面暂时找不到' }}</h1>
    <p>请检查访问地址，或返回工作台继续。</p>
    <el-button type="primary" @click="router.replace('/')">返回工作台</el-button>
  </main>
</template>
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import BrandMark from '@/components/BrandMark.vue'
const route = useRoute()
const router = useRouter()
</script>
<style scoped>
main {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
}
.error-number {
  font-size: 76px;
  font-weight: 600;
  letter-spacing: -4px;
  color: #a4c7b7;
  margin: 35px 0 10px;
}
h1 {
  font-size: 25px;
}
p {
  color: #8b9b90;
}
.el-button {
  margin-top: 24px;
}
</style>
