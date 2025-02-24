const Router = require('koa-router');
const axios = require("axios");
const cryptoMD5 = require("crypto-js/md5");
const { customAlphabet } = require('nanoid');
const Joi = require('joi');
const koaJwt = require('koa-jwt');
const fs = require('fs');
const path = require('path');
const { User, chatOrder } = require('../models/models');
const secret = '@5.0.0node_mdex.js:109:16';
const nanoidNode = '1234567890abcdefghijklmnopqrstuvwxyz';
const router = new Router();
// 价格设置
var price_vip = 68;
var price_vip_pro = 88;

// 下单签名计算
function sign_md5(data) {
    const order_template = {
        mch_id: "*******",  //商户号必填
        out_trade_no: data.out_trade_no,  //订单号必填
        total_fee: data.total_fee,  //支付金额必填
        body: data.product,  //商品描述必填
        timestamp: Date.now().toString().substr(0, 10),  //十位时间戳必填
        notify_url: "http://topay.zyy.muo.cc:3049/notify",  //通知单地址必填
        attach: "无",    //附加数据
        time_expire: "5m",  //订单失效时间
        developer_appid: "*******",  //应用id
    }
      
    // 签名计算
    const stringA = `body=${order_template.body}&mch_id=${order_template.mch_id}&notify_url=${order_template.notify_url}&out_trade_no=${order_template.out_trade_no}&timestamp=${order_template.timestamp}&total_fee=${order_template.total_fee}`
      
      
    const stringSignTemp = stringA + "&key=a85e54ec46618452475e7e60b5870d81";
    
    const signMd5 = cryptoMD5(stringSignTemp).toString().toUpperCase();  //MD5加密转大写
    
    const updata = {
        ...order_template,
        sign: signMd5,
    }
    
    return updata;
}


// jsapi_wxpay签名计算
function jsapi_sign_md5(data) {
    const order_template = {
        mch_id: "*******",  //商户号必填
        out_trade_no: data.out_trade_no,  //订单号必填
        total_fee: data.total_fee,  //支付金额必填
        body: data.product,  //商品描述必填
        timestamp: Date.now().toString().substr(0, 10),  //十位时间戳必填
        notify_url: "http://topay.zyy.muo.cc:3049/notify",  //通知单地址必填
        attach: "无",    //附加数据
        time_expire: "5m",  //订单失效时间
        developer_appid: "*******",  //应用id
        return_url: "https://docs.qq.com/form/page/DY0p3Q0NCWWFmTEtS"  //支付成功后跳转地址
    }

    // http://topay.zyy.muo.cc,https://docs.qq.com    这俩都地放白名单
      
    // 签名计算
    const stringA = `body=${order_template.body}&mch_id=${order_template.mch_id}&notify_url=${order_template.notify_url}&out_trade_no=${order_template.out_trade_no}&timestamp=${order_template.timestamp}&total_fee=${order_template.total_fee}`
      
      
    const stringSignTemp = stringA + "&key=a85e54ec46618452475e7e60b5870d81";
    
    const signMd5 = cryptoMD5(stringSignTemp).toString().toUpperCase();  //MD5加密转大写
    
    const updata = {
        ...order_template,
        sign: signMd5,
    }
    
    return updata;
}

// 订单查询签名计算
function sign_query(data) {
    const order_template = {
        mch_id: "*******",  //商户号必填
        out_trade_no: data.out_trade_no,  //订单号必填
        timestamp: Date.now().toString().substr(0, 10),  //十位时间戳必填
    }
      
    // 签名计算
    const stringA = `mch_id=${order_template.mch_id}&out_trade_no=${order_template.out_trade_no}&timestamp=${order_template.timestamp}`
      
      
    const stringSignTemp = stringA + "&key=a85e54ec46618452475e7e60b5870d81";
    
    const signMd5 = cryptoMD5(stringSignTemp).toString().toUpperCase();  //MD5加密转大写
    
    const updata = {
        ...order_template,
        sign: signMd5,
    }
    
    return updata;
}


