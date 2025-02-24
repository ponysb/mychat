const { User, ChatRecord, Room } = require('../models/models');
const Router = require('koa-router');
const Joi = require('joi');
const { customAlphabet } = require('nanoid');
const sha256 = require("crypto-js/sha256");
const router = new Router();
const { wordFilter } = require('../filter/AhoCorasick');
const nanoidNode = '1234567890abcdefghijklmnopqrstuvwxyz';

const axios = require('axios');


// 查用户
router.post('/user', async (ctx) => {
    // 校验请求体数据
    const schema = Joi.object({
        user_id: Joi.string().required(),
        token: Joi.string().required(),
    }).options({ abortEarly: false });

    const { error } = schema.validate(ctx.request.body);
    if (error) {
        ctx.status = 400;
        ctx.body = { error: error.details[0].message };
        return
    }

    //判断用户是否存在
    try {
        const res = await axios.post('https://account.roots.zyy.muo.cc/', JSON.stringify({
            "ac": "isuser",
            "uid": ctx.request.body.user_id,
            "token": ctx.request.body.token,
        }));
        // console.log(res.data);
    
        if (res.data.code != 200) {
            ctx.status = 400;
            ctx.body = { error: "用户不存在" };
            return;
        }

        if(res.data.code == 200){
            // 查询摸鱼聊天室是否存在
            const isUser = await User.findOne({
                where: {
                    username: ctx.request.body.user_id,
                }
            });
            // console.log(isUser);
            if (!isUser) {
                // 注册用户
                let user_id = 'uid_' + customAlphabet(nanoidNode, 10)();
                const user = await User.create({
                    username: res.data.data.uid, 
                    password: sha256('123456').toString(),  
                    user_id: user_id,
                    status: 1,
                    email: res.data.data.email,
                    nickname: res.data.data.nickname,
                    invite: 'zhuayuya',
                    rooms: [{
                        room_id: '666666',
                        status: 1,
                        time: new Date(),
                        room_nickname: '',  // 房间昵称
                        room_title: '',  // 房间备注
                    }]
                });

                const room_users = await Room.findOne({raw: true, where: { room_id: '666666' } });
                let users = room_users.users;
                users.push(user_id);
                await Room.update({ users: users }, { where: { room_id: '666666' } });

                ctx.status = 200;
                ctx.body = { msg: "用户存在已加入用户",data: { nickname: res.data.data.nickname, email: res.data.data.email } };
                return;
            }else{
                ctx.status = 200;
                ctx.body = { msg: "用户存在",data: {nickname: isUser.nickname, email: isUser.email} };
                return;
            }

        }
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: "服务器错误" };
        return;
    }

});


// 修改昵称
router.post('/nickname', async (ctx) => {
    // 校验请求体数据
    const schema = Joi.object({
        token: Joi.string().required(),
        user_id: Joi.string().required(),
        nickname: Joi.string().required(),
    }).options({ abortEarly: false });

    const { error } = schema.validate(ctx.request.body);
    if (error) {
        ctx.status = 400;
        ctx.body = { error: error.details[0].message };
        return
    }


    //判断用户是否存在
    try {
        const res = await axios.post('https://account.roots.zyy.muo.cc/', JSON.stringify({
            "ac": "islogin",
            "uid": ctx.request.body.user_id,
            "token": ctx.request.body.token,
        }));
    
        if (res.data.code != 200) {
            ctx.status = 400;
            ctx.body = { error: "用户不存在" };
            return;
        }
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = { error: "服务器错误" };
        return;
    }

    // 如果敏感返回报错
    let data = await wordFilter(ctx.request.body.nickname);
    if(data.words.length != 0){
        ctx.status = 400;
        ctx.body = { error: '昵称过于敏感了哦~' };
        return;
    }

    // 去数据库修改用户表昵称
    let result = await User.update({ nickname: ctx.request.body.nickname }, {
        where: {
            username: ctx.request.body.user_id,
        }
    });

    // 去数据库修改聊天表昵称
    let chat_result = await ChatRecord.update({ nickname: ctx.request.body.nickname },{
        where: {
            username: ctx.request.body.user_id,
        }
    })

    if (!result || !chat_result) {
        ctx.status = 400;
        ctx.body = { error: "修改失败" };
        return
    }


    ctx.body = {
        code: 200,
        msg: '修改成功',
        data: result
    }
});

// 导出
module.exports = router;
