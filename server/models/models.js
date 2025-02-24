const { DataTypes, JSONB } = require('sequelize');
const { sequelize } = require('../db/database');
require('dotenv').config(); // 引入dotenv来加载.env文件中的环境变量

// 用户模型
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {  // 用户ID不作为显示的内部id
        type: DataTypes.STRING(255),
        allowNull: false
    },
    username:{  // 用户名,用作账号id
        type: DataTypes.STRING(255),
        allowNull: false
    },
    nickname: {  // 昵称
        type: DataTypes.STRING(255),
        allowNull: true
    },
    gender: {  // 性别
        type: DataTypes.INTEGER,
        allowNull: true
    },
    password: {  // 密码
        type: DataTypes.STRING(255),
        allowNull: true
    },
    email: {  // 邮箱
        type: DataTypes.STRING(255),
        allowNull: true
    },
    phone: {  // 手机号
        type: DataTypes.STRING(255),
        allowNull: true
    },
    avatar: {  // 用户头像
        type: DataTypes.STRING(255),
        allowNull: true
    },
    rooms: {  // 用户所在群组
        type: DataTypes.JSONB,
        allowNull: true
    },
    friends: {  // 用户的好友列表
        type: DataTypes.JSONB,
        allowNull: true
    },
    token: {  // 用户登录token
        type: DataTypes.STRING(255),
        allowNull: true
    },
    token_create_time: {  //token创建时间
        type: DataTypes.DATE,
        allowNull: true,
    },
    ip: {  // 用户登录ip
        type: DataTypes.STRING(255),
        allowNull: true
    },
    status: {  // 用户状态 1正常  2禁用  3删除
        type: DataTypes.INTEGER,
        allowNull: false
    },
    signature: {  // 签名
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    badge:{  // 成就徽章
        type: DataTypes.JSONB,
        allowNull: true,
    },
    invite: {  // 邀请码
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    other: {  // 冗余字段
        type: DataTypes.JSONB,
        allowNull: true,
    },
}, {
    schema: process.env.MODE_NAME,
    tableName: 'users'
});


// 房间模型
const Room = sequelize.define('Room', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    room_id: {  // 房间ID
        type: DataTypes.STRING(255),
        allowNull: false
    },
    name: {  // 房间名称
        type: DataTypes.STRING(255),
        allowNull: false
    },
    owner_id: {  // 房主ID
        type: DataTypes.STRING(255),
        allowNull: false
    },
    avatar: {// 头像
        type: DataTypes.STRING(255),
        allowNull: true
    },
    desc: {  // 简介
        type: DataTypes.STRING(255),
        allowNull: true
    },
    type: {   // 房间类型 1-公开 2-应用房间
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tags: {  // 房间标签、关键词
        type: DataTypes.STRING(255),
        allowNull: true
    },
    background: {   // 房间背景图
        type: DataTypes.STRING(255),
        allowNull: true
    },
    announcement: {  // 房间公告
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: []
    },
    badges: {  // 房间徽章
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: []
    },
    users: {  // 房间成员
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: []
    },
    interior_status: {// 房间内部状态，全体禁言，禁止搜索，禁止进入等
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: []
    },
    status: {  // 房间状态 1-正常 2-封禁 3-删除
        type: DataTypes.INTEGER,
        allowNull: false
    },
    apps: {  // 房间应用  {"app_id", "introduce", "sort", "createdAt", "interact"}
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: []
    },
    other: {  // 冗余字段
        type: DataTypes.JSONB,
        allowNull: true,
    },
}, {
    schema: process.env.MODE_NAME,
    tableName: 'rooms'
});


