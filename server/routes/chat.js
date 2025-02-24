const { User, Room, chatApp, chatReport, ChatRecord, chatEmoticon } = require('../models/models');
const { Op, Sequelize } = require('sequelize');
const Router = require('koa-router');
const Joi = require('joi');
const { customAlphabet } = require('nanoid');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const koaJwt = require('koa-jwt');
const { wordFilter } = require('../filter/AhoCorasick');
const { getIo } = require('./socket');
const router = new Router();
const koaBody = require('koa-body').default;
const secret = '@5.0.0node_mdex.js:109:16';
const nanoidNode = '1234567890abcdefghijklmnopqrstuvwxyz';

// 创建房间
router.post('/createRoom', async (ctx) => {
    const { name, user_id, desc, avatar } = ctx.request.body;
    const schema = Joi.object({
        name: Joi.string().required(),
        // 允许为空
        desc: Joi.string().allow(''),
        avatar: Joi.string().required(),
    });
    const { error } = schema.validate({ name, desc, avatar });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    // 查询房间是否存在
    const room = await Room.findOne({
        where: {
            name: ctx.request.body.name,
        },
        attributes: ['room_id']
    });
    if (room) {
        ctx.status = 400;
        ctx.body = { message: '房间已存在' };
        return;
    }

    // 创建房间
    try {
        const newRoom = await Room.create({
            room_id: 'roomid_' + customAlphabet(nanoidNode, 10)(),
            name,
            avatar,
            owner_id: user_id,
            desc,
            type: 1,
            status: 1,
            users: [user_id],
            apps: [],
            announcement: []
        });

        // 获取用户房间列表
        const userRooms = await User.findOne({
            where: {
                user_id,
            },
            // 仅返回rooms字段
            attributes: ['rooms','id'],
        });
        
        // console.log(userRooms);
        // 将新房间添加到用户房间列表
        userRooms.rooms.push({room_id: newRoom.room_id, room_title: '', room_nickname:'', time: new Date(), status: 1});
        
        await User.update(
            { rooms: userRooms.rooms }, // 更新 rooms 字段
            { where: { id:userRooms.id } } // 条件
        );

        ctx.body = { message: '创建房间成功', data: {newRoom, rooms: userRooms.rooms} };
    } catch (error) {
        ctx.status = 500;
        console.log(error);
        ctx.body = { message: error };
    }

})


// 发送text/md消息
router.post('/sendMessage', koaJwt({ secret }), async (ctx) => {
    const { room_id, user_id, nickname, username, msg, type, source } = ctx.request.body;
    const schema = Joi.object({
        room_id: Joi.string().required(),
        user_id: Joi.string().required(),
        nickname: Joi.string().required(),
        type: Joi.string().required(),
        source: Joi.string().required(),
        msg: Joi.string().required(),
    });
    const { error } = schema.validate({ room_id, user_id, nickname, type, msg, source });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    // 判断字数限制
    if(msg.length > 1000){
        ctx.status = 400;
        ctx.body = { message: '字数超过限制' };
        return;
    }

    // 校验token
    const tokenFile = path.join(__dirname, '../public/jwt.json');
    const tokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
    try{
        if(tokenData[user_id].token !== ctx.request.headers.authorization.split(' ')[1]){
            ctx.status = 401;
            ctx.body = { message: 'token验证失败请重新登录' };
            return;
        }
    } catch(err){
        ctx.status = 401;
        ctx.body = { message: 'token验证失败请重新登录' };
        return;
    }


    let msg_filter = await wordFilter(msg);  // 过滤敏感词

    if(type == 'md'){
        // 去掉按钮、input、表单标签、iframe、frame标签
        msg_filter.text = msg_filter.text.replace(/<button[\s\S]*?<\/button>|<input[\s\S]*?>|<form[\s\S]*?<\/form>|<iframe[\s\S]*?<\/iframe>|<frame[\s\S]*?<\/frame>/g, '');
    }


    let msg_data = {
        msg_id: 'msg_' + customAlphabet(nanoidNode, 20)(),
        user_id,
        username,
        room_id,
        nickname,
        ymsg: msg,
        msg: msg_filter.text,
        type,
        status: 1,
        source,
        interact: [],
        ip: ctx.headers['x-forwarded-for'] ? ctx.headers['x-forwarded-for'].split(',')[0].trim() : ctx.ip
    }
    try {
        // 向房间内所有用户广播消息
        const io = getIo();
        io.to(room_id).emit('messages', msg_data)
        
        ctx.body = { message: '发送消息成功', data: msg_data };

        // 创建聊天记录
        await ChatRecord.create(msg_data);

    } catch (error) {
        ctx.status = 500;
        ctx.body = { error };
    }

})


