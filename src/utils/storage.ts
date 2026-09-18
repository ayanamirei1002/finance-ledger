/**
 * 本地存储工具
 */

const PREFIX = "finance_ledger_";

/**
 * 设置本地存储
 * @param key 键
 * @param value 值
 * @param expire 过期时间（秒）
 */
export const setStorage = (key: string, value: any, expire?: number): void => {
  const data = {
    value,
    timestamp: Date.now(),
    expire: expire ? expire * 1000 : null,
  };
  localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(data));
};

/**
 * 获取本地存储
 * @param key 键
 * @returns 值，如果已过期则返回null
 */
export const getStorage = <T>(key: string): T | null => {
  const item = localStorage.getItem(`${PREFIX}${key}`);
  if (!item) return null;

  try {
    const data = JSON.parse(item);
    if (data.expire && Date.now() - data.timestamp > data.expire) {
      localStorage.removeItem(`${PREFIX}${key}`);
      return null;
    }
    return data.value as T;
  } catch {
    return null;
  }
};

/**
 * 删除本地存储
 * @param key 键
 */
export const removeStorage = (key: string): void => {
  localStorage.removeItem(`${PREFIX}${key}`);
};

/**
 * 清空所有本地存储
 */
export const clearStorage = (): void => {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith(PREFIX)) {
      localStorage.removeItem(key);
    }
  });
};

/**
 * 检查本地存储是否存在
 * @param key 键
 * @returns 是否存在
 */
export const hasStorage = (key: string): boolean => {
  return localStorage.getItem(`${PREFIX}${key}`) !== null;
};

/**
 * 获取所有本地存储的键
 * @returns 键数组
 */
export const getStorageKeys = (): string[] => {
  const keys = Object.keys(localStorage);
  return keys
    .filter((key) => key.startsWith(PREFIX))
    .map((key) => key.replace(PREFIX, ""));
};