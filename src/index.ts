import express from 'express';
import routes from './routes';
import dotenv from 'dotenv';
// 加载环境变量，让奶奶改的.env配置生效
dotenv.config();

const app = express();
// 解析JSON数据，接口能收到传的参数
app.use(express.json());
// 挂载所有接口
app.use('/', routes);

// 服务器端口，默认5000，部署时会自动改
const PORT = process.env.PORT || 5000;

// 启动服务器
app.listen(PORT, () => {
  console.log('====================================');
  console.log('发卡服务器启动成功！🎉');
  console.log(`本地地址：http://localhost:${PORT}`);
  console.log('====================================');
});

// 导出app，方便部署时使用
export default app;