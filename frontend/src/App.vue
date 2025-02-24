<script setup>
import { onMounted, onBeforeUnmount } from 'vue';

// onMounted(() => {
//   // 在页面关闭前弹出提示框
//   window.addEventListener('beforeunload', handleBeforeUnload);
// });

// onBeforeUnmount(() => {
//   // 移除事件监听器，防止内存泄漏
//   window.removeEventListener('beforeunload', handleBeforeUnload);
// });

// function handleBeforeUnload(event) {
//   // 自定义提示信息（浏览器通常会忽略该信息，只会显示默认提示）
//   const message = '防手滑提示，如果下次关闭窗口不想看到可以在个人中心抽屉里关闭此选项。。。';
  
//   // 设置事件返回值来触发提示框
//   event.returnValue = message;
//   return message;  // 对某些浏览器也可以返回这个消息
// }


</script>

<template>
<router-view v-slot="{ Component }">
    <keep-alive>
        <component :is="Component" />
    </keep-alive>
</router-view>

</template>

<style scoped>

</style>
