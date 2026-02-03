import express from 'express';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import routes from './routes';

// 加载本地环境变量（密码）
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// 全局数据库连接实例
export let db: any;

// 初始化sqlite3数据库，自动建表
async function initDB() {
  try {
    // 打开数据库（本地dev.db，Render会自动创建在项目目录）
    db = await open({
      filename: './dev.db',
      driver: sqlite3.Database
    });
    console.log('✅ SQLite数据库连接成功！');

    // 自动建表：激活码表（和之前Prisma的表结构完全一样）
    await db.exec(`
      CREATE TABLE IF NOT EXISTS license_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        device_id TEXT,
        is_used BOOLEAN DEFAULT 0,
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ 激活码表创建/同步成功！');

    // 解析JSON参数，挂载路由
    app.use(express.json());
    app.use('/', routes);

    // 启动服务器
    app.listen(PORT, () => {
      console.log('====================================');
      console.log('奶奶的发卡服务器启动成功啦！🎉');
      console.log(`服务器地址：http://localhost:${PORT}`);
      console.log('====================================');
    });

  } catch (error) {
    console.error('❌ 数据库初始化失败：', error);
    process.exit(1);
  }
}

// 执行数据库初始化+启动服务器
initDB();

export default app;