// 发送文件消息
router.post('/sendFile', koaJwt({ secret }), koaBody({    // 注册文件上传中间件
    multipart: true,
    formidable: {
        keepExtensions: true, // 保留文件扩展名
        uploadDir: path.join(__dirname, '../public/chatFiles'), // 上传目录
    },
}), async (ctx) => {
    console.log(ctx.request.body)
    const { room_id, nickname, source } = ctx.request.body;
    const { user_id, username } = ctx.state.user
    const schema = Joi.object({
        room_id: Joi.string().required(),
        user_id: Joi.string().required(),
        nickname: Joi.string().required(),
        username: Joi.string().required(),
        source: Joi.string().required(),
    });
    const { error } = schema.validate({ room_id, user_id, nickname, username, source });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    // 校验token
    const tokenFile = path.join(__dirname, '../public/jwt.json');
    const tokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
    try{
        if(tokenData[user_id].token !== ctx.request.headers.authorization.split(' ')[1]){
            ctx.status = 401;
            ctx.body = { message: 'token验证失败请重新登录' };
            return;
        }
    } catch(err){
        ctx.status = 401;
        ctx.body = { message: 'token验证失败请重新登录' };
        return;
    }

    // 创建聊天记录
    let msg_data = {
        msg_id: 'msg_' + customAlphabet(nanoidNode, 20)(),
        user_id,
        username,
        room_id,
        nickname,
        type: 'file',
        json_msg: {
            file_name: ctx.request.files.file.originalFilename,
            file_url: ctx.request.files.file.newFilename,
            size: ctx.request.files.file.size,
            format: ctx.request.files.file.newFilename.split('.').pop(),
        },
        status: 1,
        source,
        interact: [],
        ip: ctx.headers['x-forwarded-for'] ? ctx.headers['x-forwarded-for'].split(',')[0].trim() : ctx.ip
    }

    try {

        // 向房间内所有用户广播消息
        const io = getIo();
        io.to(room_id).emit('messages', msg_data)
        
        ctx.body = { message: '发送消息成功', data: msg_data };

        // 创建聊天记录
        await ChatRecord.create(msg_data);
    } catch (error) {
        ctx.status = 500;
        ctx.body = { message: error };
    }

})


// 发送表情消息
router.post('/sendEmoticon', koaJwt({ secret }), async (ctx) => {
    const { room_id, user_id, nickname, username, emoticon_id, source } = ctx.request.body;
    const schema = Joi.object({
        room_id: Joi.string().required(),
        user_id: Joi.string().required(),
        nickname: Joi.string().required(),
        username: Joi.string().required(),
        emoticon_id: Joi.string().required(),
        source: Joi.string().required(),
    });
    const { error } = schema.validate({ room_id, user_id, nickname, username, emoticon_id, source });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    // 校验token
    const tokenFile = path.join(__dirname, '../public/jwt.json');
    const tokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
    try{
        if(tokenData[user_id].token !== ctx.request.headers.authorization.split(' ')[1]){
            ctx.status = 401;
            ctx.body = { message: 'token验证失败请重新登录' };
            return;
        }
    } catch(err){
        ctx.status = 401;
        ctx.body = { message: 'token验证失败请重新登录' };
        return;
    }

    // 查询表情
    const emoticon = await chatEmoticon.findOne({
        where: {
            emoticon_id,
            status: 1,
        },
    });
    if (!emoticon) {
        ctx.status = 400;
        ctx.body = { message: '表情不存在' };
        return;
    }

    // 创建聊天记录
    let msg_data = {
        msg_id: 'msg_' + customAlphabet(nanoidNode, 20)(),
        user_id,
        username,
        room_id,
        nickname,
        type: 'bqb',
        json_msg: {
            emoticon_id,
            emoticon_url: emoticon.url,
            emoticon_title: emoticon.title,
            emoticon_category: emoticon.category,
        },
        status: 1,
        source,
        interact: [],
        ip: ctx.headers['x-forwarded-for'] ? ctx.headers['x-forwarded-for'].split(',')[0].trim() : ctx.ip
    }

    try {
        // 向房间内所有用户广播消息
        const io = getIo();
        io.to(room_id).emit('messages', msg_data)
        
        ctx.body = { message: '发送消息成功', data: msg_data };

        // 创建聊天记录
        await ChatRecord.create(msg_data);
    } catch (error) {
        ctx.status = 500;
        ctx.body = { message: error };
    }

})


