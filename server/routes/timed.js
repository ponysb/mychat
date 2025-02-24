// 定时任务
const { User, Room, chatApp, Badge, SignIn, DataStatistics, ChatRecord, chatEmoticon } = require('../models/models');
const { Op, Sequelize } = require('sequelize');
const cron = require('node-cron');
const Router = require('koa-router');
const koaJwt = require('koa-jwt');
const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');

const router = new Router();
const secret = '@5.0.0node_mdex.js:109:16';


// 每天1点执行一次任务
cron.schedule('0 1 * * *', () => {
    getYesterdayActiveCount()
});


// 统计昨天日活函数
async function getYesterdayActiveCount() {
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    // 获取DataStatistics表ip去重后的数量
    const yesterdayActiveCount = await DataStatistics.count({
        where: {
            createdAt: {
                [Op.gte]: yesterday,
                [Op.lt]: dayjs().format('YYYY-MM-DD'),
            },
        },
        distinct: 'ip',
    });

    // 读取../public/data/dau.json 文件中的数据
    const data = fs.readFileSync(path.join(__dirname, '../public/data/dau.json'), 'utf-8');
    const dau = JSON.parse(data);

    dau[dayjs().subtract(1, 'days').format('YYYY-MM-DD')] = {
        active_count: yesterdayActiveCount,
    }
    // 写入../public/data/dau.json 文件
    fs.writeFileSync(path.join(__dirname, '../public/data/dau.json'), JSON.stringify(dau), 'utf-8');
}


// 仪表盘数据获取
router.get('/dashboard', koaJwt({ secret }), async (ctx) => {
    // 获取全部用户数量
    const userCount = await User.count();
    // 获取全部房间数量
    const roomCount = await Room.count();
    // 获取全部聊天记录数量
    const chatRecordCount = await ChatRecord.count();

    // 获取今天创建的房间数量
    const todayRooms = await Room.count({
        where: {
            createdAt: {
                [Op.gte]: dayjs().startOf('day').toISOString(),
                [Op.lt]: dayjs().endOf('day').toISOString(),
            },
        },
    });


    // 获取昨天创建的创建的用户数量
    const yesterdayUsers = await User.count({
        where: {
            createdAt: {
                [Op.gte]: dayjs().subtract(1, 'days').startOf('day').toISOString(),
                [Op.lt]: dayjs().subtract(1, 'days').endOf('day').toISOString(),
            },
        },
    });


    // 获取今天的聊天数量
    const todayChatRecordCount = await ChatRecord.count({
        where: {
            createdAt: {
                [Op.gte]: dayjs().startOf('day').toISOString(),
                [Op.lt]: dayjs().endOf('day').toISOString(),
            },
        },
    });

    // 读取../public/data/dau.json 文件中的数据
    const data = fs.readFileSync(path.join(__dirname, '../public/data/dau.json'), 'utf-8');
    const dau = JSON.parse(data);
    // 获取昨天的活跃用户数量
    let yesterdayActiveCount = 0;
    if(dau[dayjs().subtract(1, 'days').format('YYYY-MM-DD')]){
        yesterdayActiveCount = dau[dayjs().subtract(1, 'days').format('YYYY-MM-DD')].dau;
    }

    // 读取../public/data/peakOnline.json 文件中的数据
    const peakData = fs.readFileSync(path.join(__dirname, '../public/data/peakOnline.json'), 'utf-8');
    const peakOnline = JSON.parse(peakData);
    // 获取峰值在线人数
    const peakOnlineCount = peakOnline[dayjs().format('YYYY-MM-DD')].online;

    // 返回
    ctx.body = {
        code: 0,
        message: '获取仪表盘数据成功',
        data: {
            userCount,  // 全部用户数量
            roomCount,    // 全部房间数量
            chatRecordCount,    // 全部聊天记录数量
            todayRooms,    // 今天创建的房间数量
            yesterdayUsers,    // 昨天创建的创建的用户数量
            todayChatRecordCount,     // 今天的聊天数量
            yesterdayActiveCount,     // 昨天的活跃用户数量
            peakOnlineCount,     // 峰值在线人数
            onlineCount: getOnlineCount(),  // 当前在线用户数量
        },
    };

})


// 仪表盘柱状图数据获取
router.get('/dashboardChart', koaJwt({ secret }), async (ctx) => {
    // 获取dau数据
    const data = fs.readFileSync(path.join(__dirname, '../public/data/dau.json'), 'utf-8');
    const dau = JSON.parse(data);
    // 循环成echart所需格式，取15天的，如果没有则用0代替，只需要一个数组例如[0,0,0,0,0,0,0,0,0,0,0,0,0,0,10],不算今天
    const dauData = [];
    for (let i = 14; i >= 0; i--) {
        const date = dayjs().subtract(i, 'days').format('YYYY-MM-DD');
        if (dau[date]) {
            dauData.push(dau[date].dau);
        } else {
            dauData.push(0);
        }
    }


    // 返回
    ctx.body = {
        code: 0,
        message: '获取仪表盘柱状图数据成功',
        data: dauData,
 
    };
})


