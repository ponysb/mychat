const Router = require('koa-router');
const si = require('systeminformation');

const router = new Router();

// 系统状态
router.get('/sysState', async (ctx) => {
    try {
        const result = await getSystemInfo();
        ctx.body = {
            code: 200,
            data: result
        };
    } catch (error) {
        console.log(error);
        ctx.body = {
            code: 500,
            message: '获取系统状态失败'
        };
    }
});


async function getSystemInfo() {
    try {
        // 获取 CPU 使用率
        const cpuUsage = await si.currentLoad();
        // 获取内存使用率
        const memUsage = await si.mem();
        // 获取硬盘占用率
        const diskUsage = await si.fsSize();
        // 获取网络情况
        const networkInfo = await si.networkStats();

        // 格式化数据
        const result = {
            cpu: {
                usage: cpuUsage.currentLoad.toFixed(2) + '%', // CPU 使用率
                cores: cpuUsage.cpus.length // CPU 核心数
            },
            memory: {
                total: (memUsage.total / 1024 / 1024).toFixed(2) + ' MB', // 总内存
                used: (memUsage.used / 1024 / 1024).toFixed(2) + ' MB', // 已用内存
                usage: ((memUsage.used / memUsage.total) * 100).toFixed(2) + '%' // 内存使用率
            },
            disk: diskUsage.map(disk => ({
                fs: disk.fs, // 文件系统
                size: (disk.size / 1024 / 1024 / 1024).toFixed(2) + ' GB', // 总大小
                used: (disk.used / 1024 / 1024 / 1024).toFixed(2) + ' GB', // 已用大小
                usage: ((disk.used / disk.size) * 100).toFixed(2) + '%' // 硬盘占用率
            })),
            network: networkInfo.map(net => ({
                iface: net.iface, // 网络接口
                rx: (net.rx_bytes / 1024 / 1024).toFixed(2) + ' MB', // 接收数据量
                tx: (net.tx_bytes / 1024 / 1024).toFixed(2) + ' MB' // 发送数据量
            }))
        };

        return {
            code: 200,
            data: result
        };
    } catch (error) {
        console.error('获取系统信息失败:', error);
        return {
            code: 500,
            message: '获取系统信息失败',
            error: error.message
        };
    }
}

module.exports = router;