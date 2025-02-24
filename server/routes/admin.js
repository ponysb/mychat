const { User, Room, chatOrder,chatReport, Feedback, ChatRecord, AdminUser, chatAppComment, chatEmoticon, chatApp } = require('../models/models');
const { Op, Sequelize, where } = require('sequelize');
const Router = require('koa-router');
const Joi = require('joi');
const { customAlphabet } = require('nanoid');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const koaJwt = require('koa-jwt');
const koaBody = require('koa-body').default;
const sha256 = require("crypto-js/sha256");
const dayjs = require('dayjs');
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone"); // dependent on utc plugin

const router = new Router();
const secret = '@5.0.0node_mdex.js:109:16';
const nanoidNode = '1234567890abcdefghijklmnopqrstuvwxyz';

// 登录
router.post('/login', async (ctx) => {
    const { username, password } = ctx.request.body;
    const schema = Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required(),
    });

    const { error } = schema.validate({ username, password });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        const user = await AdminUser.findOne({
            where: {
                username,
                password,
            },
        });
    
        if (!user) {
            ctx.status = 401;
            ctx.body = { message: '用户名或密码错误' };
            return;
        }
        const token = jwt.sign({ user_id: user.user_id, username: user.username, token: 'TOKEN_' + customAlphabet(nanoidNode, 10)() }, secret, { expiresIn: '1w' });
        
        ctx.body = { data:{ user, token }, message: '登录成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});

// 注册
router.post('/register', async (ctx) => {
    const { username, password, name } = ctx.request.body;
    const schema = Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required(),
        name: Joi.string().required(),
    });

    const { error } = schema.validate({ username, password, name });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }
  
    try {
        const user = await AdminUser.findOne({
            where: {
                username,
            },
        });
        if (user) {
            ctx.status = 400;
            ctx.body = { message: '用户名已存在' };
            return;
        }
        const newUser = await AdminUser.create({
            user_id: 'admin_' + customAlphabet(nanoidNode, 10)(),
            username,
            password,
            name,
        });
        ctx.body = { newUser , message: '注册成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});

// 获取用户列表
router.get('/users', koaJwt({ secret }), async (ctx) => {
    try {
        const users = await AdminUser.findAll();
        ctx.body = { data: users, message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});

// 修改状态
router.post('/changeStatus', koaJwt({ secret }), async (ctx) => {
    const { username, status } = ctx.request.body;
    const schema = Joi.object({
        username: Joi.string().required(),
        status: Joi.number().required(),
    });

    const { error } = schema.validate({ username, status });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        const user = await AdminUser.findOne({
            where: {
                username,
            },
        });
        if (!user) {
            ctx.status = 400;
            ctx.body = { message: '用户不存在' };
            return;
        }
        await user.update({
            status,
        });
        ctx.body = { message: '修改成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});

// 重置密码
router.post('/resetPassword', koaJwt({ secret }), async (ctx) => {
    const { username, password } = ctx.request.body;
    const schema = Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required(),
    });

    const { error } = schema.validate({ username, password });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        const user = await AdminUser.findOne({
            where: {
                username,
            },
        });
        if (!user) {
            ctx.status = 400;
            ctx.body = { message: '用户名不存在' };
            return;
        }
        await user.update({
            password,
        });
        ctx.body = { message: '密码修改成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});

// 支付设置获取
router.get('/payment', koaJwt({ secret }), async (ctx) => {
    try {
        const data = fs.readFileSync(path.join(__dirname, '../public/data/payment.json'), 'utf-8');
        ctx.body = { data: JSON.parse(data), message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});


// 支付设置更新
router.post('/payment', koaJwt({ secret }),async (ctx) => {
    const { mch_id, developer_appid } = ctx.request.body;
    const schema = Joi.object({
        mch_id: Joi.string().required(),
        developer_appid: Joi.string().required(),
    });

    const { error } = schema.validate({ mch_id, developer_appid });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        fs.writeFileSync(path.join(__dirname, '../public/data/payment.json'), JSON.stringify({ mch_id, developer_appid }));
        ctx.body = { message: '更新成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});

// 商品设置获取
router.get('/goods', koaJwt({ secret }), async (ctx) => {
    try {
        const data = fs.readFileSync(path.join(__dirname, '../public/data/goods.json'), 'utf-8');
        ctx.body = { data: JSON.parse(data), message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});

// 商品设置更新
router.post('/goods', koaJwt({ secret }), async (ctx) => {
    const { vip, pro } = ctx.request.body;
    const schema = Joi.object({
        vip: Joi.number().required(),
        pro: Joi.number().required(),
    });

    const { error } = schema.validate({ vip, pro });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        fs.writeFileSync(path.join(__dirname, '../public/data/goods.json'), JSON.stringify({ vip, pro }));
        ctx.body = { message: '更新成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});



// 获取当前在线用户
router.get('/onlineCount', koaJwt({ secret }), async (ctx) => {
    try {
        // 获取../public/data/users.json 文件中的数据
        const data = fs.readFileSync(path.join(__dirname, '../public/data/users.json'), 'utf-8');
        const onlineUsers = JSON.parse(data);
        // 获取对象数量
        const count = Object.keys(onlineUsers).length;

        ctx.body = { data: count, message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});

// 获取敏感词列表
router.get('/sensitiveWords', koaJwt({ secret }), async (ctx) => {
    try {
        // 获取../public/data/words.json 文件中的数据
        const data = fs.readFileSync(path.join(__dirname, '../public/data/words.json'), 'utf-8');
        ctx.body = { data: JSON.parse(data), message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});

// 编辑敏感词
router.post('/addSensitiveWord', koaJwt({ secret }), async (ctx) => {
    const { words } = ctx.request.body;
    const schema = Joi.object({
        words: Joi.array().required(),
    });

    const { error } = schema.validate({ words });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        fs.writeFileSync(path.join(__dirname, '../public/data/words.json'), JSON.stringify(words));
        ctx.body = { message: '添加成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});

// 获取房间列表
router.post('/rooms', koaJwt({ secret }), async (ctx) => {
    const { room_id, name, owner_id, createdAt } = ctx.request.body;
    try {

        // 构建查询条件对象
        const searchConditions = {};
        if (room_id&&room_id != '') {
            searchConditions.room_id = { [Op.eq]: room_id };
        }
        if (name&&name != '') {
            searchConditions.name = { [Op.like]: `%${name}%` };
        }
        if (owner_id&&owner_id != '') {
            searchConditions.owner_id = { [Op.eq]: owner_id };
        }
        if (createdAt&&createdAt.length > 0) {
            searchConditions.createdAt = { [Op.between]: [new Date(createdAt[0]), new Date(createdAt[1])] };
        }

        // 查询房间列表
        const rooms = await Room.findAll({
            where: searchConditions,
            order: [['createdAt', 'DESC']],
        });
        ctx.body = { data: rooms, message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});


// 修改房间信息
router.post('/editRoom', koaJwt({ secret }), async (ctx) => {
    const { room_id, name, desc, status } = ctx.request.body;
    const schema = Joi.object({
        room_id: Joi.string().required(),
        name: Joi.string().required(),
        desc: Joi.string().required(),
        status: Joi.number().required(),
    });

    const { error } = schema.validate({ room_id, name, desc, status });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        const room = await Room.findOne({
            where: {
                room_id,
            },
        });
        if (!room) {
            ctx.status = 400;
            ctx.body = { message: '房间不存在' };
            return;
        }
        await room.update({
            name,
            desc,
            status,
        });
        ctx.body = { message: '修改成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});


// 恢复房间头像为默认头像
router.post('/restoreRoomAvatar', koaJwt({ secret }), async (ctx) => {
    const { room_id } = ctx.request.body;
    const schema = Joi.object({
        room_id: Joi.string().required(),
    });

    const { error } = schema.validate({ room_id });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        const room = await Room.findOne({
            where: {
                room_id,
            },
        });
        if (!room) {
            ctx.status = 400;
            ctx.body = { message: '房间不存在' };
            return;
        }
        await room.update({
            avatar: 'default.jpg',
        });
        ctx.body = { message: '恢复成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});


// 恢复房间头像为默认头像集体审核
router.post('/restoreRoomAvatarGroup', koaJwt({ secret }), async (ctx) => {
    const { avatar } = ctx.request.body;
    const schema = Joi.object({
        avatar: Joi.string().required(),
    });

    const { error } = schema.validate({ avatar });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        // 更新
        await Room.update({
            avatar: 'default.jpg'
        }, {
            where: {
                avatar
            },
        });

        ctx.body = { message: '恢复成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});


// 获取所有群头像
router.get('/roomAvatars', koaJwt({ secret }), async (ctx) => {
    try {
        // 获取../public/avatar/room/ 文件夹中的头像文件
        const files = fs.readdirSync(path.join(__dirname, '../public/avatar/group'));
        const avatars = [];
        for (const file of files) {
            avatars.push(file);
        }

        ctx.body = { data: avatars, message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});

// 获取用户列表
router.post('/users', koaJwt({ secret }), async (ctx) => {
    const { user_id, username, nickname, email, phone, createdAt } = ctx.request.body;

    // 构建查询条件对象
    const searchConditions = {};
    if (user_id&&user_id != '') {
        searchConditions.user_id = { [Op.eq]: user_id };
    }
    if (username&&username != '') {
        searchConditions.username = { [Op.eq]: username };
    }
    if (nickname&&nickname != '') {
        searchConditions.nickname = { [Op.like]: `%${nickname}%` };
    }
    if (email&&email != '') {
        searchConditions.email = { [Op.like]: `%${email}%` };
    }
    if (phone&&phone != '') {
        searchConditions.phone = { [Op.like]: `%${phone}%` };
    }
    if (createdAt&&createdAt.length > 0) {
        console.log(createdAt);
        searchConditions.createdAt = { [Op.between]: [new Date(createdAt[0]), new Date(createdAt[1])] };
    }

    try {
        const users = await User.findAll({
            where: searchConditions,
            limit: 100,
            offset: 0,
            order: [['createdAt', 'DESC']],
        });
        ctx.body = { data: users, message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});


// 用户重置密码
router.post('/resetPassword', koaJwt({ secret }), async (ctx) => {
    const { user_id } = ctx.request.body;
    const schema = Joi.object({
        user_id: Joi.string().required(),
    });

    const { error } = schema.validate({ user_id });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        const user = await User.findOne({
            where: {
                user_id,
            },
        });
        if (!user) {
            ctx.status = 400;
            ctx.body = { message: '用户不存在' };
            return;
        }
        await user.update({
            password: sha256('123456').toString(),
        });
        ctx.body = { message: '密码修改成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});

// 修改用户信息
router.post('/editUser', koaJwt({ secret }), async (ctx) => {
    const { user_id, nickname, signature, status } = ctx.request.body;
    const schema = Joi.object({
        user_id: Joi.string().required(),
        nickname: Joi.string().required(),
        signature: Joi.string().required(),
        status: Joi.number().required(),
    });

    const { error } = schema.validate({ user_id, nickname, signature, status });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        const user = await User.findOne({
            where: {
                user_id,
            },
        });
        if (!user) {
            ctx.status = 400;
            ctx.body = { message: '用户不存在' };
            return;
        }
        await user.update({
            nickname,
            signature,
            status,
        });
        ctx.body = { message: '修改成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});

// 用户头像设为违规
router.post('/avatarIllegal', koaJwt({ secret }), async (ctx) => {
    const { username } = ctx.request.body;
    const schema = Joi.object({
        username: Joi.string().required(),
    });

    const { error } = schema.validate({ username });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }
    try {

        // 去../public/avatar/user/ 文件夹中将username.*文件改为username+'违规'.*
        const files = fs.readdirSync(path.join(__dirname, '../public/avatar/user'));
        for (const file of files) {
            if (file.startsWith(username)) {
                fs.renameSync(path.join(__dirname, '../public/avatar/user', file), path.join(__dirname, '../public/avatar/user', username+'违规'+file.slice(file.lastIndexOf('.'))));
            }
        }

        // 删除../public/data/userAvatar.json 的username键值
        const userAvatar = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/userAvatar.json'), 'utf-8'));
        delete userAvatar[username];
        fs.writeFileSync(path.join(__dirname, '../public/data/userAvatar.json'), JSON.stringify(userAvatar));

        ctx.body = { message: '修改成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }

})


// 获取股东列表
router.get('/shareholders', koaJwt({ secret }), async (ctx) => {
    const { username } = ctx.request.query;
    try {
        // 读取../public/data/badge.json 文件中的数据
        const data = fs.readFileSync(path.join(__dirname, '../public/data/badge.json'), 'utf-8');
        const badges = JSON.parse(data);
        let stockholders = [];
        if(username === ''){
            // 去重badges.badge.stockholder，这是一个数组
            stockholders = [...new Set(badges.badge.stockholder)];
        }else{
            // 判断是否有username
            stockholders = badges.badge.stockholder.filter(item => item === username);
            if(stockholders.length === 0){
                ctx.status = 200;
                ctx.body = { data: [], message: '股东不存在' };
                return;
            }else{
                stockholders = [username]
            }
        }


        // 读数据库
        const users = await User.findAll({
            where: {
                username: { [Op.in]: stockholders },
            },
            order: [['createdAt', 'DESC']], // 按创建时间倒序
        });

        ctx.body = { data: users, message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});


// 获取用户头像列表
router.get('/userAvatars', koaJwt({ secret }), async (ctx) => {
    try {
        // 读取../public/data/userAvatar.json 文件中的数据
        const data = fs.readFileSync(path.join(__dirname, '../public/data/userAvatar.json'), 'utf-8');
        const userAvatars = JSON.parse(data);

        ctx.body = { data: userAvatars, message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});

// 举报数据获取
router.get('/reportData', koaJwt({ secret }), async (ctx) => {
    const { username, status } = ctx.request.query;

    let searchConditions = {};
    if (username&&username != '') {
        searchConditions.username = { [Op.eq]: username };
    }
    if (status&&status != '') {
        searchConditions.status = { [Op.eq]: status };
    }


    try {
        const reportData = await chatReport.findAll({
            where: searchConditions,
            order: [['createdAt', 'DESC']],
        });
        ctx.body = { data: reportData, message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});

// 封禁数据操作
router.post('/banUser', koaJwt({ secret }), async (ctx) => {
    const { affair_id,report_id, reason, status } = ctx.request.body;
    const schema = Joi.object({
        affair_id: Joi.string().required(),
        status: Joi.number().required(),
        report_id: Joi.string().required(),
    });

    const { error } = schema.validate({ affair_id, report_id, status });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        // 获取聊天记录信息
        const chatRecord = await ChatRecord.findOne({
            where: {
                msg_id: affair_id,
            },
        });
        if (!chatRecord) {
            ctx.status = 400;
            ctx.body = { message: '消息不存在' };
            return;
        }

        if(status === 2){
            // 读取../public/data/banned.json 文件中的数据
            const banned = fs.readFileSync(path.join(__dirname, '../public/data/banned.json'), 'utf-8');
            const bannedUsers = JSON.parse(banned);
            // 判断是否已经被封禁
            if(bannedUsers.includes(chatRecord.user_id)){
                ctx.status = 400;
                ctx.body = { message: '用户已经被封禁' };
                return;
            }else{
                // 写入../public/data/banned.json 文件
                bannedUsers.push({user_id: chatRecord.user_id, username: chatRecord.username, ip: chatRecord.ip, reason, time: new Date()});
                fs.writeFileSync(path.join(__dirname, '../public/data/banned.json'), JSON.stringify(bannedUsers));
            }

        }
        // 状态修改
        await chatReport.update(
            {status},
            {where: {report_id}},
        );

        ctx.body = { message: '封禁成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});


// 解封数据操作
router.post('/unbanUser', koaJwt({ secret }), async (ctx) => {
    const { user_id, username, ip, reason } = ctx.request.body;
    const schema = Joi.object({
        user_id: Joi.string().required(),
    });

    const { error } = schema.validate({ user_id });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        // 读取../public/data/banned.json 文件中的数据
        const banned = fs.readFileSync(path.join(__dirname, '../public/data/banned.json'), 'utf-8');
        const bannedUsers = JSON.parse(banned);
        // 遍历bannedUsers，找到user_id，删除该对象
        for(let i = 0; i < bannedUsers.length; i++){
            if(bannedUsers[i].user_id === user_id){
                bannedUsers.splice(i, 1);
                break;
            }
        }

        // 写入../public/data/banned.json 文件
        fs.writeFileSync(path.join(__dirname, '../public/data/banned.json'), JSON.stringify(bannedUsers));


        // 解封记录写入../public/data/unseal.json
        const unseal = fs.readFileSync(path.join(__dirname, '../public/data/unseal.json'), 'utf-8');
        const unsealUsers = JSON.parse(unseal);
        unsealUsers.push({user_id, username, ip, reason, time: new Date()});
        fs.writeFileSync(path.join(__dirname, '../public/data/unseal.json'), JSON.stringify(unsealUsers));

        ctx.body = { message: '解封成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});



// 读取封禁数据
router.get('/banned', koaJwt({ secret }), async (ctx) => {
    try {
        // 读取../public/data/banned.json 文件中的数据
        const banned = fs.readFileSync(path.join(__dirname, '../public/data/banned.json'), 'utf-8');
        const bannedUsers = JSON.parse(banned);

        ctx.body = { data: bannedUsers, message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});


// 获取所有应用
router.post('/chatApp', koaJwt({ secret }), async (ctx) => {
    const { app_id, title, url, top, status, createdAt, category } = ctx.request.body;
    try {

        // 构建查询条件对象
        const searchConditions = {};
        if (app_id&&app_id != '') {
            searchConditions.app_id = { [Op.eq]: app_id };
        }
        if (title&&title != '') {
            searchConditions.title = { [Op.like]: `%${title}%` };
        }
        if (url&&url != '') {
            searchConditions.url = { [Op.like]: `%${url}%` };
        }
        if (top !== undefined && top !== null && top !== '') {
            searchConditions.top = { [Op.eq]: top };
        }
        if (status !== undefined && status !== null && status !== '') {
            searchConditions.status = { [Op.eq]: status };
        }
        if (createdAt&&createdAt.length > 0) {
            searchConditions.createdAt = { [Op.between]: [new Date(createdAt[0]), new Date(createdAt[1])] };
        }
        if (category&&category != '') {
            searchConditions.category = { [Op.eq]: category };
        }



        const chatApps = await chatApp.findAll({
            where: searchConditions,
            order: [['createdAt', 'DESC']],
        });
        ctx.body = { data: chatApps, message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});


// 应用信息修改
router.post('/editChatApp', koaJwt({ secret }), async (ctx) => {
    const { app_id, title, url, top, tag, icon, placard, desc, category, status } = ctx.request.body;
    const schema = Joi.object({
        app_id: Joi.string().required(),
        title: Joi.string().required(),
        url: Joi.string().required(),
        top: Joi.number().required(),
        desc: Joi.string().required(),
        placard: Joi.array().required(),
        // category: Joi.string().required(),
        status: Joi.number().required(),
        tag: Joi.array().required(),
    });

    const { error } = schema.validate({ app_id, title, url, top, desc, tag, placard, status });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        const chatAppOne = await chatApp.findOne({
            where: {
                app_id,
            },
        });
        if (!chatAppOne) {
            ctx.status = 400;
            ctx.body = { message: '应用不存在' };
            return;
        }
        await chatAppOne.update({
            title,
            url,
            top,
            icon,
            desc,
            category,
            placard,
            status,
            tag,
        });
        ctx.body = { message: '修改成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});


// 应用海报上传
router.post('/uploadPoster', koaJwt({ secret }), koaBody({ 
    multipart: true,
    formidable: {
        keepExtensions: true, // 保留文件扩展名
        uploadDir: path.join(__dirname, '../public/avatar/placard'), // 上传目录
    },
}), async (ctx) => {
    ctx.body = {
        code: 200,
        message: '上传成功',
        data: ctx.request.files,
    };
});



// 获取订单
router.post('/orders', koaJwt({ secret }), async (ctx) => {
    const { username, status, order_id, goods, createdAt } = ctx.request.body;
    try {
        // 构建查询条件对象
        const searchConditions = {};
        if (username&&username != '') {
            searchConditions.username = { [Op.eq]: username };
        }
        if (status !== undefined && status !== null && status !== '') {
            searchConditions.status = { [Op.eq]: status };
        }
        if (goods&&goods != '') {
            searchConditions.goods = { [Op.like]: `%${goods}%` };
        }
        if (order_id&&order_id != '') {
            searchConditions.order_id = { [Op.eq]: order_id };
        }
        if (createdAt&&createdAt.length > 0) {
            searchConditions.createdAt = { [Op.between]: [new Date(createdAt[0]), new Date(createdAt[1])] };
        }

        const orders = await chatOrder.findAll({
            where: searchConditions,
            order: [['createdAt', 'DESC']],
        });
        ctx.body = { data: orders, message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});


// 写入公告
router.post('/writeNotice', koaJwt({ secret }), async (ctx) => {
    const { content,valid_time } = ctx.request.body;
    const schema = Joi.object({
        content: Joi.string().required(),
        valid_time: Joi.array().required(),
    });

    const { error } = schema.validate({ content,valid_time });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        // 写入../public/data/systemNotice.json 文件
        const systemNotice = fs.readFileSync(path.join(__dirname, '../public/data/systemNotice.json'), 'utf-8');
        const systemNoticeObj = JSON.parse(systemNotice);
        systemNoticeObj.push({
            notice_id: 'Giao_' +customAlphabet(nanoidNode, 10)(),
            content,
            valid_time,
            look_num: 0,
            status: 1,  // 1-有效 0-无效
            createdAt: new Date(),
        })
        fs.writeFileSync(path.join(__dirname, '../public/data/systemNotice.json'), JSON.stringify(systemNoticeObj));

        ctx.body = { message: '发布成功' };

    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});


// 获取所有公告
router.get('/notices', koaJwt({ secret }), async (ctx) => {
    try {
        // 读取../public/data/systemNotice.json 文件中的数据
        const systemNotice = fs.readFileSync(path.join(__dirname, '../public/data/systemNotice.json'), 'utf-8');
        const systemNoticeObj = JSON.parse(systemNotice);

        ctx.body = { data: systemNoticeObj, message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
})

// 修改公告
router.post('/editNotice', koaJwt({ secret }), async (ctx) => {
    const { notice_id, content, valid_time, status } = ctx.request.body;
    const schema = Joi.object({
        notice_id: Joi.string().required(),
        content: Joi.string().required(),
        valid_time: Joi.array().required(),
        status: Joi.number().required(),
    });

    const { error } = schema.validate({ notice_id, content, valid_time, status });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        // 读取../public/data/systemNotice.json 文件中的数据
        const systemNotice = fs.readFileSync(path.join(__dirname, '../public/data/systemNotice.json'), 'utf-8');
        const systemNoticeObj = JSON.parse(systemNotice);
        // 遍历systemNoticeObj，找到notice_id，修改该对象
        for(let i = 0; i < systemNoticeObj.length; i++){
            if(systemNoticeObj[i].notice_id === notice_id){
                systemNoticeObj[i].content = content;
                systemNoticeObj[i].valid_time = valid_time;
                systemNoticeObj[i].status = status;
                break;
            }
        }

        // 写入../public/data/systemNotice.json 文件
        fs.writeFileSync(path.join(__dirname, '../public/data/systemNotice.json'), JSON.stringify(systemNoticeObj));

        ctx.body = { message: '修改成功' };

    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});


// 查找公告
router.get('/searchNotice', koaJwt({ secret }), async (ctx) => {
    // 根据当前时间判断是否有有效公告
    try {
        // 读取../public/data/systemNotice.json 文件中的数据
        const systemNotice = fs.readFileSync(path.join(__dirname, '../public/data/systemNotice.json'), 'utf-8');
        const systemNoticeObj = JSON.parse(systemNotice);
        let validNotice = null;
        for(let i = 0; i < systemNoticeObj.length; i++){
            if(systemNoticeObj[i].status === 1 && systemNoticeObj[i].valid_time[0] <= new Date() && systemNoticeObj[i].valid_time[1] >= new Date()){
                validNotice = systemNoticeObj[i];
                break;
            }
        }
        if(validNotice){
            validNotice.look_num++;
            // 写入../public/data/systemNotice.json 文件
            fs.writeFileSync(path.join(__dirname, '../public/data/systemNotice.json'), JSON.stringify(systemNoticeObj));
        }
        ctx.body = { data: validNotice, message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
})


// 获取用户反馈
router.post('/feedbacks', koaJwt({ secret }), async (ctx) => {
    const { username, type, status, createdAt } = ctx.request.body;

    try {
        // 构建查询条件对象
        const searchConditions = {};
        if (username&&username != '') {
            searchConditions.username = { [Op.eq]: username };
        }
        if (type&&type != '') {
            searchConditions.type = { [Op.eq]: type };
        }
        if (status !== undefined && status !== null && status !== '') {
            searchConditions.status = { [Op.eq]: status };
        }
        if (createdAt&&createdAt.length > 0) {
            searchConditions.createdAt = { [Op.between]: [new Date(createdAt[0]), new Date(createdAt[1])] };
        }

        const feedbacks = Feedback.findAll({
            where: searchConditions,
            order: [['createdAt', 'DESC']],
        });
        ctx.body = { data: feedbacks, message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});

// 修改反馈状态
router.post('/editFeedbackStatus', koaJwt({ secret }), async (ctx) => {
    const { feedback_id, status } = ctx.request.body;
    const schema = Joi.object({
        feedback_id: Joi.string().required(),
        status: Joi.number().required(),
    });

    const { error } = schema.validate({ feedback_id, status });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        
        const feedback = await Feedback.findOne({
            where: {
                feedback_id: feedback_id,
            },
        });
        if (!feedback) {
            ctx.status = 400;
            ctx.body = { message: '反馈不存在' };
            return;
        }
        await feedback.update({
            status,
        });
        ctx.body = { message: '修改成功' };

    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});


// 获取日志列表
router.get('/getLogList', koaJwt({ secret }), async (ctx) => {
    // 日志在/assets/logs/logs-2025-01-04.log文件中,根据用户传过来的时间参数获取日志内容
    const { time } = ctx.query;
    // 扩展插件
    dayjs.extend(utc);
    dayjs.extend(timezone);

    // 解析时间
    const newTime = dayjs(time, 'ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');

    // 转换为中国时区（Asia/Shanghai）
    const chinaTime = newTime.tz('Asia/Shanghai');

    // 格式化时间为 'YYYY-MM-DD'
    const formattedTime = chinaTime.format('YYYY-MM-DD');

    // 捕获异常
    try {
        const filePath = path.join(__dirname, `../public/logs/logs-${formattedTime}.log`);
        const logs = fs.readFileSync(filePath, 'utf-8');

        ctx.body = {
            code: 0,
            data: logs
        };
    } catch (error) {
        ctx.status = 400;
        ctx.body = {
            code: 1,
            message: '日志文件不存在'
        };
    }
});










// 获取聊天记录最新的1000条
router.get('/chatRecords', koaJwt({ secret }), async (ctx) => {
    try {
        const chatRecords = await ChatRecord.findAll({
            order: [['id', 'DESC']],
            limit: 1000,
        });
        ctx.body = { data: chatRecords, message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});

// 根据房间id获取聊天记录
router.get('/chatRecords/:room_id', koaJwt({ secret }), async (ctx) => {
    const { room_id } = ctx.params;
    try {
        const chatRecords = await ChatRecord.findAll({
            where: {
                room_id: room_id,
            },
            order: [['id', 'DESC']],
        });
        ctx.body = { data: chatRecords, message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});

// 根据用户id获取聊天记录
router.get('/chatRecords/user/:user_id', koaJwt({ secret }), async (ctx) => {
    const { user_id } = ctx.params;
    try {
        const chatRecords = await ChatRecord.findAll({
            where: {
                user_id: user_id,
            },
            order: [['id', 'DESC']],
        });
        ctx.body = { data: chatRecords, message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});



// 获取徽章
router.get('/badges', koaJwt({ secret }), async (ctx) => {
    try {
        // 获取../public/data/badge.json 文件中的数据
        const data = fs.readFileSync(path.join(__dirname, '../public/data/badge.json'), 'utf-8');
        const badges = JSON.parse(data);

        ctx.body = { data: badges, message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});

// 获取banner
router.get('/banners', koaJwt({ secret }), async (ctx) => {
    try {
        // 获取../public/data/banners.json 文件中的数据
        const banners = fs.readFileSync(path.join(__dirname, '../public/data/banners.json'), 'utf-8');

        ctx.body = { data: banners, message: '获取成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});

// 修改banner
router.post('/editBanner', koaJwt({ secret }), async (ctx) => {
    try {
        // 写入../public/data/banners.json 文件
        fs.writeFileSync(path.join(__dirname, '../public/data/banners.json'), JSON.stringify(ctx.request.body.banners));
        ctx.body = { message: '修改成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: err, message: '服务器错误' };
    }
});









module.exports = router;