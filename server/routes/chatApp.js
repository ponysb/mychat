const { User, Room, chatAppComment, chatApp } = require('../models/models');
const { Op, Sequelize } = require('sequelize');
const Router = require('koa-router');
const Joi = require('joi');
const { customAlphabet } = require('nanoid');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const koaJwt = require('koa-jwt');
const { chromium } = require('playwright');
const koaBody = require('koa-body').default;
const { wordFilter } = require('../filter/AhoCorasick');

const router = new Router();
const secret = '@5.0.0node_mdex.js:109:16';
const nanoidNode = '1234567890abcdefghijklmnopqrstuvwxyz';

// 聊天室获取app路由
router.post('/getApp', koaJwt({ secret }), async (ctx) => {
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
        const appList = await chatApp.findAll({
            where: { status: 1 },
            order: [['category', 'ASC']], // 按 category 字段升序排列
        });
    
        // 初始化返回的数据结构
        const groupedAppList = {
            recommended: [],  // 存放推荐应用
            groupedByCategory: [], // 存放按 category 字段分组的应用
        };
    
        let currentGroup = null;
        let ungroupedCategory = null; // 用于标记未分组的分类

        appList.forEach((app) => {
            let { category: categoryName, top, ...appInfo } = app.dataValues; // 修改为 let
    
            // 处理推荐应用
            if (top) {
                groupedAppList.recommended.push(appInfo);
                return; // 推荐的应用不再参与分类
            }
    
            // 处理 category 字段为空或 null 的应用，归为 "未分组"
            if (!categoryName) {
                categoryName = '未分组'; // 为空或 null 的 category 归为 "未分组"
            }
    
            // 检查是否是未分组的分类，如果没有 "未分组" 分类，则创建
            if (categoryName === '未分组') {
                if (!ungroupedCategory) {
                    ungroupedCategory = { categoryName, apps: [] };
                    groupedAppList.groupedByCategory.push(ungroupedCategory);
                }
                ungroupedCategory.apps.push(appInfo);
                return;
            }
    
            // 按 category 字段分组
            if (!currentGroup || currentGroup.categoryName !== categoryName) {
                currentGroup = {
                    categoryName, // 分组的 category 名称
                    apps: [],   // 分组内的应用列表
                };
                groupedAppList.groupedByCategory.push(currentGroup); // 将新的分组添加到结果数组
            }
    
            // 将当前应用信息添加到对应分组
            currentGroup.apps.push(appInfo);
        });
    
        ctx.body = {
            code: 200,
            message: '获取app分类信息成功',
            data: groupedAppList,
        };
    } catch (err) {
        ctx.status = 500;
        ctx.body = { message: '服务器错误', error: err.message };
    }
});


// 应用中心获取app路由
router.post('/getChatApp', koaJwt({ secret }), async (ctx) => {
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
        const appList = await chatApp.findAll({
            where: { status: 1 },
            order: [['category', 'ASC']], // 按 category 字段升序排列
        });
    
        // 初始化返回的数据结构
        const groupedAppList = {
            recommended: [],  // 存放推荐应用
            groupedByCategory: [], // 存放按 category 字段分组的应用
        };
    
        let currentGroup = null;
        let ungroupedCategory = null; // 用于标记未分组的分类

        appList.forEach((app) => {
            let { category: categoryName, top, ...appInfo } = app.dataValues; // 修改为 let
    
            // 处理推荐应用
            if (top) {
                groupedAppList.recommended.push(appInfo);
                return; // 推荐的应用不再参与分类
            }
    
            // 处理 category 字段为空或 null 的应用，归为 "未分组"
            if (!categoryName) {
                categoryName = '未分组'; // 为空或 null 的 category 归为 "未分组"
            }
    
            // 检查是否是未分组的分类，如果没有 "未分组" 分类，则创建
            if (categoryName === '未分组') {
                if (!ungroupedCategory) {
                    ungroupedCategory = { categoryName, apps: [] };
                    groupedAppList.groupedByCategory.push(ungroupedCategory);
                }
                ungroupedCategory.apps.push(appInfo);
                return;
            }
    
            // 按 category 字段分组
            if (!currentGroup || currentGroup.categoryName !== categoryName) {
                currentGroup = {
                    categoryName, // 分组的 category 名称
                    apps: [],   // 分组内的应用列表
                };
                groupedAppList.groupedByCategory.push(currentGroup); // 将新的分组添加到结果数组
            }
    
            // 将当前应用信息添加到对应分组
            currentGroup.apps.push(appInfo);
        });
    
        ctx.body = {
            code: 200,
            message: '获取app分类信息成功',
            data: groupedAppList,
        };
    } catch (err) {
        ctx.status = 500;
        ctx.body = { message: '服务器错误', error: err.message };
    }
});



