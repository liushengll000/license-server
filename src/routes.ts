import { Router } from 'express';
import { db } from './index';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();
// 从环境变量获取密码（和之前的.env一致，不用改）
const GEN_PASSWORD = process.env.GEN_PASSWORD || '';
const JWT_SECRET = process.env.JWT_SECRET || 'nainai-secret-key';

// 生成随机激活码（6位大写字母+数字，和之前一样）
function generateLicenseCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// 接口1：生成激活码（奶奶专用，需要密码）
router.post('/gen', async (req, res) => {
  try {
    const { password, n = 5 } = req.body;
    // 验证密码
    if (password !== GEN_PASSWORD) {
      return res.json({ code: 403, msg: '密码错误！', data: null });
    }
    // 生成n个激活码
    const codes = [];
    for (let i = 0; i < n; i++) {
      const code = generateLicenseCode();
      // 插入数据库（避免重复）
      await db.run('INSERT OR IGNORE INTO license_codes (code) VALUES (?)', [code]);
      codes.push(code);
    }
    res.json({ code: 200, msg: '生成成功！', data: codes });
  } catch (error) {
    res.json({ code: 500, msg: '生成失败', error: (error as Error).message });
  }
});

// 接口2：激活激活码（用户用）
router.post('/activate', async (req, res) => {
  try {
    const { code, deviceId } = req.body;
    if (!code || !deviceId) {
      return res.json({ code: 400, msg: '激活码和设备ID不能为空！' });
    }
    // 检查激活码是否存在且未使用
    const row = await db.get('SELECT * FROM license_codes WHERE code = ? AND is_used = 0', [code]);
    if (!row) {
      return res.json({ code: 404, msg: '激活码不存在或已使用！' });
    }
    // 标记为已使用，绑定设备ID
    await db.run(
      'UPDATE license_codes SET is_used = 1, device_id = ? WHERE code = ?',
      [deviceId, code]
    );
    // 生成简单令牌（和之前功能一致，字符串拼接）
    const token = `${code}-${deviceId}-${Date.now()}`;
    res.json({ code: 200, msg: '激活成功！', data: { token } });
  } catch (error) {
    res.json({ code: 500, msg: '激活失败', error: (error as Error).message });
  }
});

// 接口3：验证令牌（解析令牌验证）
router.get('/verify', async (req, res) => {
  try {
    const { token, deviceId } = req.query;
    if (!token || !deviceId) {
      return res.json({ code: 400, msg: '令牌和设备ID不能为空！', ok: false });
    }
    // 解析令牌（和激活时的生成规则一致）
    const [code] = (token as string).split('-');
    // 检查激活码是否绑定该设备且已使用
    const row = await db.get(
      'SELECT * FROM license_codes WHERE code = ? AND device_id = ? AND is_used = 1',
      [code, deviceId]
    );
    if (row) {
      res.json({ code: 200, msg: '令牌有效～', ok: true });
    } else {
      res.json({ code: 403, msg: '令牌无效或已解绑！', ok: false });
    }
  } catch (error) {
    res.json({ code: 500, msg: '验证失败', error: (error as Error).message, ok: false });
  }
});

export default router;