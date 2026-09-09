<template>
  <div class="login-page">
    <div class="ambient ambient-one"></div>
    <div class="ambient ambient-two"></div>
    <header class="page-header">
      <a class="brand" href="/login" aria-label="广告数据后台首页"
        ><BrandMark />
        <div><strong>广告数据后台</strong><span>AD DATA CONSOLE</span></div></a
      >
      <div class="header-note"><span></span> 为每一次投放，提供清晰视野</div>
    </header>
    <main class="login-main"><LoginShowcase /><LoginForm /></main>
    <footer class="page-footer">
      <span>© {{ year }} 广告数据后台</span
      ><span class="footer-note">连接账户 · 读懂数据 · 从容决策</span
      ><span class="footer-platform">Built for <strong>TikTok Ads</strong></span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import BrandMark from '@/components/BrandMark.vue'
import LoginShowcase from './components/LoginShowcase.vue'
import LoginForm from './components/LoginForm.vue'
const year = new Date().getFullYear()
</script>

<style scoped>
.login-page {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  background: #f6f8f5;
}
.ambient {
  pointer-events: none;
  position: absolute;
  width: 740px;
  height: 740px;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.55;
}
.ambient-one {
  top: 160px;
  left: -400px;
  background: radial-gradient(circle, #dcece0 0, transparent 67%);
}
.ambient-two {
  top: -460px;
  right: -110px;
  background: radial-gradient(circle, #e2ebe0 0, transparent 65%);
}
.page-header {
  height: 112px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 5%;
  position: relative;
  z-index: 1;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand strong {
  display: block;
  font-size: 17px;
  font-weight: 650;
  letter-spacing: 1px;
}
.brand div > span {
  display: block;
  color: #99a49b;
  font-size: 8px;
  letter-spacing: 2.2px;
  margin-top: 5px;
}
.header-note {
  font-size: 11px;
  color: #9aa59d;
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-note > span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #94ad9a;
}
.login-main {
  flex: 1;
  width: min(1100px, 88%);
  margin: 0 auto;
  padding: 35px 0 60px;
  min-height: 620px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 95px;
  align-items: center;
  position: relative;
  z-index: 1;
}
.page-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 5% 26px;
  color: #a1ada3;
  font-size: 10px;
  position: relative;
  z-index: 1;
}
.footer-note {
  letter-spacing: 1.5px;
  margin-left: -25px;
}
.footer-platform {
  font-size: 9px;
  letter-spacing: 0.25px;
}
.footer-platform strong {
  font-weight: 500;
  color: #88998b;
  margin-left: 5px;
}
@media (min-height: 950px) {
  .login-main {
    flex: 0;
    margin-block: auto;
  }
}
@media (max-width: 1100px) {
  .login-main {
    gap: 40px;
    grid-template-columns: minmax(0, 1fr) 390px;
    width: 90%;
  }
}
@media (max-width: 800px) {
  .page-header {
    height: 100px;
    padding-inline: 7%;
  }
  .header-note {
    display: none;
  }
  .login-main {
    display: flex;
    justify-content: center;
    padding: 30px 0 65px;
    min-height: unset;
    width: 90%;
  }
  .footer-note {
    display: none;
  }
  .page-footer {
    padding: 22px 7%;
  }
}
@media (max-width: 480px) {
  .page-header {
    height: 95px;
  }
  .brand strong {
    font-size: 16px;
  }
  .login-main {
    padding-block: 18px 42px;
  }
  .footer-platform {
    font-size: 8px;
  }
}
</style>