// 获取最近100条数据
router.get('/new', koaJwt({ secret }), async (ctx) => {
    const newRooms = await Room.findAll({
        limit: 100,
        order: [['createdAt', 'DESC']],
        raw: true,
    });

    const newApps = await chatApp.findAll({
        limit: 100,
        order: [['createdAt', 'DESC']],
        raw: true,
    });

    ctx.body = {
        code: 0,
        message: '获取最近三天新增的房间成功',
        data: {
            newRooms,
            newApps,
        },
    };
})

// 获取聊天记录各个类型数量
router.get('/chatRecordCount', koaJwt({ secret }), async (ctx) => {
    const chatRecordCount = await ChatRecord.count({
        group: ['type'],
    });

    ctx.body = {
        code: 0,
        message: '获取聊天记录各个类型数量成功',
        data: chatRecordCount,
    };
})

// 获取股东数据
router.get('/shareholder', koaJwt({ secret }), async (ctx) => {
    // 读取../public/data/badge.json 文件中的数据
    const data = fs.readFileSync(path.join(__dirname, '../public/data/badge.json'), 'utf-8');
    const badgeData = JSON.parse(data);

    // 返回
    ctx.body = {
        code: 0,
        message: '获取股东数据成功',
        data: {
            vip: badgeData.vip,
            pro: badgeData.pro,
        },
    };
}) 

// 获取此刻用户在线数函数
function getOnlineCount() {
    // 获取../public/data/users.json 文件中的数据
    const data = fs.readFileSync(path.join(__dirname, '../public/data/users.json'), 'utf-8');
    const onlineUsers = JSON.parse(data);
    // 获取对象数量
    const count = Object.keys(onlineUsers).length;
    return count;
}



// 获取签到数据
router.post('/getSignData', koaJwt({ secret }), async (ctx) => {
    // 根据年月日去重获取聊天记录数量
    const lastChatRecordCount = await ChatRecord.findAll({
        attributes: [
            [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'], // 提取年月日部分
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],     // 计算每个日期的记录数量
        ],
        where: {
            username: ctx.state.user.username,
        },
        group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))], // 按日期分组
        order: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'DESC']], // 按日期降序排列
        raw: true,
    });
    // 查询今天有没有签到
    let today = false;
    for (let i = 0; i < lastChatRecordCount.length; i++) {
        if (lastChatRecordCount[i].date === dayjs().format('YYYY-MM-DD')) {
            today = true;
            break;
        }
    }

    ctx.body = {
        code: 2,
        message: '今天已经签到',
        data: {
            // 今日
            today: true,  // 今日是否签到
            continuous: lastChatRecordCount.length,  // 连续签到天数
        },
    };

})

// 摸鱼数据提交
router.post('/moyuData', koaJwt({ secret }), async (ctx) => {
    const { username, user_id } = ctx.request.body;

    try {
        const user = await User.findOne({
            where: {
                username: username,
            },
            raw: true,
        });

        if (!user) {
            ctx.body = {
                code: 1,
                message: '用户不存在',
            };
            return;
        }

        // 用户账号年龄
        const createdAt = user.createdAt;
        // 计算注册时间截止今天的天数
        const days = dayjs().diff(createdAt, 'days');
        // console.log(`用户 ${username} 注册时间截止今天的天数: ${days}`);

        // 聊天记录条数
        const chatRecordCount = await ChatRecord.count({
            where: {
                username: username,
            },
        });
        // console.log(`用户 ${username} 聊天记录条数: ${chatRecordCount}`);

        // 获取徽章
        const badge = await Badge.findOne({
            where: {
                username: username,
            },
            raw: true,
        });

        // 根据年月日去重获取聊天记录数量
        const lastChatRecordCount = await ChatRecord.findAll({
            attributes: [
                [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'], // 提取年月日部分
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],     // 计算每个日期的记录数量
            ],
            where: {
                username: username,
            },
            group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))], // 按日期分组
            order: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'DESC']], // 按日期降序排列
            raw: true,
        });

        // console.log(lastChatRecordCount)

        let continuousDays = lastChatRecordCount.length;  // 用户连续签到天数


        let checkin = continuousDays // 用户签到天数  100 / 1000
        let messageCount = chatRecordCount // 用户发送消息数量 messageCount / 100000
        let accountAge = days  // 用户注册时间截止今天的天数  accountAge / 10000
        let luckyDraw = (checkin / 1000) + (messageCount / 100000) + (accountAge / 10000) // 奖品概率
        if(luckyDraw > 0.5){
            luckyDraw = 0.5
        }
        let lucky = weightedRandom(luckyDraw); // 千分之一的概率中奖


        if(badge){
            // 如果lucky是true加1，如果是0则不加
            let fish_catch = badge.fish_catch;
            if(lucky){
                fish_catch = badge.fish_catch + 1;
            }
            await Badge.update({
                fish_catch: fish_catch,  // 鱼数量
                online_time: badge.online_time + 10,  // 在线时长
                chat_times: chatRecordCount,  // 聊天次数
                fish_age: days,  // 鱼龄
                badge_name: level(fish_catch),
                sign_in_days: continuousDays,  // 连续签到天数
            }, {
                where: {
                    username: username,
                },
            });
        }else{
            await Badge.create({
                user_id: user_id,
                username: username,
                fish_catch: 0,  // 鱼数量
                online_time: 10,  // 在线时长
                chat_times: chatRecordCount,  // 聊天次数
                fish_age: days,  // 鱼龄
                badge_name: '初级帕鲁',
                sign_in_days: 0,  // 连续签到天数
            });
        }


        ctx.body = {
            code: 0,
            message: '摸鱼数据提交成功',
        };
    } catch (error) {
        console.error('Error submitting moyu data:', error);
        ctx.body = {
            code: -1,
            message: '服务器错误',
        };
    }
});


