<script setup>
import { ref, reactive, onMounted } from 'vue';
import VueECharts from 'vue-echarts';
import { useMainStore } from "../../../store/index";
const stores = useMainStore();
import * as echarts from 'echarts';
import axios from 'axios';

const data = reactive({
    // 柱状图
    barOption: {
        grid: {
            top: '10%',   // 上边距
            right: '50px', // 右边距
            bottom: '10%', // 下边距
            left: '50px'    // 左边距
        },
        xAxis: {
            margin: 0,
            type: 'category',
            data: getDateArray()
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                data: [10,50],
                type: 'bar'
            }
        ]
    },

    // 饼图
    roseOption: {
        title: {
            show: false,
            left: 'center'
        },
        tooltip: {
            trigger: 'item'
        },
        legend: {
            show: false,
            orient: 'vertical',
            left: 'left'
        },
        series: [
            {
                name: 'Access From',
                type: 'pie',
                radius: '68%',
                data: [
                    { value: 10487, name: 'Search Engine' },
                    { value: 7356, name: 'Direct' },
                    { value: 5821, name: 'Email' },
                ],
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }
        ]
    },

    pro:[],
    vip:[],

    // 新增应用
    newAppOption: [],

    // 新增房间
    newRoomOption: [],

    userCount: 0,    // 全部用户数量
    roomCount: 0,    // 全部房间数量
    chatRecordCount: 0,    // 全部聊天记录数量
    todayRooms: 0,    // 今天创建的房间数量
    yesterdayUsers: 0,    // 昨天创建的创建的用户数量
    todayChatRecordCount: 0,    // 今天的聊天数量
    yesterdayActiveCount: 0,     // 昨天的活跃用户数量
    peakOnlineCount: 0,     // 峰值在线人数
    onlineCount: 0,   // 当前在线人数

    userAvatar: [],
})

onMounted(() => {
    getDashboardData()
    getBarData()
    getRecentData()
    getChatRecordCount()
    getProData()
    getUserAvatar()
})


// 从今天开始往前推15天日期生成数组给echarts ,顺序推反了
function getDateArray() {

    let dateArray = [];
    let today = new Date();
    for (let i = 14; i >= 0; i--) {
        let date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        let month = date.getMonth() + 1;
        let day = date.getDate();
        if (month < 10) {
            month = '0' + month;
        }
        if (day < 10) {
            day = '0' + day;
        }
        dateArray.push(month + '-' + day);
    }
    return dateArray;
}


// 获取仪表盘数据
function getDashboardData() {
    axios.get(stores.config.port + '/api/v1/timed/dashboard', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+localStorage.getItem('adminToken')
        }
    }).then(res => {
        data.userCount = res.data.data.userCount;
        data.roomCount = res.data.data.roomCount;
        data.chatRecordCount = res.data.data.chatRecordCount;
        data.todayRooms = res.data.data.todayRooms;
        data.yesterdayUsers = res.data.data.yesterdayUsers;
        data.todayChatRecordCount = res.data.data.todayChatRecordCount;
        data.yesterdayActiveCount = res.data.data.yesterdayActiveCount;
        data.peakOnlineCount = res.data.data.peakOnlineCount;
        data.onlineCount = res.data.data.onlineCount;
    })
}


// 仪表盘柱状图数据获取
function getBarData() {
    axios.get(stores.config.port + '/api/v1/timed/dashboardChart', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+localStorage.getItem('adminToken')
        }
    }).then(res => {
        data.barOption.series[0].data = res.data.data;
    })
}


// 获取最近100条数据
function getRecentData() {
    axios.get(stores.config.port + '/api/v1/timed/new',{
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+localStorage.getItem('adminToken')
        }
    }).then(res => {
        data.newAppOption = res.data.data.newApps;
        data.newRoomOption = res.data.data.newRooms;
    })
}

