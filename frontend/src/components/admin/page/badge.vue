<script setup>
import { ref, reactive } from 'vue'
const formInline = reactive({

})

const value = ref('')

const options = [
  {
    value: 'Option1',
    label: 'Option1',
  },
  {
    value: 'Option2',
    label: 'Option2',
  },
  {
    value: 'Option3',
    label: 'Option3',
  },
  {
    value: 'Option4',
    label: 'Option4',
  },
  {
    value: 'Option5',
    label: 'Option5',
  },
]
</script>

<template>
    <div class="badge-box">
        <div class="badge-content">
            <h1>徽章数据</h1>
            <el-form :inline="true" :model="formInline" class="demo-form-inline">

                <el-form-item label="用户名">
                    <el-input v-model="formInline.user" placeholder="请输入用户名" clearable />
                </el-form-item>
                
                <el-form-item label="选择徽章">
                    <el-select v-model="value" placeholder="Select" style="width: 160px">
                        <el-option
                            v-for="item in options"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                        />
                    </el-select>
                </el-form-item>
                
                <el-form-item>
                    <el-button type="primary" @click="onSubmit">搜索</el-button>
                    <el-button type="default" @click="onSubmit">重置</el-button>
                </el-form-item>
            </el-form>
            <el-table :data="tableData" border style="width: 100%">
                <el-table-column label="用户ID" prop="id"></el-table-column>
                <el-table-column label="用户名" prop="username"></el-table-column>
                <el-table-column label="头像" prop="avatar"></el-table-column>
                <el-table-column label="用户昵称" prop="nickname"></el-table-column>
                <el-table-column label="邀请码" prop="invite"></el-table-column>
                <el-table-column label="徽章类型" prop="badgeType"></el-table-column>
                <el-table-column label="用户状态" prop="status"></el-table-column>
                <el-table-column label="注册日期" prop="createdAt"></el-table-column>
                <!-- 固定列 -->
                <el-table-column label="操作" width="150" fixed="right">
                    <template slot-scope="scope">
                        <el-button type="text" @click="handleEdit(scope.$index)">编辑</el-button>
                        <el-button type="text" @click="handleDelete(scope.$index)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
</template>

<style scoped>
.badge-content h1{
    font-size: 20px;
    color: #333;
    font-weight: 600;
    margin-bottom: 20px;
}
.badge-content{
    width: 100%;
    height: 100%;
    padding: 18px;
    box-sizing: border-box;
    background: #fff;
    border: 1px solid #d9d9d9;
}
.badge-box {
    height: 100%;
    display: flex;
    padding: 18px;
    box-sizing: border-box;
    background: #f5f5f5;
    justify-content: center;
    align-items: center;
}
</style>