// 发送应用消息
router.post('/sendAppMessage', koaJwt({ secret }), async (ctx) => {
    const { room_id, user_id, nickname, username, app_id, source } = ctx.request.body;
    const schema = Joi.object({
        room_id: Joi.string().required(),
        user_id: Joi.string().required(),
        nickname: Joi.string().required(),
        username: Joi.string().required(),
        app_id: Joi.string().required(),
        source: Joi.string().required(),
    });
    const { error } = schema.validate({ room_id, user_id, nickname, username, app_id, source });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    // 校验token
    const tokenFile = path.join(__dirname, '../public/jwt.json');
    const tokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
    try{
        if(tokenData[user_id].token !== ctx.request.headers.authorization.split(' ')[1]){
            ctx.status = 401;
            ctx.body = { message: 'token验证失败请重新登录' };
            return;
        }
    } catch(err){
        ctx.status = 401;
        ctx.body = { message: 'token验证失败请重新登录' };
        return;
    }

    // 查询应用
    const app = await chatApp.findOne({
        where: {
            app_id,
            status: 1,
        },
    });
    if (!app) {
        ctx.status = 400;
        ctx.body = { message: '应用不存在' };
        return;
    }

    // 创建聊天记录
    let msg_data = {
        msg_id: 'msg_' + customAlphabet(nanoidNode, 20)(),
        user_id,
        username,
        room_id,
        nickname,
        type: 'app',
        json_msg: {
            app_id,
            app_title: app.title,
            app_icon: app.icon,
            app_desc: app.desc,
            app_url: app.url,
            app_type: app.type,
            placard: app.placard,
            tag: app.tag,
            category: app.category,
        },
        status: 1,
        source,
        interact: [],
        ip: ctx.headers['x-forwarded-for'] ? ctx.headers['x-forwarded-for'].split(',')[0].trim() : ctx.ip
    }

    try {

        // 向房间内所有用户广播消息
        const io = getIo();
        io.to(room_id).emit('messages', msg_data)
        
        ctx.body = { message: '发送消息成功', data: msg_data };

        // 创建聊天记录
        await ChatRecord.create(msg_data);

    } catch (error) {
        ctx.status = 500;
        ctx.body = {message:  error };
    }

})


// 前端自定义黏贴上传的图片发送图片消息
router.post('/sendCustomImage', koaJwt({ secret }), koaBody({    // 注册文件上传中间件
    multipart: true,
    formidable: {
        keepExtensions: true, // 保留文件扩展名
        uploadDir: path.join(__dirname, '../public/chatImages'), // 上传目录
    },
}), async (ctx) => {
    const { room_id, nickname, source } = ctx.request.body;
    const { user_id, username } = ctx.state.user
    const schema = Joi.object({
        room_id: Joi.string().required(),
        user_id: Joi.string().required(),
        nickname: Joi.string().required(),
        username: Joi.string().required(),
        source: Joi.string().required(),
    });
    const { error } = schema.validate({ room_id, user_id, nickname, username, source });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    // ctx.request.files.file.newFilename.split('.').pop() 获取文件格式仅支持jpg、jpeg、webp、svg、bmp、png、gif
    let format = ctx.request.files.file.newFilename.split('.').pop();
    if (format !== 'jpg' && format !== 'jpeg' && format !== 'webp' && format !=='svg' && format !== 'bmp' && format !== 'png' && format !== 'gif') {
        ctx.status = 400;
        ctx.body = { message: '图片格式不支持' };
        return;
    }

    // 校验token
    const tokenFile = path.join(__dirname, '../public/jwt.json');
    const tokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
    try{
        if(tokenData[user_id].token !== ctx.request.headers.authorization.split(' ')[1]){
            ctx.status = 401;
            ctx.body = { message: 'token验证失败请重新登录' };
            return;
        }
    } catch(err){
        ctx.status = 401;
        ctx.body = { message: 'token验证失败请重新登录' };
        return;
    }

    // 创建聊天记录
    let msg_data = {
        msg_id: 'msg_' + customAlphabet(nanoidNode, 20)(),
        user_id,
        username,
        room_id,
        nickname,
        type: 'image',
        json_msg: {
            file_name: ctx.request.files.file.originalFilename,
            file_url: ctx.request.files.file.newFilename,
            size: ctx.request.files.file.size,
            format: format,
        },
        status: 1,
        source,
        interact: [],
        ip:ctx.headers['x-forwarded-for'] ? ctx.headers['x-forwarded-for'].split(',')[0].trim() : ctx.ip
    }

    try {
        // 向房间内所有用户广播消息
        const io = getIo();
        io.to(room_id).emit('messages', msg_data)
        
        ctx.body = { message: '发送消息成功', data: msg_data };

        // 创建聊天记录
        await ChatRecord.create(msg_data);

    } catch (error) {
        ctx.status = 500;
        ctx.body = {message: error };
    }

})


// 获取徽章数据
router.post('/getBadgeData', koaJwt({ secret }), async (ctx) => {

    // 读取徽章数据
    const badgeFile = path.join(__dirname, '../public/data/badge.json');
    const badgeData = JSON.parse(fs.readFileSync(badgeFile, 'utf-8'));

    ctx.body = { message: '获取徽章数据成功', data: badgeData };
})


