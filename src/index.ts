import express from 'express';
import routes from './routes';
import dotenv from 'dotenv';
// 引入PrismaClient，仅做数据库连接（自动建表）
import { PrismaClient } from '@prisma/client';
dotenv.config();

const app = express();
// 解析JSON参数，接口正常接收数据
app.use(express.json());
// 挂载所有接口（生成激活码、激活、验证）
app.use('/', routes);

// 服务器端口，本地5000，Render会自动分配
const PORT = process.env.PORT || 5000;
// 创建Prisma客户端实例（单例，无重复连接）
const prisma = new PrismaClient();

// 服务器启动核心函数：先连数据库（自动建表），再启动服务
async function startServer() {
  try {
    // 【核心】连接SQLite数据库，Prisma会自动创建schema里的表！
    // 不用任何migrate命令，连接成功=数据库+表都准备好了
    await prisma.$connect();
    console.log('✅ 数据库连接成功，表已自动创建！');

    // 数据库就绪后，启动服务器
    app.listen(PORT, () => {
      console.log('====================================');
      console.log('发卡服务器启动成功啦！🎉');
      console.log(`服务器地址：http://localhost:${PORT}`);
      console.log('====================================');
    });

    // 服务器退出时，断开数据库连接（避免警告）
    process.on('SIGINT', async () => {
      await prisma.$disconnect();
      process.exit(0);
    });

  } catch (error) {
    // 连接失败打印日志，方便排查
    console.error('❌ 数据库连接失败：', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// 执行启动函数
startServer();

export default app;