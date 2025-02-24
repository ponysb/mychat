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
    <div class="feedback-box">
        <div class="feedback-content">
            <h1>渠道链设置</h1>
            <el-form :inline="true" :model="formInline" class="demo-form-inline">

                <el-form-item label="用户名">
                    <el-input v-model="formInline.user" placeholder="请输入用户名" clearable />
                </el-form-item>

                <el-form-item label="反馈类型">
                    <el-select v-model="value" placeholder="请选择反馈类型" style="width: 160px">
                        <el-option
                            v-for="item in options"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                        />
                    </el-select>
                </el-form-item>

                <el-form-item label="反馈状态">
                    <el-select v-model="value" placeholder="请选择反馈状态" style="width: 160px">
                        <el-option
                            v-for="item in options"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                        />
                    </el-select>
                </el-form-item>

                
                <el-form-item label="创建日期">
                    <el-date-picker v-model="formInline.date" type="date" placeholder="选择日期" clearable />
                </el-form-item>

                
                <el-form-item>
                    <el-button type="primary" @click="onSubmit">搜索</el-button>
                    <el-button type="default" @click="onSubmit">重置</el-button>
                    <el-button type="default" @click="onSubmit">新增渠道链</el-button>
                </el-form-item>
            </el-form>
            <el-table :data="tableData" border style="width: 100%">
                <el-table-column label="渠道ID" prop="channel_id"></el-table-column>
                <el-table-column label="渠道名称" prop="channel_name"></el-table-column>
                <el-table-column label="渠道用户数" prop="user_num"></el-table-column>
                <el-table-column label="渠道收入" prop="amount"></el-table-column>
                <el-table-column label="渠道备注" prop="remark"></el-table-column>
                <el-table-column label="创建日期" prop="createdAt"></el-table-column>

                <!-- 固定列 -->
                <el-table-column label="操作" width="150" fixed="right">
                    <template slot-scope="scope">
                        <el-button type="text" @click="handleDelete(scope.$index)">复制链接</el-button>
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