// 下单返回收款码
router.post("/wxpay", koaJwt({ secret }), async (ctx) => {
    const { user_id, username, goods } = ctx.request.body;
    const schema = Joi.object({
        user_id: Joi.string().required(),
        username: Joi.string().required(),
        goods: Joi.string().required(),
    });
    const { error } = schema.validate({ user_id, username, goods });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    if (goods === "摸鱼股东") {  //摸鱼股东  摸鱼股东
        let out_trade_no = 'oid_' + customAlphabet(nanoidNode, 10)();
        const config = {
            method: "post",
            url: "https://api.ltzf.cn/api/wxpay/native",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data: sign_md5({
                total_fee: price_vip,
                product: '摸鱼股东',
                out_trade_no: out_trade_no,
            }),
        };
        
        try {
            const response = await axios(config); // 使用 await 等待请求完成
            console.log(response.data);
            ctx.status = 200;
            // 加上订单号返回

            const saveOrder = chatOrder.create({
                order_id: out_trade_no,
                user_id,
                username,
                goods: "摸鱼股东",
                price: price_vip,
                status: 1,
                QRcode_url: response.data.data.QRcode_url,
                code_url: response.data.data.code_url,
            })

            ctx.body = {
                code: 200,
                message: "success",
                data: {...response.data.data, out_trade_no: out_trade_no},
            };

        } catch (error) {
            console.error(error);
            ctx.status = 403; // 错误时设置为 403 状态
            ctx.body = 'error';
        }
    }

    if (goods === "超级摸鱼股东") {  //超级摸鱼股东  超级摸鱼股东
        let out_trade_no = 'oid_' + customAlphabet(nanoidNode, 10)();
        const config = {
            method: "post",
            url: "https://api.ltzf.cn/api/wxpay/native",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data: sign_md5({
                total_fee: price_vip_pro,
                product: '超级摸鱼股东',
                out_trade_no: out_trade_no,
            }),
        };
        
        try {
            const response = await axios(config); // 使用 await 等待请求完成
            console.log(response.data);
            ctx.status = 200;
            // 加上订单号返回

            const saveOrder = chatOrder.create({
                order_id: out_trade_no,
                user_id,
                username,
                goods: "超级摸鱼股东",
                price: price_vip_pro,
                status: 1,
                QRcode_url: response.data.data.QRcode_url,
                code_url: response.data.data.code_url,
            })

            ctx.body = {
                code: 200,
                message: "success",
                data: {...response.data.data, out_trade_no: out_trade_no},
            };
        } catch (error) {
            console.error(error);
            ctx.status = 403; // 错误时设置为 403 状态
            ctx.body = 'error';
        }
    }
});


// 下单返回收款码
router.post("/jsapi_wxpay", koaJwt({ secret }), async (ctx) => {
    const { user_id, username, goods } = ctx.request.body;
    const schema = Joi.object({
        user_id: Joi.string().required(),
        username: Joi.string().required(),
        goods: Joi.string().required(),
    });
    const { error } = schema.validate({ user_id, username, goods });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    if (goods === "摸鱼股东") {
        let out_trade_no = 'oid_' + customAlphabet(nanoidNode, 10)();
        const config = {
            method: "post",
            url: "https://api.ltzf.cn/api/wxpay/jsapi_convenient",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data: jsapi_sign_md5({
                total_fee: price_vip,
                product: '摸鱼股东',
                out_trade_no: out_trade_no,
            }),
        };
        
        try {
            const response = await axios(config); // 使用 await 等待请求完成
            // console.log(response.data);

            const saveOrder = chatOrder.create({
                order_id: out_trade_no,
                user_id,
                username,
                goods: "摸鱼股东",
                price: price_vip,
                status: 0,
                code_url: response.data.data.order_url,
                QRcode_url: response.data.data.QRcode_url,
            })
            
            // 加上订单号返回
            ctx.body = {
                code: 200,
                message: "success",
                data: {...response.data.data, out_trade_no: out_trade_no},
            };
        } catch (error) {
            console.error(error);
            ctx.status = 403; // 错误时设置为 403 状态
            ctx.body = 'error';
        }
    }

    if (goods === "超级摸鱼股东") {
        let out_trade_no = 'oid_' + customAlphabet(nanoidNode, 10)();
        const config = {
            method: "post",
            url: "https://api.ltzf.cn/api/wxpay/jsapi_convenient",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data: jsapi_sign_md5({
                total_fee: price_vip_pro,
                product: '超级摸鱼股东',
                out_trade_no: out_trade_no,
            }),
        };
        
        try {
            const response = await axios(config); // 使用 await 等待请求完成
            console.log(response.data);

            const saveOrder = chatOrder.create({
                order_id: out_trade_no,
                user_id,
                username,
                goods: "超级摸鱼股东",
                price: price_vip_pro,
                status: 0,
                code_url: response.data.data.order_url,
                QRcode_url: response.data.data.QRcode_url,
            })

            // 加上订单号返回
            ctx.body = {
                code: 200,
                message: "success",
                data: {...response.data.data, out_trade_no: out_trade_no},
            };
        
        } catch (error) {
            console.error(error);
            ctx.status = 403; // 错误时设置为 403 状态
            ctx.body = 'error';
        }
    }
});