// 获取房间列表
router.post('/getRoomList', koaJwt({ secret }), async (ctx) => {
    const { user_id, rooms } = ctx.request.body;
    const schema = Joi.object({
        user_id: Joi.string().required(),
        rooms: Joi.array().required(),
    });
    const { error } = schema.validate({ user_id, rooms });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    // 查询房间列表
    try {
        const getRooms = await Room.findAll({
            where: {
                room_id: {
                    [Op.in]: rooms, // rooms 是数组
                },
            },
            attributes: [
                'room_id',
                'apps',
                'avatar',
                'background',
                'badges',
                'desc',
                'interior_status',
                'name',
                'owner_id',
                'status',
                'tags',
                'type',
                'announcement'
            ],
            order: [
                ['createdAt', 'DESC'],
            ],
        });

        ctx.body = { message: '获取房间列表成功', data:  getRooms};
    } catch (error) {
        ctx.status = 500;
        console.log(error);
        ctx.body = { message: error };
    }
})


// 获取聊天记录
router.post('/getChatRecords', koaJwt({ secret }), async (ctx) => {
    const { room_id, user_id, page, limit } = ctx.request.body;
    const schema = Joi.object({
        room_id: Joi.string().required(),
        user_id: Joi.string().required(),
        page: Joi.number().integer().min(1).required(),
        limit: Joi.number().integer().min(1).max(100).required(),
    });
    const { error } = schema.validate({ room_id, user_id, page, limit });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    // 查询聊天记录
    try {
        const getChatRecords = await ChatRecord.findAll({
            where: {
                room_id,
                status:1,
            },
            limit: limit,
            offset: (page - 1) * limit,
            attributes: ['msg_id', 'room_id', 'username', 'nickname', 'interact', 'json_msg', 'ymsg','msg', 'type','status','source', 'createdAt'],
            order: [
                ['id', 'DESC'],
            ],
        });

        ctx.body = { message: '获取聊天记录成功', data:  getChatRecords};
    } catch (error) {
        ctx.status = 500;
        console.log(error);
        ctx.body = { message: error };
    }
})


// 上传群头像
let ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];// 允许的图片格式
router.post('/uploadGroupAvatar', koaJwt({ secret }), koaBody({
    multipart: true,
    formidable: {
        keepExtensions: true, // 保留文件扩展名
        uploadDir: path.join(__dirname, '../public/avatar/group'), // 上传目录
    },
}), async (ctx) => {
    const file = ctx.request.files.file; // 假设前端上传的文件字段名为 'file'

    if (!file) {
        ctx.status = 400;
        ctx.body = { message: '未上传文件' };
        return;
    }

    // 获取文件扩展名
    const fileExtension = path.extname(file.newFilename).toLowerCase();

    // 校验文件格式
    if (!ALLOWED_IMAGE_EXTENSIONS.includes(fileExtension)) {
        // 删除不符合格式的文件
        fs.unlinkSync(path.join(__dirname, '../public/avatar/group') + '/' + file.newFilename);
        ctx.status = 400;
        ctx.body = { message: '不支持的文件格式，仅支持 .jpg, .jpeg, .png, .gif, .webp, .bmp' };
        return;
    }

    ctx.body = { message: '上传成功', data: file };
});


// 搜索房间
router.post('/searchRoom', koaJwt({ secret }), async (ctx) => {
    const { keyword, user_id } = ctx.request.body;
    const schema = Joi.object({
        user_id: Joi.string().required(),
        keyword: Joi.string().required(),
    });
    const { error } = schema.validate({ user_id, keyword });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    // 查询房间列表
    try {
        const getRooms = await Room.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `%${keyword}%` } },
                    { desc: { [Op.like]: `%${keyword}%` } },
                ],
            },
            order: [
                ['createdAt', 'DESC'],
            ],
        });

        // 获取用户房间列表
        const userRooms = await User.findOne({
            where: {
                user_id,
            },
            // 仅返回rooms字段
            attributes: ['rooms','id'],
        });
        console.log(userRooms);

        // 标记用户已加入的房间
        for (let i = 0; i < getRooms.length; i++) {
            const room = getRooms[i];
            const userRoom = userRooms.rooms.find(item => item.room_id === room.room_id);
            if (userRoom) {
                room.dataValues.exist = 1;  // 1表示已加入
            } else {
                room.dataValues.exist = 0;  // 0表示未加入
            }
        }

        ctx.body = { message: '搜索房间成功', data: getRooms};
    } catch (error) {
        ctx.status = 500;
        console.log(error);
        ctx.body = { message: error };
    }
})


