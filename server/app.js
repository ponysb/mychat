const Koa = require("koa");
const bodyParser = require('koa-bodyparser');
const static = require('koa-static');
const http = require("http");
const { Server } = require("socket.io");
const cors = require("@koa/cors");
const fs = require("fs");
const path = require('path');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const geoip = require('geoip-lite');
const DailyRotateFile = require('winston-daily-rotate-file');
const UAParser = require("ua-parser-js");
const { onerror } = require('koa-onerror');
const timeout = require('koa-timeout');
require('./models/models');
const { DataStatistics, SignIn,initializeDatabase } = require('./models/models');
const { Op } = require('sequelize');
const userRouter = require('./routes/user');
const chatRouter = require('./routes/chat');
const chatAppRouter = require('./routes/chatApp');
const sysStateRouter = require('./routes/sysState');
const lantuPayRouter = require('./routes/lantuPay');
const toPayRouter = require('./routes/toPay');
const timedRouter = require('./routes/timed');
const adminRouter = require('./routes/admin');
const zhuayuyaRouter = require('./routes/zhuayuya');
const { initSocket } = require('./routes/socket');
const robotRouter = require('./routes/robot');
const mount = require('koa-mount');
require('dotenv').config(); // 引入dotenv来加载.env文件中的环境变量
const secret = '@5.0.0node_mdex.js:109:16';

const app = new Koa();

app.use(bodyParser());
// 使用 http.createServer 包装 Koa 应用并添加错误处理
const server = http.createServer((req, res) => {
    // 捕获 HTTP 请求流中的错误
    req.on('error', (err) => {
        console.log(err);  // 捕获请求错误
    });

    // 捕获 HTTP 响应流中的错误
    res.on('error', (err) => {
        console.log(err);  // 捕获请求错误
    });

    // 将 Koa 应用的请求处理委托给 server
    app.callback()(req, res);
});

app.use(timeout(10000)); // 设置请求超时为 10 秒




initSocket(server);
app.use(cors());

// 头像静态资源配置
app.use(static(
    path.join(__dirname, './public/avatar')
));

// 聊天信息发送图片静态资源配置
app.use(mount('/chatImages', static(
    path.join(__dirname, './public/chatImages')
)));

// 聊天室发送文件静态资源配置
app.use(mount('/chatFiles', static(
    path.join(__dirname, './public/chatFiles')
)));

// jwt解码中间件
app.use(async (ctx, next) => {

    // 判断是否有/admin/
    if (ctx.url.includes('/admin/')) {
        await next();
        return;
    }

    // 判断是否有/zhuayuya_check
    if (ctx.url.includes('zhuayuya_check')) {
        await next();
        return;
    }

    // 判断是否有/zhuayuya/
    if (ctx.url.includes('/zhuayuya/')) {
        await next();
        return;
    }


    // 判断是否有/robot/
    if (ctx.url.includes('/robot/')) {
        await next();
        return;
    }

    // 判断是否为登录请求
    if (ctx.url.includes('/login')) {
        await next();
        return;
    }


    // 判断是否为注册请求
    if (ctx.url.includes('/register')) {
        await next();
        return;
    }


    // 判断是未登录状态请求数据
    if (ctx.url.includes('/getPublicRoomList')) {
        await next();
        return;
    }


    // 判断是否为post
    if (ctx.method === 'POST') {
        let token = ctx.request.headers.authorization;
        if (token) {
            token = token.replace('Bearer ', '');
            try {
                const decoded = jwt.verify(token, secret);
                if(decoded.user_id){
                    // 在请求数据里增加user_id字段
                    ctx.request.body.user_id = decoded.user_id;
                    ctx.request.body.username = decoded.username;

                    ctx.state.user = {
                        user_id: decoded.user_id,
                        username: decoded.username
                    };
                }else{
                    return ctx.status = 401, ctx.body = { message: '请登录' };
                }
                
            } catch (err) {
                console.log(err);
            }
        }
        await next();
    }else{
        await next();
    }
});

