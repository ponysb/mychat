<script setup>
import axios from 'axios';
import { reactive } from 'vue'
import { useMainStore } from "../../../store/index";
const stores = useMainStore();
const data = reactive({
    form:{
        visible:false,
        app_id:'',
        title:'',
        url:'',
        top:'',
        icon:'',
        placard:[],
        desc:'',
        category:'',
        status:null,
        tag:[]
    },

    tableData: [],

    searchForm: {
        app_id:'',
        title:'',
        url:'',
        top:'',
        createdAt:[],
        category:'',
        status:null,
    }
})


// 获取应用列表
getAppList()
function getAppList() {
    axios({
        method: 'post',
        url: stores.config.port + '/api/v1/admin/chatApp',
        data: data.searchForm,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+localStorage.getItem('adminToken')
        }
    })
    .then(res => {
        data.tableData = res.data.data
    })
    .catch(err => {
        console.log(err)
    })
}


// 应用编辑
function editApp() {
    axios({
        method: 'post',
        url: stores.config.port + '/api/v1/admin/editChatApp',
        data: {
            app_id: data.form.app_id,
            title: data.form.title,
            url: data.form.url,
            top: data.form.top,
            icon: data.form.icon,
            placard: data.form.placard,
            desc: data.form.desc,
            category: data.form.category,
            status: data.form.status,
            tag: data.form.tag.length > 0 ? data.form.tag.join(',') : []
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+localStorage.getItem('adminToken')
        }
    })
     .then(res => {
        ElMessage({
            message: '编辑成功',
            type:'success',
        })
        data.form.visible = false
        getAppList()
    })
    .catch(err => {
        console.log(err)
        ElMessage({
            message: '编辑失败',
            type: 'error',
        })
    })
}

// 上传海报
function setPlacard() {
    console.log('上传海报')
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = e => {
        const files = e.target.files;
        const form = new FormData();
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const type = file.name.split('.').pop().toLowerCase();
            if (type !== 'jpg' && type !== 'jpeg' && type !== 'png' && type !== 'gif' && type !== 'webp' && type !== 'bmp') {
                ElMessage({
                    message: '仅支持 jpg、jpeg、png、gif、webp、bmp 格式的图片',
                    type: 'warning',
                })
                return;
            }
            form.append('file', file);
        }
        axios({
            method: 'post',
            url: stores.config.port + '/api/v1/admin/uploadPoster',
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': 'Bearer '+localStorage.getItem('adminToken')
            },
            data: form,
        }).then(res => {
            data.form.placard.push(res.data.data.file.newFilename)
            ElMessage({
                message: '上传成功',
                type:'success',
            })
        })
        .catch(err => {
            console.log(err)
            ElMessage({
                message: '上传失败',
                type: 'error',
            })
        })
    };
    input.click();
}
</script>

