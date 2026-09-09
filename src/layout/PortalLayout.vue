<template>
  <div class="workspace">
    <aside>
      <a class="workspace-brand" href="/portal/authorizations"
        ><BrandMark /><strong>广告数据后台</strong></a
      >
      <div class="nav-caption">工作空间</div>
      <nav aria-label="主导航">
        <router-link v-for="page in visiblePages" :key="page.path" :to="page.path"
          ><el-icon><component :is="icons[page.icon]" /></el-icon>{{ page.title }}</router-link
        >
      </nav>
      <div class="sidebar-foot">AD DATA CONSOLE</div>
    </aside>
    <div class="workspace-main">
      <header>
        <span>{{ route.meta.title }}</span>
        <div class="identity">
          <span
            >{{ auth.session?.company.company_type === 'internal' ? '本公司' : '外部企业' }} ·
            {{ auth.session?.company.name }}</span
          ><span class="identity-divider"></span><span>{{ auth.session?.user.display_name }}</span
          ><el-button text :loading="signingOut" @click="signOut">退出</el-button>
        </div>
      </header>
      <main><router-view /></main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Calendar, Connection, DataLine, Download, Wallet } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import BrandMark from '@/components/BrandMark.vue'
import { portalPages } from '@/constants/navigation'
import { useAuthStore } from '@/stores/auth'
const icons = { Calendar, Connection, DataLine, Download, Wallet }
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const visiblePages = computed(() =>
  portalPages.filter((page) => auth.session?.permissions.includes(page.permission)),
)
const signingOut = ref(false)
async function signOut() {
  signingOut.value = true
  try {
    await auth.signOut()
    await router.replace('/login')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '退出失败，请重试')
  } finally {
    signingOut.value = false
  }
}
</script>

<style scoped>
.workspace {
  display: flex;
  min-height: 100svh;
}
aside {
  width: 232px;
  padding: 30px 20px;
  background: white;
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
}
.workspace-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}
.workspace-brand strong {
  font-size: 16px;
}
.nav-caption {
  color: #9ba99f;
  font-size: 11px;
  margin: 43px 14px 13px;
}
nav {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
nav a {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 10px;
  color: #79897f;
}
nav a.router-link-active {
  background: #eaf4ef;
  color: var(--brand);
  font-weight: 600;
}
nav .el-icon {
  font-size: 18px;
}
.sidebar-foot {
  margin: auto 13px 0;
  padding-top: 35px;
  font-size: 9px;
  color: #a5b1a8;
  letter-spacing: 2px;
}
.workspace-main {
  flex: 1;
  min-width: 0;
}
header {
  background: #ffffffd9;
  border-bottom: 1px solid var(--line);
  min-height: 83px;
  padding: 18px 36px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.identity {
  display: flex;
  align-items: center;
  gap: 13px;
  font-size: 12px;
  color: #708577;
}
.identity-divider {
  height: 13px;
  width: 1px;
  background: var(--line);
}
main {
  padding: 36px;
}
@media (max-width: 760px) {
  .workspace {
    flex-direction: column;
  }
  aside {
    width: 100%;
    padding: 18px;
    border-right: 0;
  }
  .nav-caption,
  .sidebar-foot {
    display: none;
  }
  nav {
    flex-direction: row;
    flex-wrap: wrap;
    margin-top: 20px;
    gap: 4px;
  }
  nav a {
    padding: 10px;
    font-size: 12px;
    gap: 5px;
  }
  header {
    padding: 18px;
    flex-wrap: wrap;
    gap: 15px;
  }
  main {
    padding: 24px 18px;
  }
}
</style>
