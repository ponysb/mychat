// 通知单回调，先启动这个服务，付款完成之后会调用这个，然后通知单回调到这个服务的/notify接口，通知单数据会保存到notify.txt文件中
const Router = require('koa-router');
const router = new Router();
const fs = require('fs');

router.post('/notify', async (ctx) => {
    const data = ctx.request.body;
    // 保存通知单数据到/notify.txt文件中
    fs.appendFile('notify.txt', JSON.stringify(data) + '\n', (err) => {
            if (err) throw err;
            console.log('Notification saved!');
    });
    // 返回成功
    ctx.status = 200;
    ctx.body = 'SUCCESS';
});

module.exports = router;