// 加入房间
router.post('/joinRoom', koaJwt({ secret }), async (ctx) => {
    const { room_id, user_id } = ctx.request.body;
    const schema = Joi.object({
        room_id: Joi.string().required(),
        user_id: Joi.string().required(),
    });
    const { error } = schema.validate({ room_id, user_id });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        // 查询用户
        const user = await User.findOne({ where: { user_id } });
        if (!user) {
            ctx.status = 400;
            ctx.body = { message: '用户不存在' };
            return;
        }

        // 判断用户的rooms字段里有没有room_id
        const isInRooms = user.rooms.some(r => r.room_id === room_id);
        if (isInRooms) {
            ctx.status = 400;
            ctx.body = { message: '用户已经在房间中' };
            return;
        }

        // 查询房间
        const room = await Room.findOne({ 
            where: { room_id }

        });
        if (!room) {
            ctx.status = 400;
            ctx.body = { message: '房间不存在' };
            return;
        }

        // 判断房间的users字段里有没有user_id
        const isInUsers = room.users.some(u => u === user_id);
        console.log(isInUsers);
        if (isInUsers) {
            ctx.status = 400;
            ctx.body = { message: 'rooms已加入房间' };
            return;
        }


        // 更新用户的rooms字段
        await user.update({
            rooms: [...user.rooms, {
                room_id,
                status: 1,
                time: new Date(),
                room_nickname: '',
                room_title: '',
            }]
        });

        // 更新房间的users字段
        await room.update({
            users: [...room.users, user_id]
        });

        ctx.body = { rooms: user.rooms, message: '加入房间成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { message: err };
    }
});


// 退出房间
router.post('/quitRoom', koaJwt({ secret }), async (ctx) => {
    const { room_id, user_id } = ctx.request.body;
    const schema = Joi.object({
        room_id: Joi.string().required(),
        user_id: Joi.string().required(),
    });
    const { error } = schema.validate({ room_id, user_id });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        // 查询用户
        const user = await User.findOne({ where: { user_id } });
        if (!user) {
            ctx.status = 400;
            ctx.body = { message: '用户不存在' };
            return;
        }

        // 判断用户的rooms字段里有没有room_id
        const isInRooms = user.rooms.some(r => r.room_id === room_id);
        if (!isInRooms) {
            ctx.status = 400;
            ctx.body = { message: 'user不在房间中' };
            return;
        }


        // 查询房间 
        const room = await Room.findOne({ where: { room_id } });
        if (!room) {
            ctx.status = 400;
            ctx.body = { message: '房间不存在' };
            return;
        }

        // 判断房间的users字段里有没有user_id
        const isInUsers = room.users.some(u => u === user_id);
        if (!isInUsers) {
            ctx.status = 400;
            ctx.body = { message: 'rooms不在房间中' };
            return;
        }

        // 更新用户的rooms字段
        await user.update({
            rooms: user.rooms.filter(r => r.room_id !== room_id)
        });

        // 更新房间的users字段
        await room.update({
            users: room.users.filter(u => u !== user_id)
        });

        ctx.body = { rooms: user.rooms, message: '退出房间成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { message: err };
    }
});

// 查询房间里的用户和在线状态
router.post('/getRoomUsers', koaJwt({ secret }), async (ctx) => {
    const { room_id, user_id } = ctx.request.body;
    const schema = Joi.object({
        room_id: Joi.string().required(),
        user_id: Joi.string().required(),
    });
    const { error } = schema.validate({ room_id, user_id });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        let attributes = []
        if(room_id === "666666"){
            attributes = ['room_id']
        }else{
            attributes = ['users']
        }

        // 查询房间
        const room = await Room.findOne({ 
            where: { room_id },
            attributes: attributes,
         });
        if (!room) {
            ctx.status = 400;
            ctx.body = { message: '房间不存在' };
            return;
        }


        // 查询房间里的在线用户
        const usersOnlineFile = path.join(__dirname, '../public/data/users.json');
        const onlineUsers = JSON.parse(fs.readFileSync(usersOnlineFile, 'utf-8'));

        if(room_id === "666666"){
            // 遍历onlineUsers对象，把key值变成数组
            let online = []  // 在线用户
            for (let key in onlineUsers) {
                online.push(key)
            }

            // 查询房间里的用户
            const users = await User.findAll({
                where: {
                    user_id: {
                        [Op.in]: online
                    },
                },
                // 仅返回user_id和nickname字段
                attributes: ['username', 'nickname'],
            });

            // 查询用户总数
            const userCount = await User.count();

            ctx.body = { data: { online: users, offline: userCount - online.length }, message: '获取房间用户成功' };
            return;
        }

        // 查询房间里的用户
        const users = await User.findAll({
            where: {
                user_id: {
                    [Op.in]: room.users,
                },
            },
            // 仅返回user_id和nickname字段
            attributes: ['user_id', 'username', 'nickname'],
        });

        // 标记房间里的用户是否在线,onlineUsers是{"Pony":"0G9amSyN8ecDxBPxAAAB","Pony1":"biU08W3hQ-SA1Mt_AAAB","Pony2":"ced3pTAB4telrEZAAAAC","uid_wDjcBX_-":"mN7eLWo2IVjB-EDqAAAB"}
        // 返回时去掉user_id字段，增加online字段
        let online = []  // 在线用户
        let offline = 0  // 离线用户
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            if (onlineUsers[user.user_id]) {
                user.dataValues.online = true;
                online.push(user);
            } else {
                offline++;
            }
            // 删除 user_id 字段
            delete user.dataValues.user_id;
        }

        ctx.body = { data: { online, offline }, message: '获取房间用户成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { message: err };
    }
});


