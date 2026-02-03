import jwt from 'jsonwebtoken';
// 引入环境变量，奶奶后面在.env文件里改密钥
import dotenv from 'dotenv';
dotenv.config();

// JWT密钥，从环境变量取，奶奶不用改这行
const JWT_SECRET = process.env.JWT_SECRET || 'laolainainai_666';
// 激活码有效期，30天，奶奶想改天数的话，把30d改成90d就是90天
const TOKEN_EXPIRE = '30d';

/**
 * 生成16位大写激活码（字母+数字）
 */
export const genCode = (): string => {
  return [...Array(16)]
    .map(() => Math.random().toString(36)[2])
    .join('')
    .toUpperCase();
};

/**
 * 生成JWT令牌，绑定设备ID
 * @param deviceId 设备ID
 * @returns 令牌字符串
 */
export const signToken = (deviceId: string): string => {
  return jwt.sign({ deviceId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRE });
};

/**
 * 验证令牌是否有效，且和设备ID匹配
 * @param token 令牌
 * @param deviceId 设备ID
 * @returns 有效返回true，无效false
 */
export const verifyToken = (token: string, deviceId: string): boolean => {
  try {
    // 验证令牌并解析内容，无any类型，避免bug
    const payload = jwt.verify(token, JWT_SECRET) as { deviceId: string; exp: number };
    // 既要设备ID匹配，还要令牌没过期
    return payload.deviceId === deviceId && payload.exp * 1000 > Date.now();
  } catch (error) {
    return false;
  }
};