// 添加应用
router.post('/addChatApp', koaJwt({ secret }), async (ctx) => {
    const { user_id, username, url, title, desc, source, type } = ctx.request.body;
    const schema = Joi.object({
        user_id: Joi.string().required(),
        username: Joi.string().required(),
        url: Joi.string().required(),
        title: Joi.string().required(),
        desc: Joi.string().required(),
        source: Joi.string().required(),
        type: Joi.string().required(),
    });
    const { error } = schema.validate({ user_id, username, url, title, desc, source, type });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    // 查询链接不能重复上传
    const existApp = await chatApp.findOne({
        where: { url },
    });
    if (existApp) {
        ctx.status = 400;
        ctx.body = { message: '应用已存在' };
        return;
    }

    try {
        const app = await chatApp.create({
            app_id: 'app_' + customAlphabet(nanoidNode, 10)(),
            user_id,
            username,
            url,
            title,
            desc,
            source,
            type,
            status: 1,
            icon: '',
            sort: 0,
            interact: {"see":[],"like":[],"comment":0,"share":[]},
            category: '',
            placard: [], // 海报信息
            tag: [],
            top: 0,   // 默认为0就是不推荐
        });
        ctx.body = {
            code: 200,
            message: '添加应用成功',
            data: app,
        };
    } catch (err) {
        ctx.status = 500;
        ctx.body = { err };
    }
});


// 搜索应用
router.post('/searchChatApp', koaJwt({ secret }), async (ctx) => {
    const { user_id, keyword } = ctx.request.body;
    const schema = Joi.object({
        user_id: Joi.string().required(),
        // 允许为空
        keyword: Joi.string().allow(''),
    });
    const { error } = schema.validate({ user_id, keyword });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        const appList = await chatApp.findAll({
            where: {
                [Op.or]: [
                    { title: { [Op.like]: `%${keyword}%` } },
                    { desc: { [Op.like]: `%${keyword}%` } },
                    { source: { [Op.like]: `%${keyword}%` } },
                ],
                status: 1,
            },
            order: [['sort', 'ASC']], // 按 sort 字段升序排列
        });
        ctx.body = {
            code: 200,
            message: '搜索应用成功',
            data: appList,
        };
    } catch (err) {
        ctx.status = 500;
        ctx.body = { message: '服务器错误', error: err.message };
    }
});


// 获取我上传的应用
router.post('/getMyChatApp', koaJwt({ secret }), async (ctx) => {
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
        const appList = await chatApp.findAll({
            // 排除 status 为 3 的应用
            where: { user_id, status: { [Op.ne]: 3 } },
            order: [['sort', 'ASC']], // 按 sort 字段升序排列
        });
        ctx.body = {
            code: 200,
            message: '获取应用列表成功',
            data: appList,
        };
    } catch (err) {
        ctx.status = 500;
        ctx.body = { message: '服务器错误', error: err.message };
    }
});


// 编辑应用
router.post('/editChatApp', koaJwt({ secret }), async (ctx) => {
    const { app_id, user_id, title, desc, url, icon, tag } = ctx.request.body;
    const schema = Joi.object({
        user_id: Joi.string().required(),
        app_id: Joi.string().required(),
        title: Joi.string().required(),
        desc: Joi.string().required(),
        url: Joi.string().required(),
        icon: Joi.string().allow(''),
        tag: Joi.array().required(),
    });
    const { error } = schema.validate({ app_id, user_id, title, desc, url, icon, tag });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        const app = await chatApp.update({
            title,
            desc,
            url,
            icon,
            tag,
        }, {
            where: { app_id, user_id },
        });
        ctx.body = {
            code: 200,
            message: '编辑应用成功',
            data: app,
        };
    } catch (err) {
        ctx.status = 500;
        ctx.body = { message: '服务器错误', error: err.message };
    }
});


