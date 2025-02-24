<script setup>
import { ref, reactive } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useMainStore } from '../../../store/index'
import sha256 from 'crypto-js/sha256'
const stores = useMainStore()

const router = useRouter()
const data = reactive({
    username: '',  // 用户名
    password: '',  // 密码
})

// 登录
function login() {
    // 
    axios({
        method: 'post',
        url: stores.config.port + '/api/v1/admin/login',
        data: {
            username: data.username,
            password: sha256(data.password).toString()
        },
        headers: {
            'Content-Type': 'application/json',
        }
    }).then(res => {
        // console.log(res)
        stores.admin.user.username = res.data.data.user.username
        stores.admin.user.user_id = res.data.data.user.user_id
        localStorage.setItem('adminToken', res.data.data.token)
        router.push('/admin/dashboard')
    }).catch(err => {
        console.log(err)
        ElMessage({
            message: err.response.data.message,
            type: 'warning',
        })
    })
}
</script>

<template>
    <div class="login-page">
        <!-- 登录页面 -->
        <div class="login-container">
            <div class="logo">
                <div class="logo-container">
                    <img src="../../../assets/logo.svg" alt="logo">
                    <h1>摸鱼聊天室</h1>
                </div>
                <p>抓鱼鸭- 摸鱼聊天室后台管理系统</p>
            </div>
            <div class="form">
                <el-input v-model="data.username" prefix-icon="User" style="width: 360px; height: 38px;" placeholder="请输入用户名" />
            </div>
            
            <div class="form">
                <el-input v-model="data.password" prefix-icon="Lock" style="width: 360px; height: 38px;" type="password" placeholder="请输入密码" />
            </div>
            
            
            <el-button style="width: 360px; height: 38px; margin-top: 20px;" type="primary" @click="login">登录</el-button><br />
        </div>

        <div class="footer">
            <p>抓鱼鸭 - 摸鱼聊天室后台管理系统</p>
            <p>Copyright © 2025 <a href="http://home.zhuayuya.com" target="_blank">抓鱼鸭</a>. All Rights Reserved.</p>
        </div>
    </div>
</template>

<style scoped>
.footer p{
    margin: 0;
    color: #6b6b6b;
    font-size: 14px;
    margin-bottom: 10px;
    letter-spacing: .5px;
}
.logo p{
    margin-top: 20px;
    color: #808080;
    font-size: 15px;
    letter-spacing: .8px;
}
.form{
    margin-top: 16px;
}
.logo-container h1{
    font-size: 28px;
    font-weight: 600;
    color: #0d89dc;
}
.logo-container img{
    width: 32px;
    margin-right: 10px;
}
.logo-container{
    display: flex;
    width: 182px;
    margin: 0 auto;
    align-items: flex-end;
}
.login-container{
    margin-top: 250px;
}
.footer{
    margin-bottom: 10px;
}
.login-page{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    text-align: center;
    height: 100vh;
    background-color: #f0f2f5;
}
</style>
