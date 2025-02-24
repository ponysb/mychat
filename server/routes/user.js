const { User, Room, ChatRecord } = require('../models/models');
const { Op } = require('sequelize');
const Router = require('koa-router');
const Joi = require('joi');
const { customAlphabet } = require('nanoid');
const router = new Router();
const jwt = require('jsonwebtoken');
const koaJwt = require('koa-jwt');
const fs = require('fs');
const path = require('path');
const sha256 = require("crypto-js/sha256");
const axios = require('axios');
const koaBody = require('koa-body').default;
const nanoidNode = '1234567890abcdefghijklmnopqrstuvwxyz';
const secret = '@5.0.0node_mdex.js:109:16';

// 注册
router.post('/register', async (ctx) => {
    const { username, password, invite } = ctx.request.body;

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
    // 先检查用户名是否存在
    const user = await User.findOne({ where: { username } });
    if (user) {
      ctx.status = 400;
      ctx.body = { message: '用户名已存在' };
      return;
    }
    try {
        let user_id = 'uid_' + customAlphabet(nanoidNode, 10)();
        const user = await User.create({
            username, 
            password,
            user_id: user_id,
            status: 1,
            nickname: username,
            invite: invite,
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
        ctx.body = { message: '注册成功', user: user };
    } catch (err) {
        ctx.status = 500;
        ctx.body = { message: err };
    }
});


// 新登录
router.post('/login', async (ctx) => {
    const { email, code, invite } = ctx.request.body;
    // 校验请求体数据
    const schema = Joi.object({
        email: Joi.string().required(),
        code: Joi.string().required(),
        invite: Joi.string().allow(''),
    }).options({ abortEarly: false });

    const { error } = schema.validate(ctx.request.body);
    if (error) {
        ctx.status = 400;
        ctx.body = { error: error.details[0].message };
        return
    }

    try{
        // 校验验证码
        const res = await axios.post('https://account.roots.zyy.muo.cc/', {
            "ac": "email_code_login_verify",
            "user": email,
            "code": code,
        });
    
        // 验证码正确
        if (res.data.code === 200) {
            // 查询user库用户在不在
            const user = await User.findOne({ where: { username:res.data.data.uid } });
            if (!user) {
                // 注册
                let user_id = 'uid_' + customAlphabet(nanoidNode, 10)();
                const user = await User.create({
                    username: res.data.data.uid, 
                    password: sha256('123456').toString(),
                    user_id: user_id,
                    status: 1,
                    email,
                    nickname: '没有昵称的老6',
                    invite,
                    rooms: [{
                        room_id: '666666',
                        status: 1,
                        time: new Date(),
                        room_nickname: '',  // 房间昵称
                        room_title: '',  // 房间备注
                    }]
                });
                const token = jwt.sign({ user_id: user.user_id, username: user.username, token: res.data.data.token }, secret, { expiresIn: '1w' });
                const room_users = await Room.findOne({raw: true, where: { room_id: '666666' } });
                let users = room_users.users;
                users.push(user_id);
                await Room.update({ users: users }, { where: { room_id: '666666' } });
                // token存入./public/jwt.json文件中
                const tokenFile = path.join(__dirname, '../public/jwt.json');
                const tokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
                tokenData[user.user_id] = {
                    token: token,
                    username: res.data.data.uid,
                };
                fs.writeFileSync(tokenFile, JSON.stringify(tokenData));
                
                ctx.body = { message: '注册成功', data: { 
                    user_id: user.user_id,
                    rooms: user.rooms,
                    username: user.username,
                    avatar: user.avatar,
                    nickname: user.nickname,
                    status: user.status,
                    email: user.email,
                    phone: user.phone,
                    gender: user.gender,
                    friends: user.friends,
                    signature: user.signature,
                    token,
                 } };
            }

            if(user){
                // 登录
                const token = jwt.sign({ user_id: user.user_id, username: user.username, token: res.data.data.token }, secret, { expiresIn: '1w' });
                // token存入./public/jwt.json文件中
                const tokenFile = path.join(__dirname, '../public/jwt.json');
                const tokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
                tokenData[user.user_id] = {
                    token: token,
                    username: user.username,
                };
                fs.writeFileSync(tokenFile, JSON.stringify(tokenData));
                ctx.body = {
                    message: '登录成功',
                    data: {
                        user_id: user.user_id,
                        rooms: user.rooms,
                        username: user.username,
                        avatar: user.avatar,
                        nickname: user.nickname,
                        status: user.status,
                        email: user.email,
                        phone: user.phone,
                        gender: user.gender,
                        friends: user.friends,
                        signature: user.signature,
                        token,
                    }
                };
            }

        }

        // 验证码错误
        if(res.data.code != 200){
            ctx.status = 400;
            ctx.body = { error: "验证码错误" };
            return;
        }

    } catch (err) {
        ctx.status = 500;
        console.log(err);
        ctx.body = { error: err };
    }


})


// 校验登录状态
router.post('/check_login', koaJwt({ secret }), async (ctx) => {
    const { user_id } = ctx.request.body;
    const user = await User.findOne({ where: { user_id } });
    if (!user) {
        ctx.status = 401;
        ctx.body = { message: '用户不存在' };
        return;
    }

    let rooms = []
    user.rooms.forEach(room => {
        // console.log(room)
        rooms.push(room.room_id)
    })

    const user_rooms = await Room.findAll({
        where: {
            room_id: {
                [Op.in]: rooms
            }
        },
        attributes: [
            'room_id',
            'avatar',
            'desc',
            'name',
            'status',
            'type',
        ],
    });

    ctx.body = {
        message: '登录成功',
        data: {
            rooms: {
                rooms_id: rooms,  // 房间id数组
                rooms_body: user_rooms,  // 房间信息数组
                rooms: user.rooms,    // 用户在房间内的信息
            },
            user_id: user.user_id,
            username: user.username,
            avatar: user.avatar,
            nickname: user.nickname,
            status: user.status,
            email: user.email,
            phone: user.phone,
            gender: user.gender,
            friends: user.friends,
            signature: user.signature,
        }
    };
});



// 抓鱼鸭传过来的用户信息
router.post('/zhuayuya_check', async (ctx) => {
    const { username, nickname, email } = ctx.request.body;
    const schema = Joi.object({
        username: Joi.string().required(),
        nickname: Joi.string().required(),
        email: Joi.string().email().required(),
    }).options({ abortEarly: false });
    const { error } = schema.validate({ username, nickname, email });
    if (error) {
        ctx.status = 400;
        ctx.body = { error: error.details[0].message };
        return;
    }

    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {

            const res = await axios.post('https://account.roots.zyy.muo.cc/', JSON.stringify({
                "ac": "isuser",
                "uid": ctx.request.body.user_id,
            }));

            // 用户不存在
            if (res.data.code != 200||res.data.data.activate) {
                ctx.status = 400;
                ctx.body = { message: '用户不存在', data: { username, nickname, email } };
                return;
            }


            // 注册
            let user_id = 'uid_' + customAlphabet(nanoidNode, 10)();
            const user = await User.create({
                username, 
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
            const jwt_token = jwt.sign({ user_id: user.user_id, username: user.username, token: 'TOKEN_' + customAlphabet(nanoidNode, 10)() }, secret, { expiresIn: '1w' });
            const room_users = await Room.findOne({raw: true, where: { room_id: '666666' } });
            let users = room_users.users;
            users.push(user_id);
            await Room.update({ users: users }, { where: { room_id: '666666' } });

            // token存入./public/jwt.json文件中
            const tokenFile = path.join(__dirname, '../public/jwt.json');
            const tokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
            tokenData[user.user_id] = {
                token: jwt_token,
                username: username,
            };
            fs.writeFileSync(tokenFile, JSON.stringify(tokenData));

            ctx.body = { message: '注册成功', data: { user_id: user.user_id, token: jwt_token } };

            
        } else {
            const jwt_token = jwt.sign({ user_id: user.user_id, username: user.username, token: 'TOKEN_' + customAlphabet(nanoidNode, 10)() }, secret, { expiresIn: '1w' });
            // token存入./public/jwt.json文件中
            const tokenFile = path.join(__dirname, '../public/jwt.json');
            const tokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
            tokenData[user.user_id] = {
                token: jwt_token,
                username: username,
            };
            fs.writeFileSync(tokenFile, JSON.stringify(tokenData));
            ctx.body = { message: '用户已存在', data: { user_id: user.user_id, token: jwt_token }  };
        }
    } catch (err) {
        ctx.status = 500;
        console.log(err);
        ctx.body = { message: err };
    }
})


// 上传个人头像
router.post('/uploadUserAvatar', koaJwt({ secret }), koaBody({    // 注册文件上传中间件
    multipart: true,
    formidable: {
        keepExtensions: true, // 保留文件扩展名
        maxFieldsSize: 500 * 1024, // 限制文件500kb
        uploadDir: path.join(__dirname, '../public/avatar/uploads'), // 上传目录
    },
}), async (ctx) => {
    const files = ctx.request.files;
    const file = files?.file; // 假设上传字段名为 'avatar'
    const username = ctx.state.user.username;

    if (file) {
      const ext = path.extname(file.originalFilename).toLowerCase();

      // 检查文件格式
      if (!['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) {
        throw new Error(`文件格式不支持，仅允许上传以下格式：${['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].join(', ')}`);
      }

      const newFilename = `${username}${ext}`;
      const newPath = path.join(__dirname, '../public/avatar/user', newFilename);

      // 更新 JSON 数据和删除旧文件
      const userAvatarFile = path.join(__dirname, '../public/data/userAvatar.json');
      const userAvatarData = JSON.parse(fs.readFileSync(userAvatarFile, 'utf-8'));
      if (!userAvatarData[username]) {
        userAvatarData[username] = newFilename;
      } else {
        const oldPath = path.join(__dirname, '../public/avatar/user', userAvatarData[username]);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      userAvatarData[username] = newFilename;
      fs.writeFileSync(userAvatarFile, JSON.stringify(userAvatarData, null, 2));

      // 移动文件到新路径
      fs.renameSync(file.filepath, newPath);

      ctx.body = { message: '上传成功', data: { newFilename } };
    } else {
      ctx.throw(400, '没有检测到上传文件');
    }
})

// 个人头像请求
router.get('/getUserAvatar/:username', async (ctx) => {
    const { username } = ctx.params;
    const userAvatarFile = path.join(__dirname, '../public/data/userAvatar.json');
    const userAvatarData = JSON.parse(fs.readFileSync(userAvatarFile, 'utf-8'));
    const avatar = userAvatarData[username] || 'default.jpg';
    // console.log(userAvatarData);
    ctx.response.set('Content-Type', 'image/jpeg');
    ctx.body = fs.createReadStream(path.join(__dirname, '../public/avatar/user', avatar));
});

// 修改个人信息
router.post('/modifyUserInfo', koaJwt({ secret }), async (ctx) => {
    const { user_id, username, nickname, avatar, signature } = ctx.request.body;
    const schema = Joi.object({
        user_id: Joi.string().required(),
        username: Joi.string().required(),
        nickname: Joi.string().required(),
        avatar: Joi.string().required(),
        signature: Joi.string().allow(''),
    });
    const { error } = schema.validate({ user_id, username, nickname, avatar, signature });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }


    const user = await User.findOne({ where: { user_id } });
    if (!user) {
        ctx.status = 401;
        ctx.body = { message: '用户不存在' };
        return;
    }
    try {

        // 修改聊天记录中的昵称
        if (user.nickname!== nickname) {
            await ChatRecord.update({
                nickname: nickname,
            }, {
                where: {
                    user_id: user_id,
                },
            });
        }

        await user.update({
            nickname,
            avatar,
            signature,
        });
        ctx.body = { data: { nickname, avatar, signature }, message: '修改成功' };
    } catch (err) {
        ctx.status = 500;
        ctx.body = { message: err };
    }
});


// 导出
module.exports = router;