// 聊天记录模型
const ChatRecord = sequelize.define('ChatRecord', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    msg_id: {  // 消息ID
        type: DataTypes.STRING(255),
        allowNull: false
    },
    room_id: {  // 房间ID
        type: DataTypes.STRING(255),
        allowNull: false
    },
    user_id: {  // 用户ID
        type: DataTypes.STRING(255),
        allowNull: true
    },
    username: {  // 用户名
        type: DataTypes.STRING(255),
        allowNull: true
    },
    nickname: {  // 用户昵称
        type: DataTypes.STRING(255),
        allowNull: false
    },
    type: {  //bqb是表情包，app是链接或应用，img是自定义图片，txt是文本消息，file是文件消息，sys是系统消息，custom是自定义消息，voice是语音消息，video是视频消息，location是位置消息
        type: DataTypes.STRING(255),
        allowNull: false
    },
    msg: {  // 聊天内容,消息内容经过敏感词替换过滤展示在客户端上的字段
        type: DataTypes.STRING(255),
        allowNull: true
    },
    ymsg: {  // 聊天内容,消息内容不经过敏感词替换过滤展示在客户端上的字段
        type: DataTypes.STRING(255),
        allowNull: true
    },
    json_msg: {  // 多媒体消息的json数据
        type: DataTypes.JSONB,
        allowNull: true
    },
    ip: {  // 用户ip
        type: DataTypes.STRING(255),
        allowNull: true
    },
    source: {  // 消息来源
        type: DataTypes.STRING(255),
        allowNull: false
    },
    interact:{  //互动 {like:'点赞量',winnow:'精选'}
        type: DataTypes.JSONB,
        allowNull: true,
    },
    status: {  // 聊天状态 1-正常 2-撤回 3-删除
        type: DataTypes.INTEGER,
        allowNull: false
    },
    other: {  // 冗余字段
        type: DataTypes.JSONB,
        allowNull: true,
    },
}, {
    schema: process.env.MODE_NAME,
    tableName: 'chat_records'
});



