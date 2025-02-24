const { Server } = require('socket.io');
const fs = require("fs");
const path = require('path');
const dayjs = require('dayjs');
let io;

function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
          },
    });

    io.on("error", (error) => {
        console.log("Socket.IO Error:", error);
    });

    // 链接
    io.on("connection", (socket) => {

        // 正常用户连接
        if(socket.handshake.query.user_id){
            // console.log("User connected:", socket.handshake.query.user_id);
            // 将连接数据保存到本地目录的server/public/data/users.json文件中
            // 格式：{user_id: socket.id}
            // 读取文件内容
            // socket.join(['666666'], (e) => {
            //     console.log(`Joined room: ${e}`);
            // });

            // 保存连接信息到本地文件
            const filePath = path.join(__dirname, '../public/data/users.json');
            let users = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            // 获取在线用户数量
            const userCount = Object.keys(users).length;
            // console.log("当前在线用户数量:", userCount);
            // 读取../public/data/PeakOnline.json文件内容
            const peakOnlinePath = path.join(__dirname, '../public/data/peakOnline.json');
            let peakOnline = JSON.parse(fs.readFileSync(peakOnlinePath, 'utf-8'));
            // 查询今天年月日在不在
            if(peakOnline[dayjs().format('YYYY-MM-DD')]){
                if(peakOnline[dayjs().format('YYYY-MM-DD')].online < userCount+1){
                    peakOnline[dayjs().format('YYYY-MM-DD')].online = userCount+1;
                    fs.writeFileSync(peakOnlinePath, JSON.stringify(peakOnline));
                }
            }else{
                peakOnline[dayjs().format('YYYY-MM-DD')] = {
                    online: userCount+1,
                }
                fs.writeFileSync(peakOnlinePath, JSON.stringify(peakOnline));
            }


            // 保存上线的用户
            users[socket.handshake.query.user_id] = socket.id;
            fs.writeFileSync(filePath, JSON.stringify(users));

            // 返回连接成功
            socket.emit("connected", socket.handshake.query.user_id+"连接成功");
        }

        // 机器人链接
        if(socket.handshake.query.robot_id){
            const { robot_id, key } = socket.handshake.query;
            // 加载../public/data/robot.json文件内容
            const robotPath = path.join(__dirname, '../public/data/robot.json');
            let robot = JSON.parse(fs.readFileSync(robotPath, 'utf-8'));
            if(robot[key]&&robot[key].robot_id === robot_id){
                // 验证机器人key是否正确
                socket.emit("connected", "机器人连接成功");

                // 保存机器人连接信息到本地文件
                const filePath = path.join(__dirname, '../public/data/robotOnline.json');
                let robotOnline = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                robotOnline[key] = {
                    socket_id: socket.id,
                    robot_id,
                }
                fs.writeFileSync(filePath, JSON.stringify(robotOnline));

                // 加入房间
                socket.join(robot[key].rooms, (e) => {
                    console.log(`Joined room: ${e}`);
                });
            }else{
                // 错误禁止连接
                socket.disconnect(true);
            }
        }

        // 加入房间
        socket.on("join_room", (data) => {
            const { rooms } = data;
            // 加入房间
            socket.join(rooms, (e) => {
                console.log(`Joined room: ${e}`);
            });

            // io.to(rooms).emit("messages", rooms);

        });


        // 断开连接
        socket.on("disconnect", () => {

            // 用户断开连接
            if(socket.handshake.query.user_id){
                // console.log("User disconnected"+socket.id);
                // 删除本地目录的server/public/data/users.json文件中对应user_id的记录
                const filePath = path.join(__dirname, '../public/data/users.json');
                let users = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                for (const key in users) {
                    if (users[key] === socket.id) {
                    // console.log(`Key: ${key}, Value: ${users[key]}`);
                        delete users[key];
                    }
                }

                fs.writeFileSync(filePath, JSON.stringify(users));
            }

            // 机器人断开连接
            if(socket.handshake.query.robot_id){
                const { key } = socket.handshake.query;
                // 加载../public/data/robotOnline.json文件内容
                const robotOnlinePath = path.join(__dirname, '../public/data/robotOnline.json');
                let robotOnline = JSON.parse(fs.readFileSync(robotOnlinePath, 'utf-8'));
                if(robotOnline[key]){
                    // 删除本地目录的server/public/data/robotOnline.json文件中对应key的记录
                    delete robotOnline[key];
                    fs.writeFileSync(robotOnlinePath, JSON.stringify(robotOnline));
                }
            }

        });
    });
}

function getIo() {
    if (!io) {
        throw new Error('Socket.IO not initialized!');
    }
    return io;
}

module.exports = { initSocket, getIo };
