import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { signToken, verifyToken, genCode } from './utils';
import dotenv from 'dotenv';
dotenv.config();

// Prisma客户端单例（修复原代码的bug，避免数据库重复连接）
const prisma = new PrismaClient({
  log: ['query'], // 打印数据库操作日志，方便奶奶排查问题
});
const router = Router();

// 从环境变量取生成激活码的密码，奶奶后面在.env里改
const GEN_PASSWORD = process.env.GEN_PASSWORD || 'nainai123';

/**
 * 【奶奶后台专用】批量生成激活码
 * 需传密码和生成数量，防止别人乱生成
 * 示例：传 { "password": "nainai123", "n": 10 } 生成10个激活码
 */
router.post('/gen', async (req, res) => {
  try {
    const { password, n = 1 } = req.body;
    // 先验证密码，密码错了不让生成
    if (password !== GEN_PASSWORD) {
      return res.json({ success: false, message: '生成激活码的密码错啦～' });
    }
    // 限制每次最多生成100个，避免服务器卡
    const generateNum = Math.min(Number(n), 100);
    if (isNaN(generateNum) || generateNum < 1) {
      return res.json({ success: false, message: '要生成的数量得是数字，且至少1个～' });
    }
    const codes: string[] = [];
    // 批量生成激活码并存到数据库
    for (let i = 0; i < generateNum; i++) {
      const code = genCode();
      // 防止激活码重复（原代码没考虑，补全）
      const exist = await prisma.licenseCode.findUnique({ where: { code } });
      if (exist) { i--; continue; }
      await prisma.licenseCode.create({ data: { code } });
      codes.push(code);
    }
    res.json({ success: true, message: `生成了${codes.length}个激活码～`, codes });
  } catch (error) {
    // 错误处理，服务器不会崩，还会告诉奶奶哪里错了
    console.error('生成激活码出错：', error);
    res.json({ success: false, message: '生成失败，看看小黑窗的错误信息～' });
  }
});

/**
 * 【用户用】激活码激活
 * 用户传 { "code": "激活码", "deviceId": "设备ID" }，返回令牌
 */
router.post('/activate', async (req, res) => {
  try {
    const { code, deviceId } = req.body;
    // 检查参数是否传了，没传直接返回
    if (!code || !deviceId) {
      return res.json({ success: false, message: '要传激活码和设备ID哦～' });
    }
    // 查数据库里的激活码
    const lic = await prisma.licenseCode.findUnique({ where: { code } });
    // 激活码不存在或已使用，返回无效
    if (!lic || lic.used) {
      return res.json({ success: false, message: '激活码无效或已使用～' });
    }
    // 标记激活码为已使用，绑定设备ID
    await prisma.licenseCode.update({
      where: { code },
      data: { used: true, deviceId }
    });
    // 生成令牌返回给用户
    const token = signToken(deviceId);
    res.json({ success: true, message: '激活成功～', token });
  } catch (error) {
    console.error('激活出错：', error);
    res.json({ success: false, message: '激活失败，看看小黑窗的错误信息～' });
  }
});

/**
 * 【用户用】验证令牌是否有效
 * 地址栏传 ?token=令牌&deviceId=设备ID，返回是否有效
 * 修复原代码的bug：原参数名id改成deviceId，和逻辑一致
 */
router.get('/verify', async (req, res) => {
  try {
    const { token, deviceId } = req.query as { token?: string; deviceId?: string };
    // 检查参数是否传了
    if (!token || !deviceId) {
      return res.json({ ok: false, message: '要传令牌和设备ID哦～' });
    }
    // 验证令牌
    const ok = verifyToken(token, deviceId);
    res.json({ ok, message: ok ? '令牌有效～' : '令牌无效或已过期～' });
  } catch (error) {
    console.error('验证令牌出错：', error);
    res.json({ ok: false, message: '验证失败，看看小黑窗的错误信息～' });
  }
});

// 关闭数据库连接（防止服务器退出时的警告）
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default router;