// 无需jwt查询房间内用户状态
router.get('/easyGetRoomUsers', async (ctx) => {
    const { room_id } = ctx.request.query;
    const schema = Joi.object({
        room_id: Joi.string().required(),
    });
    const { error } = schema.validate({ room_id});
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        // 查询房间里的在线用户
        const usersOnlineFile = path.join(__dirname, '../public/data/users.json');
        const onlineUsers = JSON.parse(fs.readFileSync(usersOnlineFile, 'utf-8'));

        ctx.body = { data: { onlineUsers: Object.keys(onlineUsers).length }, message: '获取房间用户成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { message: err };
    }
});

// 无需jwt查询公开房间100条聊天记录
router.get('/easyGetPublicRoomChatRecords', async (ctx) => {
    try {
        // 查询房间
        const room = await Room.findOne({ 
            where: { room_id: "666666" },
            // 仅返回user_id和nickname字段
            attributes: ['room_id'],
        });
        if (!room) {
            ctx.status = 400;
            ctx.body = { message: '房间不存在' };
            return;
        }

        // 查询房间里的聊天记录
        const chatRecords = await ChatRecord.findAll({
            where: {
                room_id: '666666',
                status: 1,
            },
            attributes: ['msg_id', 'room_id', 'username', 'nickname', 'interact', 'json_msg', 'ymsg','msg', 'type','status','source', 'createdAt'],
            order: [
                ['createdAt', 'DESC'],
            ],
            limit: 100,
        });

        ctx.body = { chatRecords, message: '获取房间聊天记录成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { message: err };
    }
})

// 无需jwt查询房间信息
router.get('/easyGetRoomInfo', async (ctx) => {
    const { room_id } = ctx.request.query;
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
        // 查询房间
        const room = await Room.findOne({ 
            where: { room_id },
            // 仅返回user_id和nickname字段
            attributes: ['room_id', 'name', 'desc', 'avatar', 'users'],
        });
        if (!room) {
            ctx.status = 400;
            ctx.body = { message: '房间不存在' };
            return;
        }

        ctx.body = { data: {
            room_id: room.room_id,
            name: room.name,
            desc: room.desc,
            avatar: room.avatar,
            users: room.users.length,
        }, message: '获取房间信息成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { message: err };
    }
})



// 查询表情包分类
router.post('/getEmojiCategory', koaJwt({ secret }), async (ctx) => {
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
        const emoticons = await chatEmoticon.findAll({
            raw: true,
            attributes: ['category', [Sequelize.fn('COUNT', Sequelize.col('category')), 'count']], // 计算每个分类的数量
            group: ['category'], // 按 category 分组
            order: [
                [Sequelize.fn('COUNT', Sequelize.col('category')), 'ASC'], // 按 count 的值倒序排序
            ]
        });
        

        ctx.body = { emoticons, message: '获取表情包分类成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { message: err };
    }
})


// 查询表情包
router.post('/getEmoji', koaJwt({ secret }), async (ctx) => {
    const { user_id, category_name } = ctx.request.body;
    const schema = Joi.object({
        user_id: Joi.string().required(),
        category_name: Joi.string().required(),
    });
    const { error } = schema.validate({ user_id, category_name });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        const emoticons = await chatEmoticon.findAll({
            where: {
                category: category_name,
            },
            order: [
                ['createdAt', 'DESC'],
            ],
        });

        ctx.body = { emoticons, message: '获取表情包成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { message: err };
    }
})


// 获取互动表情包
router.post('/getInteractEmoticons', koaJwt({ secret }), async (ctx) => {
    try {
        const emoticons = await chatEmoticon.findAll({
            where: {
                type: 'interact',
            },
            order: [
                ['id', 'DESC'],
            ],
        });

        ctx.body = { data: emoticons , message: '获取互动表情包成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { message: err };
    }
})


// 添加应用到房间
router.post('/addAppToRoom', koaJwt({ secret }), async (ctx) => {
    const { room_id, app_id } = ctx.request.body;
    const schema = Joi.object({
        room_id: Joi.string().required(),
        app_id: Joi.string().required(),
    });
    const { error } = schema.validate({ room_id, app_id });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        // 查询房间
        const room = await Room.findOne({ 
            where: { room_id },
            // 仅返回user_id和nickname字段
            attributes: ['id','owner_id', 'apps', 'room_id'], 
        });
        if (!room) {
            ctx.status = 400;
            ctx.body = { message: '房间不存在' };
            return;
        }

        // 是否是群主
        if (room.owner_id !== ctx.state.user.user_id) {
            ctx.status = 400;
            ctx.body = { message: '不是群主' };
            return;
        }

        // 判断是否已经添加过该应用
        const hasApp = room.apps.some(a => a.app_id === app_id);
        if (hasApp) {
            ctx.status = 400;
            ctx.body = { message: '该应用已添加到房间' };
            return;
        }

        // 添加应用到房间
        await room.update({
            apps: [...room.apps, {
                app_id,
                introduce: '',
                interact: {},
                sort: 0,
                createdAt: new Date(),
            }]
        });

        ctx.body = { data: '添加应用到房间成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { message: err };
    }
})


// 获取房间内的应用
router.post('/getRoomApps', koaJwt({ secret }), async (ctx) => {
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
        // 查询房间
        const room = await Room.findOne({ 
            where: { room_id },
            // 筛选字段
            attributes: ['apps', 'room_id'],
        });
        if (!room) {
            ctx.status = 400;
            ctx.body = { message: '房间不存在' };
            return;
        }

        // 循环出app_id
        const apps = room.apps.map(app => app.app_id);

        // 查询应用信息
        const appInfos = await chatApp.findAll({
            raw: true,
            where: {
                status: 1,
                app_id: {
                    [Op.in]: apps,
                },
            },
            order: [
                ['createdAt', 'DESC'],
            ],
        });

        

        // room.apps里的信息合并到appInfos里，所有信息合并
        const appsData = appInfos.map(appInfo => {
            const app = room.apps.find(app => app.app_id === appInfo.app_id);
            return {
                room_app_info:{
                    app_id: appInfo.app_id,
                    introduce: app.introduce,
                    interact: app.interact,
                    sort: app.sort,
                    createdAt: app.createdAt,
                },
                ...appInfo,
            }
        });


        ctx.body = { data: appsData, message: '获取房间内的应用成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { message: err };
    }
})

// 获取房间内文件
router.post('/getRoomFiles', koaJwt({ secret }), async (ctx) => {
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
        // 查询房间
        const room = await Room.findOne({
            where: { room_id },
            attributes: ['room_id'],
        });
        if (!room) {
            ctx.status = 400;
            ctx.body = { message: '房间不存在' };
            return;
        }

        const filesData = await ChatRecord.findAll({
            where: {
                room_id,
                type: 'file',
                status: 1,
            },
            attributes: ['msg_id', 'room_id', 'username', 'nickname', 'type', 'interact', 'json_msg', 'status', 'createdAt'],
            order: [
                ['createdAt', 'DESC'],
            ],
        })

        ctx.body = { data: filesData, message: '获取房间内文件成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { message: err };
    }
})


// 聊天记录互动
router.post('/chatRecordInteract', koaJwt({ secret }), async (ctx) => {
    const { msg_id, username, url, emoticon_id } = ctx.request.body;
    const schema = Joi.object({
        msg_id: Joi.string().required(),
        username: Joi.string().required(),
        url: Joi.string().required(),
        emoticon_id: Joi.string().required(),
    });
    const { error } = schema.validate({ msg_id, username, url, emoticon_id });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        const chatRecordData = await ChatRecord.findOne({
            where: {
                msg_id,
            }
        });
        
        // 如果没有找到该记录，返回错误
        if (!chatRecordData) {
            throw new Error('聊天记录未找到');
        }

        if(chatRecordData.interact === null){
            chatRecordData.interact = [];
        }

        // 更新聊天记录
        await ChatRecord.update({
            interact: [
                ...chatRecordData.interact,
                {
                    username,
                    url,
                    emoticon_id,
                    createdAt: new Date(),
                }
            ]
        }, {
            where: {
                msg_id,
            }
        });

        ctx.body = { data: { msg_id, username, url, emoticon_id } };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { message: err };
    }
})


// 校验是不是群主
router.post('/checkOwner', koaJwt({ secret }), async (ctx) => {
    const { room_id, user_id } = ctx.request.body;
    const schema = Joi.object({
        room_id: Joi.string().required(),
        user_id: Joi.string().required(),
    });
    const { error } = schema.validate({ room_id, user_id });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        // 查询房间
        const room = await Room.findOne(
            { 
                where: { room_id },
                attributes: ['owner_id'],
            },
        );
        if (!room) {
            ctx.status = 400;
            ctx.body = { message: '房间不存在' };
            return;
        }

        // 判断是否是群主
        if (room.owner_id === user_id) {
            ctx.body = { data: true };
        } else {
            ctx.body = { data: false };
        }
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { message: err };
    }
})