// 获取徽章数据
router.post('/getBadgeData', koaJwt({ secret }), async (ctx) => {
    const { username } = ctx.request.body;

    try {
        const badge = await Badge.findOne({
            raw: true,
            where: {
                username
            },
            order: [['createdAt', 'DESC']],
        });

        if (!badge) {
            ctx.status = 200;
            ctx.body = {
                code: 200,
                data: {
                    fish_catch: 0,  // 鱼数量
                    online_time: 0,  // 在线时长
                    chat_times: 0,  // 聊天次数
                    fish_age: 0,  // 鱼龄
                    badge_name: 0,  // 徽章名称
                    sign_in_days: 0,  // 连续签到天数
                },
            };
            return;
        }


        ctx.body = {
            code: 0,
            message: '获取徽章数据成功',
            data: {
                fish_catch: badge.fish_catch,  // 鱼数量
                online_time: badge.online_time,  // 在线时长
                chat_times: badge.chat_times,  // 聊天次数
                fish_age: badge.fish_age,  // 鱼龄
                badge_name: badge.badge_name,  // 徽章名称
                sign_in_days: badge.sign_in_days,  // 连续签到天数
            },
        };
    } catch (error) {
        console.error('Error getting badge data:', error);
        ctx.body = {
            code: -1,
            message: '服务器错误',
        };
    }
});


// 成就头衔计算函数
function level(score){
    if (score >= 50000) {
        return '为所欲为'
    } else if (score >= 10000) {
        return '老板克星'
    } else if (score >= 5000) {
        return '打工人之光'
    } else if (score >= 2000) {
        return '整顿职场'
    } else if (score >= 1000) {
        return '职场狂徒'
    } else if (score >= 500) {
        return '无所畏惧'
    } else if (score >= 100) {
        return '逐渐嚣张'
    } else if (score >= 50){
        return '帕鲁觉醒'
    } else {
        return '初级帕鲁'
    }
}


// 获取徽章排行榜按照鱼数量排序
router.post('/getBadgeRank', koaJwt({ secret }), async (ctx) => {
    try {
        const badges = await Badge.findAll({
            raw: true,
            attributes: [
                'username',
                [Sequelize.fn('max', Sequelize.col('fish_catch')), 'fish_catch'],
                [Sequelize.fn('max', Sequelize.col('online_time')), 'online_time'],
                [Sequelize.fn('max', Sequelize.col('chat_times')), 'chat_times'],
                [Sequelize.fn('max', Sequelize.col('sign_in_days')), 'sign_in_days'],
                [Sequelize.fn('max', Sequelize.col('fish_age')), 'fish_age'],
                [Sequelize.fn('max', Sequelize.col('badge_name')), 'badge_name']
            ],
            group: ['username'],
            order: [[Sequelize.col('fish_catch'), 'DESC']],
        });
        

        ctx.body = {
            code: 0,
            message: '获取徽章排行榜成功',
            data: badges,
        };
    } catch (error) {
        console.error('Error getting badge rank:', error);
        ctx.body = {
            code: -1,
            message: '服务器错误',
        };
    }
});

// 获取股东列表
router.post('/getShareholderList', koaJwt({ secret }), async (ctx) => {
    // 读取../public/data/shareholder.json 文件中的数据
    const shareholderData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/stockholder.json'), 'utf-8'));

    ctx.body = {
        code: 0,
        message: '获取股东列表成功',
        data: shareholderData,
    };
})



// 抽奖随机函数
function weightedRandom(probability) {
    if (probability < 0 || probability > 1) {
        throw new Error('Probability must be between 0 and 1');
    }

    // 生成一个随机数，如果小于概率值则中奖
    return Math.random() < probability;
}
module.exports = router;
