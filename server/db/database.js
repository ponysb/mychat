const { Sequelize } = require('sequelize');
require('dotenv').config(); // 引入dotenv来加载.env文件中的环境变量

const sequelize = new Sequelize(
    process.env.DB_NAME, 
    process.env.DB_USER, 
    process.env.DB_PASSWORD, 
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        timezone: process.env.DB_TIMEZONE,
        logging: false,
        define: {
            raw: true, // 禁用默认的字段名驼峰化，true表示表名和字段名都不变
        },
    }
);

module.exports = { sequelize };