// 查询订单状态
router.post("/order", koaJwt({ secret }), async (ctx) => {
    const { user_id, username, out_trade_no } = ctx.request.body;
    const schema = Joi.object({
        user_id: Joi.string().required(),
        username: Joi.string().required(),
        out_trade_no: Joi.string().required(),
    });
    const { error } = schema.validate({ user_id, username, out_trade_no });
    if (error) {
        ctx.status = 400;
        ctx.body = { message: error.details[0].message };
        return;
    }

    const config = {
        method: "post",
        url: "https://api.ltzf.cn/api/wxpay/get_pay_order",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: sign_query({out_trade_no: out_trade_no}),
    };
      
    try {
        const response = await axios(config); // 使用 await 等待请求完成
        // console.log(response.data);

        if(response.data.code === 1){
            ctx.status = 200;
            ctx.body = {
                code: 200,
                message: "await",
                data: {
                    pay_status: 0,
                    message: "订单尚未支付",
                },
            };
            return;
        }

        if(response.data.data.pay_status === 0){
            ctx.status = 200;
            ctx.body = {
                code: 200,
                message: "await",
                data: {
                    pay_status: response.data.data.pay_status,
                    message: "订单尚未支付",
                },
            };
            return;
        }

        // 更新订单状态
        const saveOrder = chatOrder.update(
            {
                status: response.data.data.pay_status
            },
            {
                where: {
                    order_id: out_trade_no,
                },
            }
        );

        // 添加徽章
        const filePath = path.join(__dirname, '../public/data/badge.json');
        const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if(response.data.data.body === '摸鱼股东'){

            let vipData = fileData.vip.split('|');
            let vipProData = fileData.pro.split('|');
            // 查询一下fileData.vip里有没有username，没有的话增加
            if(vipData.indexOf(username) === -1){
                vipData.push(username)
            }
    
            // 查询一下fileData.pro里有没有username，有的话删掉
            if(vipProData.indexOf(username) !== -1){
                vipProData.splice(vipProData.indexOf(username), 1)
            }
    
    
            fileData.badge.stockholder.push(username)
            fileData.vip = vipData.join('|')
            fileData.pro = vipProData.join('|')
            fs.writeFileSync(filePath, JSON.stringify(fileData));
        }

        if(response.data.data.body === '超级摸鱼股东'){

            let vipData = fileData.vip.split('|');
            let vipProData = fileData.pro.split('|');
            // 查询一下fileData.vip里有没有username，没有的话增加
            if(vipProData.indexOf(username) === -1){
                vipProData.push(username)
            }
    
            // 查询一下fileData.pro里有没有username，有的话删掉
            if(vipData.indexOf(username) !== -1){
                vipData.splice(vipData.indexOf(username), 1)
            }
    
    
            fileData.badge.stockholder.push(username)
            fileData.vip = vipData.join('|')
            fileData.pro = vipProData.join('|')
            fs.writeFileSync(filePath, JSON.stringify(fileData));
        }

        // console.log(response.data);
        ctx.status = 200; // 确保是 ctx.status
        ctx.body = {data: response.data, message: "success"}; // 返回响应数据
    } catch (error) {
        console.error(error);
        ctx.status = 403; // 错误时设置为 403 状态
        ctx.body = 'error';
    }
});



module.exports = router;