// 日志配置
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} [${level}]: ${message}`;
      })
    ),
    transports: [
      new DailyRotateFile({
        filename: 'server/public/logs/logs-%DATE%.log', // 文件名模式
        datePattern: 'YYYY-MM-DD',              // 每天一个文件
        zippedArchive: true,                    // 是否压缩旧文件
        maxSize: '10m',                         // 文件大小限制
      }),
    //   new winston.transports.Console(),         // 控制台输出

    // 错误日志存储到 error 目录
    new DailyRotateFile({
        filename: 'server/public/errorlogs/%DATE%-error.log', // 错误日志路径
        datePattern: 'YYYY-MM-DD',  // 按天分文件
        zippedArchive: true,        // 旧日志压缩
        maxSize: '10m',             // 每个日志文件最大10MB
        level: 'error',             // 只记录 error 级别的日志
    }),
    ],
});

// 注册日志中间件
app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    const realIp = ctx.headers['x-forwarded-for'] ? ctx.headers['x-forwarded-for'].split(',')[0].trim() : ctx.ip;
    const geo = geoip.lookup(realIp); // 获取客户端IP地址的地理位置信息
    logger.info(` IP: ${realIp}, Location: ${geo ? `${geo.city}, ${geo.country}` : 'Unknown'}, Protocol: ${ctx.req.protocol || 'HTTP/1.1'}, Method: ${ctx.method}, URL: ${ctx.url}, Query: ${JSON.stringify(ctx.query)}, Request Body: ${JSON.stringify(ctx.request.body)}, Status: ${ctx.status}, Response Time: ${ms}ms, Request Size: ${ctx.length || 0}, Response Size: ${ctx.response.length || 0}, Referer: ${ctx.headers['referer'] || 'None'}, Accept-Language: ${ctx.headers['accept-language'] || 'None'}, Host: ${ctx.host}, User-Agent: ${ctx.headers['user-agent']}, Content-Type: ${ctx.response.get('Content-Type') || 'None'}`);
});


// 错误捕获处理中间件
onerror(app, {
    // 自定义错误处理函数
    all(err, ctx) {
      const timestamp = new Date().toISOString();  // 捕获错误发生的时间

      // 获取详细的堆栈信息
      const stack = err.stack || 'No stack trace available';
      const errorDetails = `Error occurred at ${timestamp}: ${err.message}\nStack trace:\n${stack}`;

      // 输出错误的堆栈信息
      console.error(errorDetails);

      // 记录错误日志到日志文件（包括堆栈信息）
      logger.error(errorDetails);

      // 处理 ECONNRESET 错误
      if (err.code === 'ECONNRESET') {
        ctx.status = 500;
        ctx.body = 'Connection reset by peer';
      } else {
        // 处理其他未知错误
        ctx.status = err.status || 500;
        ctx.body = {
          message: err.message || 'Internal Server Error',
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined, // 开发环境显示堆栈信息
        };
      }
    },
});





async function startServer() {
    // 等待数据库初始化完成
    await initializeDatabase();
    require('./routes/initialize')


    // 访问统计插件
    const parser = new UAParser();
    app.use(async (ctx, next) => {

        ctx.type = 'svg+xml';
        ctx.body = Buffer.from('PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3Lnd3Lm9yZy/5FNSf8IS35HBDubhpL+FShjJhyg==', 'base64');
        // 检测访问/img/1px
        if (ctx.url == '/img/1px') {
            let realIp = ctx.headers['x-forwarded-for'] ? ctx.headers['x-forwarded-for'].split(',')[0].trim() : ctx.ip;
            let geo = geoip.lookup(realIp);
            let statistcs = {
                ip: realIp,
                ua: ctx.headers['user-agent'],
                url: ctx.url,
                geo: JSON.stringify(geo),
                referer: ctx.headers.referer,
                user_agent: parser.setUA(ctx.headers['user-agent']).getResult() || [],
                // user_id: ctx.state.user.user_id || null,
                // username: ctx.state.user.username || null,
            }
            await DataStatistics.create(statistcs);
            // console.log(statistcs);
            return;
        }else{
            await next();
        }
    });


    // 机器人中间件
    app.use(async (ctx, next) => {
        // 判断是否为机器人请求
        if (ctx.url.includes('/robot/')) {
            // 加载./public/data/robot.json文件

            const { key, robot_id, room_id, type } = ctx.request.body;
            let robotData = JSON.parse(fs.readFileSync(path.join(__dirname, './public/data/robot.json')));
            
            if(robotData[key]){
                if(robotData[key].robot_id != robot_id){
                    // 机器人id错误
                    ctx.body = {
                        message: '机器人id错误',
                    }
                    return;
                }

                // 状态判断
                if(robotData[key].status != 1){
                    ctx.body = {
                        message: '机器人未启用状态',
                    }
                    return;
                }


                // 判断rooms数组是否包含room_id
                if(robotData[key].rooms.includes(room_id)&&robotData[key].message_type.includes(type)){
                    // 包含则返回机器人回复
                    ctx.state.user = {
                        nickname: robotData[key].nickname,
                        user_id: robotData[key].user_id,
                    };
                    await next();
                    return;
                }else{
                    // 不包含则返回错误信息
                    ctx.body = {
                        message: '机器人未加入该房间或不支持此消息类型',
                    }
                    return;
                }
            }else{
                ctx.body = {
                    message: 'key错误',
                }
                return;
            }
        }else{
            await next();
        }
    });


    // 聊天封禁中间件
    app.use(async (ctx, next) => {
        // 判断是否为聊天封禁请求
        if (ctx.url.includes('/sendMessage')||ctx.url.includes('/sendFile')||ctx.url.includes('/sendEmoticon')||ctx.url.includes('/sendAppMessage')||ctx.url.includes('/sendCustomImage')) {
            const realIp = ctx.headers['x-forwarded-for'] ? ctx.headers['x-forwarded-for'].split(',')[0].trim() : ctx.ip;
            // 加载./public/data/banned.json文件
            let bannedData = JSON.parse(fs.readFileSync(path.join(__dirname, './public/data/banned.json')));
            bannedData.forEach(item => {
                if(item.user_id == ctx.state.user.user_id||item.ip == realIp){
                    // 封禁用户
                    ctx.body = {
                        message: '你已被封禁，请联系管理员',
                    }
                    return;
                }
            })
            await next();
        }else{
            await next();
        }
    })



    // 注册路由
    userRouter.prefix('/api/v1/users');
    chatRouter.prefix('/api/v1/chats');
    chatAppRouter.prefix('/api/v1/chatApps');
    sysStateRouter.prefix('/api/v1/sysState');
    lantuPayRouter.prefix('/api/v1/pay');
    toPayRouter.prefix('/api/v1/topay');
    timedRouter.prefix('/api/v1/timed');
    adminRouter.prefix('/api/v1/admin');
    robotRouter.prefix('/api/v1/robot');
    zhuayuyaRouter.prefix('/api/v1/zhuayuya');
    app.use(userRouter.routes()).use(userRouter.allowedMethods());
    app.use(chatRouter.routes()).use(chatRouter.allowedMethods());
    app.use(chatAppRouter.routes()).use(chatAppRouter.allowedMethods());
    app.use(sysStateRouter.routes()).use(sysStateRouter.allowedMethods());
    app.use(lantuPayRouter.routes()).use(lantuPayRouter.allowedMethods());
    app.use(toPayRouter.routes()).use(toPayRouter.allowedMethods());
    app.use(timedRouter.routes()).use(timedRouter.allowedMethods());
    app.use(adminRouter.routes()).use(adminRouter.allowedMethods());
    app.use(robotRouter.routes()).use(robotRouter.allowedMethods());
    app.use(zhuayuyaRouter.routes()).use(zhuayuyaRouter.allowedMethods());


    server.listen(process.env.PORT || 9527, () => {
        console.log("Server running on http://localhost:"+process.env.PORT || 9527);
    });

}



startServer().catch(err => {
    console.error('Error during server startup:', err);
    process.exit(1); // 启动失败时退出
});