// 获取聊天记录各个类型数量
function getChatRecordCount() {
    axios.get(stores.config.port + '/api/v1/timed/chatRecordCount', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+localStorage.getItem('adminToken')
        }
    }).then(res => {
        // count改成value，type改成name
        data.roseOption.series[0].data = res.data.data.map(item => {
            return { value: item.count, name: item.type }
        })
        // console(data.roseOption.series[0].data)
        data.roseOption.series[0].data = res.data.data;
    })
}


// 获取用户头像数据
function getUserAvatar() {
    axios.get(stores.config.port + '/api/v1/admin/userAvatars', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+localStorage.getItem('adminToken')
        }
    }).then(res => {
        data.userAvatar = Object.values(res.data.data)
    })
}

// 设为违规
function setAvatarIllegal(avatar) {
    let username = avatar.split('.')[0]
    axios({
        method: 'POST',
        url: stores.config.port + '/api/v1/admin/avatarIllegal',
        data: {
            username: username,
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    })
    .then(res => {
        console.log(res.data)
        ElMessage({
            message: '头像已设为违规，刷新查看效果',
            type: 'success',
        })
    })
    .catch(err => {
        console.log(err)
        ElMessage({
            message: err.response.data.message,
            type: 'error',
        })
    })
}


// 获取股东数据
function getProData() {
    axios.get(stores.config.port + '/api/v1/timed/shareholder', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+localStorage.getItem('adminToken')
        }
    }).then(res => {
        // console.log(res.data.data)
        data.pro = res.data.data.pro.split('|');
        data.vip = res.data.data.vip.split('|');
    })
}

const chart = ref(null)

</script>