<template>

    <!-- 编辑应用信息弹窗 -->
    <el-dialog title="编辑应用信息" v-model="data.form.visible" style="width: 500px; max-height: 880px; overflow: auto;">
        <p style="color:brown; margin-left: 12px; margin-bottom: 13px;">应用信息违规情况下修改，谨慎操作！</p>

        <el-form ref="form" :model="data.add_room" label-width="80px">

            <el-form-item label="应用图标">
                <el-avatar v-if="data.form.icon === ''" :size="50" :src="'https://icon.bqb.cool?url='+data.form.url" />
                <el-avatar v-else :size="50" :src="stores.config.port + '/app/'+data.form.icon" />
                <el-button @click="data.form.icon = ''" style="margin-left: 10px;" size="small" type="default">清空图标</el-button>
            </el-form-item>

            <el-form-item label="应用名称">
                <el-input v-model="data.form.title" placeholder="请输入应用名称" clearable />
            </el-form-item>

            <el-form-item label="应用链接">
                <el-input v-model="data.form.url" placeholder="请输入应用链接" clearable />
            </el-form-item>

            <el-form-item label="应用介绍">
                <el-input type="textarea" v-model="data.form.desc" placeholder="请输入应用介绍" clearable />
            </el-form-item>

            <el-form-item label="应用分类">
                <el-input v-model="data.form.category" placeholder="请输入应用分类" clearable />
            </el-form-item>

            <el-form-item label="应用标签">
                <el-input v-model="data.form.tag" placeholder="请输入应用分类" clearable />
                <span style="color: brown; font-size: 12px;">多个标签用英文逗号隔开</span>
            </el-form-item>

            <el-form-item label="应用图标">
                <el-input disabled v-model="data.form.icon" placeholder="请输入应用图标" clearable />
            </el-form-item>

            <el-form-item label="是否推荐">
                <el-select v-model="data.form.top">
                    <el-option label="不推荐" :value="0"></el-option>
                    <el-option label="推荐" :value="1"></el-option>
                </el-select>
            </el-form-item>

            <el-form-item label="应用状态">
                <el-select v-model="data.form.status">
                    <el-option label="正常" :value="1"></el-option>
                    <el-option label="封禁" :value="2"></el-option>
                </el-select>
            </el-form-item>

            <el-form-item label="应用海报">
                <div>
                    <el-button @click="setPlacard" type="primary" size="small">上传海报</el-button>
                    <div v-for="(item, index) in data.form.placard" :key="index">
                        <img style="width: 88px; height: 50px; object-fit: cover;" :src="stores.config.port + '/placard/'+item.url" alt="">
                        <el-button @click="() => {
                            data.form.placard.splice(index, 1)
                        }" link size="small">删除</el-button>
                    </div>
                </div>
            </el-form-item>
        </el-form>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="data.form.visible = false">取消</el-button>
                <el-button type="primary" @click="editApp">保存</el-button>
            </div>
        </template>
    </el-dialog>


    <div class="apps-box">
        <div class="apps-content">
            <h1>应用管理</h1>
            <el-form :inline="true" :model="data.searchForm" class="demo-form-inline">

                <el-form-item label="应用ID">
                    <el-input v-model="data.searchForm.app_id" placeholder="请输入APPID" clearable />
                </el-form-item>

                <el-form-item label="应用名称">
                    <el-input v-model="data.searchForm.title" placeholder="请输入应用名称" clearable />
                </el-form-item>

                <el-form-item label="应用链接">
                    <el-input v-model="data.searchForm.url" placeholder="请输入应用链接" clearable />
                </el-form-item>

                <el-form-item label="创建时间">
                    <el-date-picker
                        style="width: 220px;"
                        v-model="data.searchForm.createdAt"
                        type="daterange"
                        range-separator="-"
                        start-placeholder="开始时间"
                        end-placeholder="结束时间"
                    />
                </el-form-item>

                <el-form-item label="是否推荐">
                    <el-select v-model="data.searchForm.top" placeholder="请选择" style="width: 160px">
                        <el-option label="全部" :value="null"/>
                        <el-option label="未推荐" :value="0"/>
                        <el-option label="推荐" :value="1"/>
                    </el-select>
                </el-form-item>

                <el-form-item label="应用状态">
                    <el-select v-model="data.searchForm.status" placeholder="请选择" style="width: 160px">
                        <el-option label="全部" :value="null"/>
                        <el-option label="正常" :value="1"/>
                        <el-option label="封禁" :value="2"/>
                    </el-select>
                </el-form-item>
                
                <el-form-item>
                    <el-button type="primary" @click="getAppList">搜索</el-button>
                    <el-button type="default" @click="() => {
                        data.searchForm = {
                            app_id:'',
                            title:'',
                            url:'',
                            top:'',
                            createdAt:[],
                            category:''
                        }
                        getAppList()
                    }">重置</el-button>
                </el-form-item>
            </el-form>

            <el-table :data="data.tableData" border style="width: 100%; height: calc(100% - 138px);">
                <el-table-column label="应用ID" prop="app_id"></el-table-column>
                <el-table-column label="应用名称" prop="title"></el-table-column>
                <el-table-column label="应用图标" prop="icon">
                    <template #default="{ row }">
                        <el-avatar v-if="row.icon === ''" :size="50" :src="'https://icon.bqb.cool?url='+row.url" />
                        <el-avatar v-else :size="50" :src="stores.config.port + '/app/'+row.icon" />
                    </template>
                </el-table-column>
                <el-table-column label="应用链接" prop="url">
                    <template #default="{ row }">
                        <a :href="row.url" target="_blank">{{ row.url }}</a>
                    </template>
                </el-table-column>
                <el-table-column label="应用描述" prop="desc" width="300">
                    <template #default="{ row }">
                        <p :title="row.desc" style="
                            /* 最多显示三行 */
                            max-height: 100px;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            display: -webkit-box;
                            -webkit-line-clamp: 3;
                            -webkit-box-orient: vertical;
                        ">{{ row.desc }}</p>
                    </template>
                </el-table-column>
                <el-table-column label="应用标签" prop="tag">
                    <template #default="{ row }">
                        <el-tag v-for="item in row.tag" :key="item" type="primary">{{ item }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="应用分类" prop="category"></el-table-column>
                <el-table-column label="应用海报" prop="placard">
                    <template #default="{ row }">
                        <img v-for="(item, index) in row.placard" :key="index" style="width: 50px; height: 30px; object-fit: cover;" :src="stores.config.port + '/placard/'+item.url" />
                    </template>
                </el-table-column>
                <el-table-column label="掌声" prop="interact">
                    <template #default="{ row }">
                        {{ row.interact.like.length }}
                    </template>
                </el-table-column>
                <el-table-column label="是否推荐" prop="top">
                    <template #default="{ row }">
                        <el-tag v-if="row.top != 0" type="primary">推荐</el-tag>
                        <el-tag v-else type="primary">未推荐</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="应用状态" prop="status">
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
                <el-table-column label="操作" width="88" fixed="right">
                    <template #default="{ row }">
                        <el-button size="small" type="primary" @click="() => {
                            data.form = {
                                visible: true,
                                app_id: row.app_id,
                                title: row.title,
                                url: row.url,
                                top: row.top,
                                icon: row.icon,
                                placard: row.placard,
                                desc: row.desc,
                                category: row.category,
                                status: row.status,
                                tag: row.tag,
                            }
                        }">编辑</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
</template>

<style scoped>
.apps-content h1{
    font-size: 20px;
    color: #333;
    font-weight: 600;
    margin-bottom: 20px;
}
.apps-content{
    width: 100%;
    height: 100%;
    padding: 18px;
    box-sizing: border-box;
    background: #fff;
    border: 1px solid #d9d9d9;
}
.apps-box {
    height: 100%;
    display: flex;
    padding: 18px;
    box-sizing: border-box;
    background: #f5f5f5;
    justify-content: center;
    align-items: center;
}
</style>