//app表
const chatApp = sequelize.define('chatApp', {
    id: {  //自增数据库id
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    app_id:{    //应用id
        type: DataTypes.STRING,
        allowNull: true,
    },
    user_id: {  //用户id
        type: DataTypes.STRING,
        allowNull: true,
    },
    username: {  // 用户名
        type: DataTypes.STRING,
        allowNull: true
    },
    room_id: {  //关联房间id
        type: DataTypes.STRING,
        allowNull: true,
    },
    type:{    //应用类型  目前只有web类型
        type: DataTypes.STRING,
        allowNull: true,
    },
    url:{    //应用链接
        type: DataTypes.STRING,
        allowNull: true,
    },
    title:{    //应用名称
        type: DataTypes.STRING,
        allowNull: true,
    },
    icon:{    //应用图标
        type: DataTypes.STRING,
        allowNull: true,
    },
    desc: {   //应用描述
        type: DataTypes.STRING,
        allowNull: true,
    },
    source:{  //应用一级域名链接比如https://www.xxx.com，不带参数的链接
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {  //0待审核  1为开通，2为封禁，3为删除
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    sort:{  //排序 
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    interact:{  //互动 {see:'浏览量',like:'点赞量',comment:'评论量',share:'分享量'}
        type: DataTypes.JSONB,
        allowNull: true,
    },
    category:{  //应用分类
        type: DataTypes.STRING,
        allowNull: true,
    },
    tag:{  //应用标签数组
        type: DataTypes.JSONB,
        allowNull: true,
    },
    placard:{  //应用宣传海报
        type: DataTypes.JSONB,
        allowNull: true,
    },
    top:{  //置顶
        type: DataTypes.INTEGER,
        allowNull: true,
    }
},{
    schema: process.env.MODE_NAME,
    tableName: 'chat_apps'
})


// app评论模型
const chatAppComment = sequelize.define('chatAppComment', {
    id: {  //自增数据库id
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    comment_id:{    //评论id
        type: DataTypes.STRING,
        allowNull: true,
    },
    app_id: {  // 应用id
        type: DataTypes.STRING,
        allowNull: true,
    },
    user_id: {  //用户id
        type: DataTypes.STRING,
        allowNull: true,
    },
    username: {  // 用户名
        type: DataTypes.STRING,
        allowNull: true
    },
    content: {  //评论内容
        type: DataTypes.STRING,
        allowNull: true
    },
    ip: {  // 用户ip
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ''
    },
    status: {  // 评论状态 1-正常 2-删除
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    interact:{  //互动 {喜欢：like:[]}
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {like:[]}
    },
    children: {  // 回复二级评论
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: []
    },
},{
    schema: process.env.MODE_NAME,
    tableName: 'chat_app_comments'
})


// 表情包库
const chatEmoticon = sequelize.define('chatEmoticon', {
    id: {  //自增数据库id
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    emoticon_id:{    //表情包id
        type: DataTypes.STRING,
        allowNull: true,
    },
    user_id: {  //用户id谁上传的
        type: DataTypes.STRING,
        allowNull: true,
    },
    room_id: {  //关联房间id，专属表情包使用这个id
        type: DataTypes.STRING,
        allowNull: true,
    },
    type:{    //表情包类型  系统表情包sys，用户表情包user，聊天室专属表情包room
        type: DataTypes.STRING,
        allowNull: true,
    },
    url:{    //表情包链接
        type: DataTypes.STRING,
        allowNull: true,
    },
    category:{  //表情包分类
        type: DataTypes.STRING,
        allowNull: true,
    },
    title:{    //表情包名称
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {  //1为正常，2为封禁，3为删除
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    sort:{  //排序
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    interact:{  //互动 {see:'浏览量',like:'点赞量',comment:'评论量',share:'分享量'}
        type: DataTypes.JSONB,
        allowNull: true,
    },
},{
    schema: process.env.MODE_NAME,
    tableName: 'chat_emoticons'
})



// 举报模型
const chatReport = sequelize.define('chatReport', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    report_id: {  //举报ID
        type: DataTypes.STRING(255),
        allowNull: false
    },
    user_id: {  // 用户ID
        type: DataTypes.STRING(255),
        allowNull: true
    },
    username: {  // 用户名
        type: DataTypes.STRING(255),
        allowNull: true
    },
    affair_id: {  // 事件id，如果type是chatMsg，则是消息id，如果type是room，则是房间id，如果type是chatApp，则是应用id，如果type是chatEmoticon，则是表情包id
        type: DataTypes.STRING(255),
        allowNull: false
    },
    type: {  //举报类型 chatMsg:聊天记录, room:房间, chatApp:聊天应用, chatEmoticon:聊天表情包
        type: DataTypes.STRING(255),
        allowNull: false
    },
    reason: {  //举报原因
        type: DataTypes.STRING(255),
        allowNull: false
    },
    content: {  //举报内容
        type: DataTypes.STRING(255),
        allowNull: true
    },
    ip: {  // 用户ip
        type: DataTypes.STRING(255),
        allowNull: true
    },
    status: {  // 举报状态 1-待审核 2-已处理 3-已忽略
        type: DataTypes.INTEGER,
        allowNull: false
    },
}, {
    schema: process.env.MODE_NAME,
    tableName: 'chat_reports'
});


// 订单表
const chatOrder = sequelize.define('chatOrder', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {  //订单ID
        type: DataTypes.STRING(255),
        allowNull: false
    },
    user_id: {  // 用户ID
        type: DataTypes.STRING(255),
        allowNull: true
    },
    username: {  // 用户名
        type: DataTypes.STRING(255),
        allowNull: true
    },
    goods: {  // 商品信息
        type: DataTypes.STRING(255),
        allowNull: false
    },
    price: {  //订单价格
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {  //订单状态 0-待支付 1-已支付 2-已取消
        type: DataTypes.INTEGER,
        allowNull: false
    },
    QRcode_url: {  // 支付二维码
        type: DataTypes.STRING(255),
        allowNull: true
    },
    code_url: {  // 支付链接
        type: DataTypes.STRING(255),
        allowNull: true
    },
    other: {  // 冗余字段
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    },
}, {
    schema: process.env.MODE_NAME,
    tableName: 'chat_orders'
});


// 后台用户模型
const AdminUser = sequelize.define('AdminUser', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {  // 用户ID
        type: DataTypes.STRING(255),
        allowNull: false
    },
    username: {  // 用户名
        type: DataTypes.STRING(255),
        allowNull: false
    },
    password: {  // 密码
        type: DataTypes.STRING(255),
        allowNull: false
    },
    name: {  // 姓名
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: ''
    },
    email: {  // 邮箱
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: ''
    },
    phone: {  // 手机号
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: ''
    },
    status: {  // 状态 1-正常 2-禁用 3-删除
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    other: {  // 冗余字段
        type: DataTypes.JSONB,
        allowNull: true,
    },
}, {
    schema: process.env.MODE_NAME,
    tableName: 'admin_users'
});


// 反馈模型
const Feedback = sequelize.define('Feedback', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    feedback_id: {  //反馈ID
        type: DataTypes.STRING(255),
        allowNull: false
    },
    user_id: {  // 用户ID
        type: DataTypes.STRING(255),
        allowNull: true
    },
    username: {  // 用户名
        type: DataTypes.STRING(255),
        allowNull: true
    },
    content: {  //反馈内容
        type: DataTypes.STRING(255),
        allowNull: false
    },
    type: {  //反馈类型 用户体验，bug，功能建议，有意思的功能，吐槽，其他
        type: DataTypes.STRING(255),
        allowNull: false
    },
    status: {  // 状态 1-待审核 2-已处理 3-已忽略
        type: DataTypes.INTEGER,
        allowNull: false
    },
    other: {  // 冗余字段
        type: DataTypes.JSONB,
        allowNull: true,
    },
}, {
    schema: process.env.MODE_NAME,
    tableName: 'feedbacks'
});


// 数据统计模型
const DataStatistics = sequelize.define('DataStatistics', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {  // 用户ID
        type: DataTypes.STRING(255),
        allowNull: true
    },
    username: {  // 用户名
        type: DataTypes.STRING(255),
        allowNull: true
    },
    ip: {  // 用户ip
        type: DataTypes.STRING(255),
        allowNull: true
    },
    geo: {  // 用户地理位置
        type: DataTypes.STRING(255),
        allowNull: true
    },
    ua: {  // 用户ua
        type: DataTypes.STRING(255),
        allowNull: true
    },
    referer: {  // 页面来源
        type: DataTypes.STRING(255),
        allowNull: true
    },
    user_agent: {  // 用户浏览器信息
        type: DataTypes.JSONB,
        allowNull: true
    }
}, {
    schema: process.env.MODE_NAME,
    tableName: 'data_statistics'
});


// 签到模型
const SignIn = sequelize.define('SignIn', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {  // 用户ID
        type: DataTypes.STRING(255),
        allowNull: true
    },
    username: {  // 用户名
        type: DataTypes.STRING(255),        
        allowNull: true
    },
    sign_in_days: {  // 连续签到天数
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    sign_in_score: {  // 签到积分
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    other: {  // 冗余字段
        type: DataTypes.JSONB,
        allowNull: true,
    },
}, {
    schema: process.env.MODE_NAME,
    tableName:'sign_ins'
});


// 徽章模型
const Badge = sequelize.define('Badge', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {  // 用户ID
        type: DataTypes.STRING(255),
        allowNull: true
    },
    username: {  // 用户名
        type: DataTypes.STRING(255),
        allowNull: true
    },
    badge_name: {  // 徽章ID
        type: DataTypes.STRING(255),
        allowNull: false
    },
    fish_catch: {    // 捕获的鱼
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    online_time: {    // 在线时长
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    chat_times: {    // 聊天次数
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    fish_age: {    // 摸鱼年龄
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    sign_in_days: {    // 连续签到天数
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    other: {  // 冗余字段
        type: DataTypes.JSONB,
        allowNull: true,
    },
}, {
    schema: process.env.MODE_NAME,
    tableName: 'badges'
});


const initializeDatabase = async () => {
    try {
        console.log('正在同步数据库...');
        await sequelize.sync({ alter: true }); // 或者使用 { force: true } 强制更新所有表结构慎用会清空数据库
        console.log('数据库同步完成！');
    } catch (error) {
        console.error('同步数据库时出错:', error);
        throw error;  // 如果出错，抛出异常阻止服务器启动
    }
};


module.exports = {
    User,
    Room,
    ChatRecord,
    chatApp,
    chatEmoticon,
    chatReport,
    chatAppComment,
    chatOrder,
    AdminUser,
    Feedback,
    DataStatistics,
    SignIn,
    Badge,
    initializeDatabase
};
