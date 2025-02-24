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
    <div class="app-keywords-box">
        <div class="app-keywords-content">
            <h1>应用关键词搜索</h1>
            <el-form :inline="true" :model="formInline" class="demo-form-inline">

                <el-form-item label="关键词">
                    <el-input v-model="formInline.user" placeholder="请输入关键词" clearable />
                </el-form-item>

                
                <el-form-item label="搜索日期">
                    <el-date-picker v-model="formInline.date" type="date" placeholder="选择日期" clearable />
                </el-form-item>
                
                <el-form-item>
                    <el-button type="primary" @click="onSubmit">搜索</el-button>
                    <el-button type="default" @click="onSubmit">重置</el-button>
                </el-form-item>
            </el-form>
            <el-table :data="tableData" border style="width: 100%">
                <el-table-column label="关键词ID" prop="keyword_id"></el-table-column>
                <el-table-column label="关键词" prop="keyword"></el-table-column>
                <el-table-column label="搜索人数" prop="search_num"></el-table-column>
            </el-table>
        </div>
    </div>
</template>

<style scoped>
.app-keywords-content h1{
    font-size: 20px;
    color: #333;
    font-weight: 600;
    margin-bottom: 20px;
}
.app-keywords-content{
    width: 100%;
    height: 100%;
    padding: 18px;
    box-sizing: border-box;
    background: #fff;
    border: 1px solid #d9d9d9;
}
.rapp-keywords-box {
    height: 100%;
    display: flex;
    padding: 18px;
    box-sizing: border-box;
    background: #f5f5f5;
    justify-content: center;
    align-items: center;
}
</style>