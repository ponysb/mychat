<script setup>
import axios from 'axios'
import { reactive } from 'vue'
import { useMainStore } from "../../../store/index";
const stores = useMainStore();
const data = reactive({
    textarea: ''
})


// 获取违禁词列表
getForbiddeWordList()
function getForbiddeWordList() {
    axios({
        method: 'get',
        url: stores.config.port + '/api/v1/admin/sensitiveWords',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+localStorage.getItem('adminToken')
        }
    }).then(res => {
        console.log(res.data)
        data.textarea = res.data.data.join('\n')
    })
}


// 编辑违禁词
function addWord() {
    const words = data.textarea.split('\n')
    const params = {
        words: words
    }
    axios({
        method: 'post',
        url: stores.config.port + '/api/v1/admin/addSensitiveWord',
        data: params,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+localStorage.getItem('adminToken')
        }
    }).then(res => {
        console.log(res.data)
        getForbiddeWordList()
    })
}

</script>

<template>
    <div class="forbidde-word-box">
        <div class="forbidde-word-content">
            <h1>违禁词管理</h1>
            <div style="margin-bottom: 12px;">
                <el-button type="primary" @click="addWord">更新</el-button>
            </div>
            <el-input
                v-model="data.textarea"
                style="width: 840px"
                :rows="35"
                type="textarea"
                placeholder="请输入违禁词，每行一个"
            />

        </div>
    </div>
</template>

<style scoped>
.forbidde-word-content h1{
    font-size: 20px;
    color: #333;
    font-weight: 600;
    margin-bottom: 20px;
}
.forbidde-word-content{
    width: 100%;
    height: 100%;
    padding: 18px;
    box-sizing: border-box;
    background: #fff;
    border: 1px solid #d9d9d9;
}
.forbidde-word-box {
    height: 100%;
    display: flex;
    padding: 18px;
    box-sizing: border-box;
    background: #f5f5f5;
    justify-content: center;
    align-items: center;
}
</style>