// 删除应用
router.post('/deleteChatApp', koaJwt({ secret }), async (ctx) => {
    const { user_id, app_id } = ctx.request.body;
    const schema = Joi.object({
        user_id: Joi.string().required(),
        app_id: Joi.string().required(),
    });
    const { error } = schema.validate({ user_id, app_id });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        // 删除应用status置为3
        const app = await chatApp.update({
            status: 3,
        }, {
            where: { app_id, user_id },
        });
        ctx.body = {
            code: 200,
            message: '删除应用成功',
            data: app,
        };
    } catch (err) {
        ctx.status = 500;
        ctx.body = { message: '服务器错误', error: err.message };
    }
});


// 上传应用icon
router.post('/uploadChatAppIcon', koaJwt({ secret }), koaBody({ 
    multipart: true,
    formidable: {
        keepExtensions: true, // 保留文件扩展名
        uploadDir: path.join(__dirname, '../public/avatar/app'), // 上传目录
    },
}), async (ctx) => {
    ctx.body = {
        code: 200,
        message: '上传成功',
        data: ctx.request.files,
    };

});


// 上传应用海报
router.post('/uploadChatAppPlacard', koaJwt({ secret }), koaBody({ 
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
})


// 海报修改信息提交
router.post('/editChatAppPlacard', koaJwt({ secret }), async (ctx) => {
    const { app_id, user_id, placard } = ctx.request.body;
    const schema = Joi.object({
        user_id: Joi.string().required(),
        app_id: Joi.string().required(),
        placard: Joi.array().required(),
    });
    const { error } = schema.validate({ app_id, user_id, placard });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        const app = await chatApp.update({
            placard,
        }, {
            where: { app_id, user_id },
        });
        ctx.body = {
            code: 200,
            message: '编辑应用海报成功',
            data: app,
        };
    } catch (err) {
        ctx.status = 500;
        ctx.body = { message: '服务器错误', error: err.message };
    }
});


// 获取应用详情信息
router.post('/getChatAppDetail', koaJwt({ secret }), async (ctx) => {
    const { app_id, user_id } = ctx.request.body;
    const schema = Joi.object({
        app_id: Joi.string().required(),
        user_id: Joi.string().required(),
    });
    const { error } = schema.validate({ app_id, user_id });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        const app = await chatApp.findOne({
            where: { app_id },
        });
        ctx.body = {
            code: 200,
            message: '获取应用详情成功',
            data: app,
        };
    } catch (err) {
        ctx.status = 500;
        ctx.body = { message: '服务器错误', error: err.message };
    }
});


// 记录app应用浏览的数据
router.post('/recordAppSee', koaJwt({ secret }), async (ctx) => {
    const { user_id, app_id, username } = ctx.request.body;
    const schema = Joi.object({
        app_id: Joi.string().required(),
    });
    const { error } = schema.validate({ app_id });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        let seeData = {
            user_id,
            username,
            ua: ctx.request.header['user-agent'],
            ip: '',
            createdAt: new Date(),
        }

        const filePath = path.join(__dirname, '../public/data/appSee.json');
        const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if(fileData[app_id]){
            fileData[app_id].push(seeData);
        }else{
            fileData[app_id] = [seeData];
        }

        fs.writeFileSync(filePath, JSON.stringify(fileData));

        ctx.body = {
            code: 200,
            message: '记录应用查看数据成功',
            data: seeData,
        };
    } catch (err) {
        ctx.status = 500;
        ctx.body = { message: '服务器错误', error: err.message };
    }
});