// 聊天记录举报
router.post('/chatRecordReport', koaJwt({ secret }), async (ctx) => {
    const { msg_id, reason, user_id, username, content } = ctx.request.body;
    const schema = Joi.object({
        msg_id: Joi.string().required(),
        reason: Joi.string().required(),
        content: Joi.string().required(),
        user_id: Joi.string().required(),
        username: Joi.string().required(),
    });
    const { error } = schema.validate({ msg_id, reason, user_id, username, content });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        const chatRecordData = await ChatRecord.findOne({
            where: {
                msg_id,
            }
        });
        
        // 如果没有找到该记录，返回错误
        if (!chatRecordData) {
            throw new Error('聊天记录未找到');
        }

        let chatReportData = {
            report_id: 'report_' + customAlphabet(nanoidNode, 10)(),
            user_id: user_id,
            username: username,
            affair_id: msg_id,
            type: 'chatMsg',
            reason: reason,
            content: content,
            ip: '',
            status: 1,
        }
        const returnData = await chatReport.create(chatReportData)

        ctx.body = { message: '举报成功', data: returnData };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { message: err };
    }
})


// 获取房间公告
router.post('/getAnnouncementList', koaJwt({ secret }), async (ctx) => {
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
        // 查询房间
        const room = await Room.findOne({ 
            where: { room_id },
            attributes: ['announcement', 'owner_id', 'room_id'],
        });
        if (!room) {
            ctx.status = 400;
            ctx.body = { message: '房间不存在' };
            return;
        }

        // 过滤掉已删除的公告
        const announcementList = room.announcement.filter(a => a.status !== 0);
        ctx.body = { data: announcementList, message: '获取房间公告成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { message: err };
    }
})

