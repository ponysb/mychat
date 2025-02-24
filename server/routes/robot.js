const { User, Room, chatApp, chatReport, ChatRecord, chatEmoticon } = require('../models/models');
const Router = require('koa-router');
const Joi = require('joi');
const { customAlphabet } = require('nanoid');
const { wordFilter } = require('../filter/AhoCorasick');
const { getIo } = require('./socket');
const router = new Router();
const nanoidNode = '1234567890abcdefghijklmnopqrstuvwxyz';

// 发送text/md消息
router.post('/sendMessage', async (ctx) => {
    const { room_id, robot_id,  msg, type, source } = ctx.request.body;
    const { nickname, user_id } = ctx.state.user
    const schema = Joi.object({
        room_id: Joi.string().required(),
        user_id: Joi.string().required(),
        nickname: Joi.string().required(),
        type: Joi.string().required(),
        source: Joi.string().required(),
        msg: Joi.string().required(),
        robot_id: Joi.string().required(),
    });
    const { error } = schema.validate({ room_id, robot_id, msg, user_id, nickname, type, source });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    let msg_filter = await wordFilter(msg);  // 过滤敏感词

    let msg_data = {
        msg_id: 'msg_' + customAlphabet(nanoidNode, 20)(),
        user_id,   // 创建机器人的用户id
        username: robot_id,   // 这里放机器人的id
        room_id,
        nickname,   // 这里放机器人的昵称
        ymsg: msg,
        msg: msg_filter.text,
        type,
        status: 1,
        source,
        interact: [],
        other:{
            user_type: 'robot',
        }
    }
    // 创建聊天记录
    try {
        const newChatRecord = await ChatRecord.create(msg_data);
        ctx.body = { message: '发送消息成功', data: newChatRecord };
    } catch (error) {
        ctx.status = 500;
        ctx.body = { message: err };
    }

    // 向房间内所有用户广播消息
    const io = getIo();
    io.to(room_id).emit('messages', msg_data);
})


// 发送自定义消息custom
router.post('/sendCustom', async (ctx) => {
    const { room_id, robot_id,  msg, type, source } = ctx.request.body;
    const { nickname, user_id } = ctx.state.user
    const schema = Joi.object({
        room_id: Joi.string().required(),
        user_id: Joi.string().required(),
        nickname: Joi.string().required(),
        type: Joi.string().required(),
        source: Joi.string().required(),
        msg: Joi.string().required(),
        robot_id: Joi.string().required(),
    });
    const { error } = schema.validate({ room_id, robot_id, msg, user_id, nickname, type, source });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    let msg_data = {
        msg_id: 'msg_' + customAlphabet(nanoidNode, 20)(),
        user_id,   // 创建机器人的用户id
        username: robot_id,   // 这里放机器人的id
        room_id,
        nickname,   // 这里放机器人的昵称
        ymsg: msg,
        msg,
        type,
        status: 1,
        source,
        interact: [],
        other:{
            user_type: 'robot',
        }
    }
    // 创建聊天记录
    try {
        const newChatRecord = await ChatRecord.create(msg_data);
        ctx.body = { message: '发送消息成功', data: newChatRecord };
    } catch (error) {
        ctx.status = 500;
        ctx.body = { message: err };
    }

    // 向房间内所有用户广播消息
    const io = getIo();
    io.to(room_id).emit('messages', msg_data);
})




module.exports = router;