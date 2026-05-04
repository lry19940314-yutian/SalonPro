<!--
  NotFoundView.vue - 404 頁面不存在

  權限：公開
  設備：全部
-->
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

/** 返回首頁 */
function goHome(): void {
  router.push('/')
}
</script>

<template>
  <div class="not-found">
    <h1>404</h1>
    <p>頁面不存在</p>
    <button @click="goHome">返回首頁</button>
  </div>
</template>
