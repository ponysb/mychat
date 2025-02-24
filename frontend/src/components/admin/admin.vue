<script setup>
import { useRouter } from 'vue-router';
import Menu from "./view/menu.vue";
import Header from "./view/header.vue";
import { useMainStore } from "../../store/index";
const stores = useMainStore();
const router = useRouter();


if(localStorage.getItem("adminToken") === null){
    console.log(localStorage.getItem("adminToken"))
    router.push({path: "/admin/login"})
}else{
    // 解析jwt获取用户信息
    const token = localStorage.getItem("adminToken")
    const user = JSON.parse(atob(token.split('.')[1]))
    stores.admin.user.username = user.username
    stores.admin.user.user_id = user.user_id
    router.push('/admin/dashboard')
}

</script>

<template>
    <div class="admin">

        <div class="header-box">
            <Header />
        </div>

        <div class="content-box">
            <div class="menu-box">
                <Menu />
            </div>

            <div class="page-box">
                <router-view />
            </div>
        </div>
    </div>
</template>

<style scoped>
.page-box{
    width: calc(100% - 230px);
    background: #db8c8c;
}
.menu-box{
    width: 230px;
    height: 100%;
    background: #ffffff;
    overflow: auto;
    border-right: 1px solid #dcdfe6;
}
.content-box{
    width: 100%;
    height: calc(100vh - 68px);
    background: #d3d3d3;
    display: flex;
}
.header-box{
    width: 100%;
    height: 68px;
    background: #fff;
}
.admin {
    width: 100%;
    height: 100vh;
    background: #f5f5f5;
}
</style>