// 获取浏览器浏览记录
router.get('/getBrowserHistory/:app_id', async (ctx) => {
    const filePath = path.join(__dirname, '../public/data/appSee.json');
    const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if(!fileData[ctx.params.app_id]){
        ctx.body = {
            code: 200,
            message: '获取浏览器浏览记录成功',
            data: 1,
        };
    }else{
        ctx.body = {
            code: 200,
            message: '获取浏览器浏览记录成功',
            data: fileData[ctx.params.app_id].length,
        };
    }

})




// 评论发送
router.post('/sendComment', koaJwt({ secret }), async (ctx) => {
    const { user_id, app_id, content, username } = ctx.request.body;
    const schema = Joi.object({
        username: Joi.string().required(),
        user_id: Joi.string().required(),
        app_id: Joi.string().required(),
        content: Joi.string().required(),
    });
    const { error } = schema.validate({ user_id, app_id, content, username });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        let commentData = {
            comment_id: 'comment_' + customAlphabet(nanoidNode, 10)(),
            user_id,
            username,
            app_id,
            content,
        }
        const comment = await chatAppComment.create(commentData);
        ctx.body = {
            code: 200,
            message: '评论发送成功',
            data: comment,
        };
    } catch (err) {
        ctx.status = 500;
        ctx.body = { message: '服务器错误', error: err.message };
    }
});


// 获取应用评论列表
router.post('/getCommentList', koaJwt({ secret }), async (ctx) => {
    const { app_id, user_id } = ctx.request.body;
    const schema = Joi.object({
        app_id: Joi.string().required(),
        user_id: Joi.string().required(),
    });
    const { error } = schema.validate({ app_id, user_id });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        const commentList = await chatAppComment.findAll({
            raw: true,
            where: { app_id },
            order: [['createdAt', 'DESC']], // 按 create_time 字段降序排列
        });

        // 把user_id循环出来去查询用户表取nickname，然后把nickname放到commentList里
        let userData = commentList.map(item => item.user_id);

        // 去重
        userData = Array.from(new Set(userData));

        let userList = await User.findAll({
            raw: true,
            attributes: ['user_id', 'nickname'],
            where: { user_id: { [Op.in]: userData } },
        });


        // 把nickname放到commentList里
        commentList.forEach(item => {
            let user = userList.find(user => user.user_id === item.user_id);
            if(user){
                item['nickname'] = user.nickname;
            }
        });

        ctx.body = {
            code: 200,
            message: '获取评论列表成功',
            data: commentList,
        };
    } catch (err) {
        ctx.status = 500;
        ctx.body = { message: '服务器错误', error: err.message };
    }
});


// app点赞
router.post('/appLike', koaJwt({ secret }), async (ctx) => {
    const { user_id, app_id } = ctx.request.body;
    const schema = Joi.object({
        user_id: Joi.string().required(),
        app_id: Joi.string().required(),
    });
    const { error } = schema.validate({ user_id, app_id });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        let likeData = {
            user_id,
            ip:'',
            creatdAt: new Date(),
        }
        // likeData 数据插入到 chatApp.interact.like 里 push 进去
        const likeDataString = JSON.stringify(likeData);

        // 使用 Sequelize.literal 追加到 JSONB 数组
        await chatApp.update(
            {
                interact: Sequelize.literal(`
                jsonb_set(
                    interact, 
                    '{like}', 
                    COALESCE(interact->'like', '[]'::jsonb) || '${likeDataString}'::jsonb
                )
                `),
            },
            {
                where: {
                    app_id,
                },
            }
        );

        ctx.body = {
            code: 200,
            message: '点赞成功',
            data: likeData,
        };
    } catch (err) {
        ctx.status = 500;
        ctx.body = { message: '服务器错误', error: err.message };
    }
});

