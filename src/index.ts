import express from 'express';
import routes from './routes';
import dotenv from 'dotenv';
// 【新增1】引入PrismaClient，用来执行数据库迁移
import { PrismaClient } from '@prisma/client';
dotenv.config();

const app = express();
app.use(express.json());
app.use('/', routes);

const PORT = process.env.PORT || 5000;
// 【新增2】创建Prisma客户端实例
const prisma = new PrismaClient();

// 【核心新增】服务器启动前，自动执行数据库迁移（代替prisma migrate deploy）
async function startServer() {
  try {
    // 自动执行数据库迁移，建表/同步结构，Node执行有完全权限
    await prisma.$runCommandRaw({ migrate: { deploy: {} } });
    console.log('数据库迁移成功！✅');
    // 迁移成功后，再启动服务器
    app.listen(PORT, () => {
      console.log('====================================');
      console.log('发卡服务器启动成功啦！🎉');
      console.log(`服务器地址：http://localhost:${PORT}`);
      console.log('====================================');
    });
  } catch (error) {
    // 迁移失败也打印日志，方便看问题
    console.error('数据库迁移失败：', error);
    process.exit(1);
  }
}

// 调用启动函数（代替原来直接app.listen）
startServer();

export default app;