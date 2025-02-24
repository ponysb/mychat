const { Room, AdminUser } = require('../models/models');
const { customAlphabet } = require('nanoid');
const sha256 = require("crypto-js/sha256");
const nanoidNode = '1234567890abcdefghijklmnopqrstuvwxyz';

// 初始化房间
initRooms()
async function initRooms() {
    try {
        // 获取id为666666的房间
        const room = await Room.findOne({
            where: {
                room_id: '666666'
            }
        });
        if (room) {
            console.log('初始房间666666已存在！');
            return;
        }
        // 创建初始房间
        const newRoom = await Room.create({
            room_id: '666666',
            name:"摸鱼自习室",
            avatar:"default.jpg",
            owner_id: "admin",
            desc:"摸鱼聊天室初始化系统房间，欢迎来这里一起摸鱼！",
            type: 1,
            status: 1,
            users: [],
            apps: [],
            announcement: []
        });
        console.log('初始化房间成功！');

    } catch (error) {
        console.log(error);
    }
}


// 初始化系统管理员
initAdminUser()
async function initAdminUser() {
    try {
        // 查询用户名为admin的用户
        const user = await AdminUser.findOne({
            where: {
                username: 'admin'
            }
        });
        if (user) {
            console.log('初始系统管理员admin已存在！');
            return;
        }

        const newUser = await AdminUser.create({
            user_id: 'admin_' + customAlphabet(nanoidNode, 10)(),
            username:"admin",
            password: sha256("123456").toString(),
            name:"系统管理员",
        });
        console.log('初始化系统管理员成功，用户名为admin,密码为123456！');

    } catch (error) {
        console.log(error);
    }
}