// 房间内写入公告
router.post('/writeAnnouncement', koaJwt({ secret }), async (ctx) => {
    const { room_id, content } = ctx.request.body;
    const schema = Joi.object({
        room_id: Joi.string().required(),
        content: Joi.string().required(),
    });
    const { error } = schema.validate({ room_id, content });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        // 查询房间
        const room = await Room.findOne({
            where: { room_id },
            attributes: ['owner_id', 'room_id', 'announcement'],
        });
        if (!room) {
            ctx.status = 400;
            ctx.body = { message: '房间不存在' };
            return;
        }

        // 判断是否是群主
        if (room.owner_id !== ctx.state.user.user_id) {
            ctx.status = 400;
            ctx.body = { message: '不是群主' };
            return;
        }

        room.announcement.push({
            announcement_id: 'at_' + customAlphabet(nanoidNode, 10)(),
            content,
            username: ctx.state.user.username,
            user_id: ctx.state.user.user_id,
            createdAt: new Date(),
        });
        // 写入公告
        await Room.update({
            announcement: room.announcement,
        }, {
            where: {
                room_id,
            },
        });

        ctx.body = { data: room.announcement, message: '写入公告成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { message: err };
    }
})


// 删除公告
router.post('/deleteAnnouncement', koaJwt({ secret }), async (ctx) => {
    const { announcement_id, room_id } = ctx.request.body;
    const schema = Joi.object({
        room_id: Joi.string().required(),
        announcement_id: Joi.string().required(),
    });
    const { error } = schema.validate({ announcement_id, room_id });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        // 查询公告
        const announcement = await Room.findOne({
            where: {
                room_id
            },
            attributes: ['owner_id', 'announcement', 'room_id'],
        });
        if (!announcement) {
            ctx.status = 400;
            ctx.body = { message: '房间不存在' };
            return;
        }
        // 判断是否是群主
        if (announcement.owner_id !== ctx.state.user.user_id) {
            ctx.status = 400;
            ctx.body = { message: '不是群主' };
            return;
        }

        // 删除公告
        announcement.announcement = announcement.announcement.filter(a => a.announcement_id !== announcement_id);
        await Room.update({
            announcement: announcement.announcement,
        }, {
            where: {
                room_id,
            },
        });



        ctx.body = { message: '删除公告成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { message: err };
    }
})


// 房间信息修改头像、名称、简介
router.post('/modifyRoomInfo', koaJwt({ secret }), async (ctx) => {
    const { room_id, avatar, user_id, username, name, desc } = ctx.request.body;
    const schema = Joi.object({
        room_id: Joi.string().required(),
        avatar: Joi.string().required(),
        name: Joi.string().required(),
        desc: Joi.string().allow(''),
        user_id: Joi.string().required(),
        username: Joi.string().required(),
    });
    const { error } = schema.validate({ room_id, avatar, user_id, username, name, desc });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        // 查询房间
        const room = await Room.findOne({
            where: { room_id },
            // 筛选字段
            attributes: ['id', 'owner_id', 'room_id', 'avatar', 'name', 'desc'],
        });
        if (!room) {
            ctx.status = 400;
            ctx.body = { message: '房间不存在' };
            return;
        }

        // 判断是否是群主
        if (room.owner_id !== ctx.state.user.user_id) {
            ctx.status = 400;
            ctx.body = { message: '不是群主' };
            return;
        }

        // 修改房间信息
        await Room.update({
            avatar,
            name,
            desc,
        }, {
            where: {
                room_id,
            },
        });

        ctx.body = { data: { room_id, avatar, name, desc }, message: '修改房间信息成功' };
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { message: err };
    }
})


module.exports = router;