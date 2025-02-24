<script setup>
import axios from 'axios';
import { reactive } from 'vue'
import sha256 from 'crypto-js/sha256';
import { useMainStore } from "../../../store/index";
const stores = useMainStore();
const data = reactive({
    tableData: [],

    form: {
        visible: false,
        username: '',
        name: '',
        password: '',
    },
})

// <!-- 获取用户列表 -->
getUserList()
function getUserList() {
    axios.get(stores.config.port + '/api/v1/admin/users', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+localStorage.getItem('adminToken')
        }
    }).then(res => {
        data.tableData = res.data.data
    })
}


// 创建新用户
function handleSubmit() {
    axios({
        method: 'post',
        url: stores.config.port + '/api/v1/admin/register',
        data: {
            username: data.form.username,
            password: data.form.password,
            name: data.form.name,
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+localStorage.getItem('adminToken')
        }
    })
    .then(res => {
        getUserList()
        data.form.visible = false
        data.form.username = ''
        data.form.password = ''
    })
}


// 重置密码
function handleResetPassword(username) {
    axios({
        method: 'post',
        url: stores.config.port + '/api/v1/admin/changeStatus',
        data: {
            username: username,
            password: sha256('123456').toString(),
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+localStorage.getItem('adminToken')
        }
    })
   .then(res => {
        getUserList()
    })
    .catch(err => {
        console.log(err)
    })
}

// 冻结用户
function handleFreezeUser(username, status) {
    axios({
        method: 'post',
        url: stores.config.port + '/api/v1/admin/changeStatus',
        data: {
            username: username,
            status: status,
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+localStorage.getItem('adminToken')
        }
    })
   .then(res => {
        getUserList()
    })
}


</script>



<template>

        <!-- 编辑应用信息弹窗 -->
    <el-dialog title="创建新用户" v-model="data.form.visible" style="width: 500px; max-height: 880px; overflow: auto;">
        <el-form ref="form" :model="data.form" label-width="80px">

            <el-form-item label="用户名">
                <el-input v-model="data.form.username" placeholder="请输入用户名" clearable />
            </el-form-item>

            <el-form-item label="用户姓名">
                <el-input v-model="data.form.name" placeholder="请输入用户名" clearable />
            </el-form-item>

            <el-form-item label="用户密码">
                <el-input v-model="data.form.password" placeholder="请输入用户密码" clearable />
            </el-form-item>
        </el-form>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="data.form.visible = false">取消</el-button>
                <el-button type="primary" @click="handleSubmit">保存</el-button>
            </div>
        </template>
    </el-dialog>

    <div class="admin-user-box">
        <div class="admin-user-content">
            <h1>后台用户</h1>
            <el-form :inline="true" :model="formInline" class="demo-form-inline">
                <el-form-item>
                    <el-button type="primary" @click="data.form.visible = true">创建新用户</el-button>
                </el-form-item>
            </el-form>
            <el-table :data="data.tableData" border style="width: 100%">
                <el-table-column label="用户ID" prop="user_id"></el-table-column>
                <el-table-column label="用户名" prop="username"></el-table-column>
                <el-table-column label="姓名" prop="name"></el-table-column>
                <el-table-column label="email" prop="email"></el-table-column>
                <el-table-column label="手机号" prop="phone"></el-table-column>
                <el-table-column label="用户状态" prop="status">
                    <template #default="{ row }">
                        <el-tag v-if="row.status === 1" type="success">正常</el-tag>
                        <el-tag v-if="row.status === 2" type="warning">已封禁</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="创建日期" prop="createdAt">
                    <template #default="{ row }">
                        {{ stores.formatDate(row.createdAt) }}
                    </template>
                </el-table-column>

                <!-- 固定列 -->
                <el-table-column label="操作" width="160" fixed="right">
                    <template #default="{row}">
                        <template v-if="row.status === 1">
                            <el-button type="primary" size="small" @click="handleFreezeUser(row.username, 2)">冻结</el-button>
                            <el-button type="danger" size="small" @click="handleResetPassword(row.username)">重置密码</el-button>
                        </template>

                        <template v-if="row.status === 2">
                            <el-button type="primary" size="small" @click="handleFreezeUser(row.username, 1)">恢复</el-button>
                        </template>
                        
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
</template>

<style scoped>
.admin-user-content h1{
    font-size: 20px;
    color: #333;
    font-weight: 600;
    margin-bottom: 20px;
}
.admin-user-content{
    width: 100%;
    height: 100%;
    padding: 18px;
    box-sizing: border-box;
    background: #fff;
    border: 1px solid #d9d9d9;
}
.admin-user-box {
    height: 100%;
    display: flex;
    padding: 18px;
    box-sizing: border-box;
    background: #f5f5f5;
    justify-content: center;
    align-items: center;
}
</style>