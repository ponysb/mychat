<script setup>
import axios from 'axios';
import { reactive } from 'vue'
import { useMainStore } from "../../../store/index";
const stores = useMainStore();
const data = reactive({
    searchForm: {
        username: '',
        type: '',
        status: null,
        createdAt: []
    },

    tableData: [],
})


// 获取数据
getData()
function getData() {
    axios({
        url: stores.config.port + '/api/v1/admin/feedbacks',
        method: 'post',
        data: data.searchForm,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+localStorage.getItem('adminToken')
        }
    })
    .then(res => {
        console.log(res)
        data.tableData = res.data.data
    })
    .catch(err => {
        console.log(err)
    })
}

// 处理
function handleEdit(feedback_id ,status) {
    axios({
        url: 'http://127.0.0.1:3000/api/v1/admin/editFeedbackStatus',
        method: 'post',
        data: {
            feedback_id: feedback_id,
            status: status
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+localStorage.getItem('adminToken')
        }
    })
    .then(res => {
        console.log(res)
        getData()
    })
    .catch(err => {
        console.log(err)
    })
}


</script>

<template>
    <div class="feedback-box">
        <div class="feedback-content">
            <h1>用户反馈</h1>
            <el-form :inline="true" :model="data.searchForm" class="demo-form-inline">

                <el-form-item label="用户名">
                    <el-input v-model="data.searchForm.username" placeholder="请输入用户名" clearable />
                </el-form-item>

                <el-form-item label="反馈类型">
                    <el-select v-model="data.searchForm.type" placeholder="请选择" style="width: 160px">
                            <el-option label="全部" :value="''"/>
                            <el-option label="用户体验" :value="'用户体验'"/>
                            <el-option label="bug" :value="'bug'"/>
                            <el-option label="功能建议" :value="'功能建议'"/>
                            <el-option label="有意思的功能" :value="'有意思的功能'"/>
                            <el-option label="吐槽" :value="'吐槽'"/>
                            <el-option label="其他" :value="'其他'"/>
                    </el-select>
                </el-form-item>

                <el-form-item label="反馈状态">
                    <el-select v-model="data.searchForm.status" placeholder="请选择" style="width: 160px">
                        <el-option label="全部" :value="null"/>
                        <el-option label="未处理" :value="1"/>
                        <el-option label="已处理" :value="2"/>
                    </el-select>
                </el-form-item>

                
                <el-form-item label="创建日期">
                    <el-date-picker
                        style="width: 220px;"
                        v-model="data.searchForm.createdAt"
                        type="daterange"
                        range-separator="-"
                        start-placeholder="开始时间"
                        end-placeholder="结束时间"
                    />
                </el-form-item>

                
                <el-form-item>
                    <el-button type="primary" @click="onSubmit">搜索</el-button>
                    <el-button type="default" @click="onSubmit">重置</el-button>
                </el-form-item>
            </el-form>
            <el-table :data="data.tableData" border style="width: 100%; height: calc(100% - 88px);">
                <el-table-column label="反馈ID" prop="feedback_id"></el-table-column>
                <el-table-column label="反馈者用户名" prop="username"></el-table-column>
                <el-table-column label="反馈内容" prop="content"></el-table-column>
                <el-table-column label="反馈类型" prop="type"></el-table-column>
                <el-table-column label="反馈状态" prop="status">
                    <template #default="{row}">
                        <el-tag type="success" v-if="row.status === 1">未处理</el-tag>
                        <el-tag type="warning" v-if="row.status === 2">已处理</el-tag>
                        <el-tag type="warning" v-if="row.status === 3">忽略</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="创建日期" prop="createdAt">
                    <template #default="{row}">
                        {{ stores.formatDate(row.createdAt) }}
                    </template>
                </el-table-column>

                <!-- 固定列 -->
                <el-table-column label="操作" width="150" fixed="right">
                    <template #default="{row}">
                        <template v-if="row.status === 1">
                            <el-button type="text" @click="handleEdit(row.feedback_id, 2)">已处理</el-button>
                            <el-button type="text" @click="handleDelete(row.feedback_id, 3)">忽略</el-button>
                        </template>

                        <template v-if="row.status === 3">
                            <el-button type="text" @click="handleEdit(row.feedback_id, 1)">未处理</el-button>
                            <el-button type="text" @click="handleEdit(row.feedback_id, 2)">已处理</el-button>
                        </template>

                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
</template>

<style scoped>
.feedback-content h1{
    font-size: 20px;
    color: #333;
    font-weight: 600;
    margin-bottom: 20px;
}
.feedback-content{
    width: 100%;
    height: 100%;
    padding: 18px;
    box-sizing: border-box;
    background: #fff;
    border: 1px solid #d9d9d9;
}
.feedback-box {
    height: 100%;
    display: flex;
    padding: 18px;
    box-sizing: border-box;
    background: #f5f5f5;
    justify-content: center;
    align-items: center;
}
</style>