<template>
    <div class="dashboard-box">
        <div class="dashboard-left">
            <ul>
                <li>
                    <span>😀</span>
                    <div>
                        <h3>今日峰值在线用户</h3>
                        <div class="month-active">
                            <h1>{{ data.peakOnlineCount }}</h1>
                            <p>此刻：{{data.onlineCount}}</p>
                        </div>
                    </div>
                </li>
                <li>
                    <span>🥳</span>
                    <div>
                        <h3>日活跃用户</h3>
                        <h1>{{ data.yesterdayActiveCount }}</h1>
                    </div>
                </li>
                <li>
                    <span>🧐</span>
                    <div>
                        <h3>总用户统计</h3>
                        <div class="month-active">
                            <h1>{{ data.userCount }}</h1>
                            <div>
                                <p>昨日：{{ data.todayUsers }}</p>
                            </div>
                        
                        </div>
                    </div>
                </li>
                <li>
                    <span>🏠️</span>
                    <div>
                        <h3>房间统计</h3>
                        <div class="month-active">
                            <h1>{{ data.roomCount }}</h1>
                            <p>今日：{{ data.todayRooms }}</p>
                        </div>
                    </div>
                </li>
                <li>
                    <span>✉️</span>
                    <div>
                        <h3>聊天统计</h3>
                        <div class="month-active">
                            <h1>{{ data.chatRecordCount }}</h1>
                            <p>今日：{{ data.todayChatRecordCount }}</p>
                        </div>
                    </div>
                </li>
            </ul>

            <VueECharts ref="chart" style="height: 380px; width: 100%; background: #f5f5f5; margin-bottom: 16px; margin-top: 16px;" :option="data.barOption" />

            <div class="table-box">
                <div class="table-content">
                    <h1>新增房间</h1>
                    <el-table :data="data.newRoomOption" style="width: 100%;">
                        <el-table-column prop="name" label="房间名" width="180" />
                        <el-table-column prop="desc" label="介绍" width="180" />
                        <el-table-column prop="createdAt" label="创建时间">
                            <template #default="{ row }">
                                {{ stores.formatDate(row.createdAt) }}
                            </template>
                        </el-table-column>
                    </el-table>
                </div>

                <div class="table-content">
                    <h1>新增应用</h1>
                    <el-table :data="data.newAppOption" style="width: 100%">
                        <el-table-column prop="title" label="名称" width="180" />
                        <el-table-column prop="desc" label="介绍" width="180" />
                        <el-table-column prop="createdAt" label="创建时间">
                            <template #default="{ row }">
                                {{ stores.formatDate(row.createdAt) }}
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>
        </div>

        <div class="dashboard-right">
            <div class="dashboard-right-top">
                <h1>股东统计</h1>
                <div class="month-active">
                    <!-- 分割成数组 -->
                    <h3>超级股东：{{ data.vip.length }}</h3>
                    <h3>摸鱼股东：{{data.pro.length }}</h3>
                </div>
            </div>
            <VueECharts ref="chart" style="height: 260px; width: 100%; background: #f5f5f5; border-radius: 6px; margin-bottom: 16px;" :option="data.roseOption" />
            <div class="quick-review">
                <h1>头像快速审核</h1>
                <ul>
                    <li v-for="(item, index) in data.userAvatar" :key="index">
                        <img :src="stores.config.port + '/api/v1/users/getUserAvatar/'+item" alt="">
                        <div>
                            <h3>{{ item }}</h3>
                            <el-button @click="setAvatarIllegal(item)" style="margin-top: 6px;" type="primary" size="small">设为违规</el-button>
                        </div>
                    </li>
                    <i></i>
                    <i></i>
                    <i></i>
                </ul>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dashboard-right-top h3:last-child{
    color: #eb2c2c;
}
.dashboard-right-top h3:first-child{
    color: #cb8640;
}
.dashboard-right-top h3{
    font-size: 14px;
}
.dashboard-right-top h1{
    font-size: 16px;
    font-weight: 600;
    color: #414141;
    margin-bottom: 16px;
}
.dashboard-right-top{
    height: 88px;
    background: #f5f5f5;
    margin-bottom: 16px;
    padding: 20px;
    border-radius: 6px;
    box-sizing: border-box;
}
.quick-review li h3{
    font-size: 12px;
    /* 超出一行省略号 */
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
}
.quick-review i{
    width: 68px;
}
.quick-review img{
    width: 68px;
    height: 68px;
    border-radius: 10px;
    object-fit: cover;
}
.quick-review li{
    width: 68px;
    text-align: center;
    margin-bottom: 16px;
}
.quick-review h1{
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 16px;
}
.quick-review ul{
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
}
.quick-review{
    height: calc(100% - 380px);
    width: 100%;
    background: #f5f5f5;
    border-radius: 6px;
    padding: 16px;
    box-sizing: border-box;
    overflow: auto;
}
.table-content h1{
    font-size: 18px;
    font-weight: 600;
    color: #414141;
    margin-bottom: 16px;
}
.table-content{
    width: 49.3%;
}
.table-box{
    height: 320px;
    padding: 16px;
    box-sizing: border-box;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    background: #f5f5f5;
    overflow: auto;
}
.month-active{
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.dashboard-left ul li p{
    margin-top: 16px;
    font-size: 13px;
    color: #11a919;
    margin-left: 20px;
}
.dashboard-left ul li h1{
    font-size: 26px;
    margin-top: 16px;
    color: #333;
    font-weight: 600;
}
.dashboard-left ul li h3{
    font-size: 15px;
    color: #99999b;
}
.dashboard-left ul li span{
    width: 38px;
    height: 38px;
    padding: 6px;
    background: #e2e2e2;
    border-radius: 50px;
    margin-right: 16px;
    font-size: 28px;
    text-align: center;
    line-height: 38px;
}
.dashboard-left ul li{
    width: 19%;
    height: 120px;
    background: #f5f5f5;
    border-radius: 6px;
    padding: 24px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
}
.dashboard-left ul{
    display: flex;
    justify-content: space-between;
}
.dashboard-right{
    width: 300px;
    height: 100%;
    padding: 18px;
    box-sizing: border-box;
    background: #fff;
    border: 1px solid #d9d9d9;
}
.dashboard-left{
    width: calc(100% - 320px);
    height: 100%;
    padding: 18px;
    box-sizing: border-box;
    background: #fff;
    border: 1px solid #d9d9d9;
}
.dashboard-box {
    height: 100%;
    display: flex;
    padding: 18px;
    box-sizing: border-box;
    background: #f5f5f5;
    justify-content: space-between;
    align-items: center;
}
</style>