// 评论点赞
router.post('/commentLike', koaJwt({ secret }), async (ctx) => {
    const { user_id, comment_id } = ctx.request.body;
    const schema = Joi.object({
        user_id: Joi.string().required(),
        comment_id: Joi.string().required(),
    });
    const { error } = schema.validate({ user_id, comment_id });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }



    try {
        let likeData = {
            user_id,
            ip: '',
            createdAt: new Date(), // 修复拼写错误
        };
        
        // 将数据序列化为字符串并转义以避免 SQL 注入
        const likeDataString = JSON.stringify(likeData).replace(/'/g, "''");
        
        await chatAppComment.update(
            {
                interact: Sequelize.literal(`
                    jsonb_set(
                        interact, 
                        '{like}', 
                        COALESCE(interact->'like', '[]'::jsonb) || '${likeDataString}'::jsonb
                    )
                `),
            },
            {
                where: {
                    comment_id, // 确保字段拼写正确
                },
            }
        );

        ctx.body = {
            code: 200,
            message: '点赞成功',
            data: likeData,
        };
    } catch (err) {
        ctx.status = 500;
        ctx.body = { message: '服务器错误', error: err.message };
    }
});


// 获取任意网站title和description
router.post('/getWebsiteInfo', koaJwt({ secret }), async (ctx) => {
    const { url } = ctx.request.body;
    const schema = Joi.object({
        url: Joi.string().required(),
    });
    const { error } = schema.validate({ url });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        // 判断有没有加http没有的话自动加上
        if (!url.startsWith('http')) {
            url = 'http://' + url;
        }

        await page.goto(url);
        const title = await page.title();
        const description = await page.evaluate(() => {
            const meta = document.querySelector('meta[name="description"]');
            return meta? meta.getAttribute('content') : '';
        });
        await browser.close();
        ctx.body = {
            code: 200,
            message: '获取网站信息成功',
            data: { title, description },
        };
    } catch (err) {
        ctx.status = 500;
        ctx.body = { message: '服务器错误', error: err.message };
    }
});


// 网站安全性检测
router.get('/checkWebsiteSecurity', async (ctx) => {
    console.log(ctx.request.query);
    const { url } = ctx.request.query;
    const schema = Joi.object({
        url: Joi.string().required(),
    });
    const { error } = schema.validate({ url });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        // 判断有没有加http没有的话自动加上
        if (!url.startsWith('http')) {
            url = 'http://' + url;
        }

        await page.goto(url, { timeout: 15000, waitUntil: 'load' });
        await page.waitForSelector('body', { timeout: 10000 });        // 等待页面的关键元素加载完成（例如body元素）
        const content = await page.content();        // 获取页面的 HTML 内容

        const security = await page.evaluate(() => {
            const security = {
                ssl: false,
                https: false,
                hsts: false,
                csp: false,
                xss: false,
                xframe: false,
                xcontent: false,
                xdownload: false,
                referrer: false,
            };
            const ssl = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            if (ssl) {
                security.ssl = true;
            }
            const https = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            if (https) {
                security.https = true;
            }
            const hsts = document.querySelector('meta[http-equiv="Strict-Transport-Security"]');
            if (hsts) {
                security.hsts = true;
            }
            const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            if (csp) {
                security.csp = true;
            }
            const xss = document.querySelector('meta[http-equiv="X-XSS-Protection"]');
            if (xss) {
                security.xss = true;
            }
            const xframe = document.querySelector('meta[http-equiv="X-Frame-Options"]');
            if (xframe) {
                security.xframe = true;
            }            
            const xcontent = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
            if (xcontent) {
                security.xcontent = true;
            }
            const xdownload = document.querySelector('meta[http-equiv="X-Download-Options"]');
            if (xdownload) {
                security.xdownload = true;
            }
            const referrer = document.querySelector('meta[http-equiv="Referrer-Policy"]');
            if (referrer) {
                security.referrer = true;
            }
            return security;
        });

        // 提取纯文本
        const text = await page.evaluate(() => {
            return document.body.innerText;
        });

        // 这里可以添加更多的内容验证逻辑，例如检查页面是否有特定的文本或元素
        let filter = await wordFilter(text)
        if (filter.words.length > 0) {
            ctx.body = {
                code: 200,
                message: '网站可能存在安全隐患',
                data: security,
            };
        } else {
            ctx.body = {
                code: 200,
                message: '检测网站安全性成功',
                data: security,
            };
        }
  
        console.log(filter);

        await browser.close();

    } catch (err) {
        ctx.status = 500;
        await browser.close();
        ctx.body = { message: '服务器错误', error: err.message };
    }
});

module.exports = router;