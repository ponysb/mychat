<script setup>
import { reactive } from 'vue'
import axios from 'axios'
import { useMainStore } from "../../../store/index";
const stores = useMainStore();
const data = reactive({
    tableData: [],
})

// 获取封禁数据
getBannedData()
function getBannedData() {
    axios.get(stores.config.port + '/api/v1/admin/banned', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+localStorage.getItem('adminToken')
        }
    }).then(res => {
        data.tableData = res.data.data
    })
}

// 解封
function handleEdit(username, user_id, ip, reason) {
    axios({
        method: 'post',
        url: 'http://127.0.0.1:3000/api/v1/admin/unbanUser',
        data: {
            username,
            user_id,
            ip,
            reason
        }
    })
    .then(res => {
        console.log(res)
        getBannedData()
    })
   .catch(err => {
        console.log(err)
   })
}

</script>

<template>
    <div class="banned-box">
        <div class="banned-content">
            <h1>封禁数据</h1>
            <el-table :data="data.tableData" border style="width: 100%">
                <el-table-column label="封禁用户ID" prop="user_id"></el-table-column>
                <el-table-column label="封禁用户名" prop="username"></el-table-column>
                <el-table-column label="封禁IP" prop="ip"></el-table-column>
                <el-table-column label="封禁原因" prop="reason"></el-table-column>
                <el-table-column label="封禁时间" prop="time">
                    <template #default="{ row }">
                        <div>{{ stores.formatDate(row.time) }}</div>
                    </template>
                </el-table-column>
                <!-- 固定列 -->
                <el-table-column label="操作" width="150" fixed="right">
                    <template #default="{ row }">
                        <el-button link @click="handleEdit(row.username, row.user_id, row.ip, row.reason)">解封</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
</template>

<style scoped>
.banned-content h1{
    font-size: 20px;
    color: #333;
    font-weight: 600;
    margin-bottom: 20px;
}
.banned-content{
    width: 100%;
    height: 100%;
    padding: 18px;
    box-sizing: border-box;
    background: #fff;
    border: 1px solid #d9d9d9;
}
.banned-box {
    height: 100%;
    display: flex;
    padding: 18px;
    box-sizing: border-box;
    background: #f5f5f5;
    justify-content: center;
    align-items: center;
}
</style>