/**
 * 表单验证工具
 */

/**
 * 验证邮箱
 * @param email 邮箱地址
 * @returns 是否有效
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证手机号
 * @param phone 手机号
 * @returns 是否有效
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * 验证身份证号
 * @param idCard 身份证号
 * @returns 是否有效
 */
export const isValidIdCard = (idCard: string): boolean => {
  const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  return idCardRegex.test(idCard);
};

/**
 * 验证统一社会信用代码
 * @param code 统一社会信用代码
 * @returns 是否有效
 */
export const isValidUnifiedSocialCreditCode = (code: string): boolean => {
  const codeRegex = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
  return codeRegex.test(code);
};

/**
 * 验证金额
 * @param amount 金额
 * @returns 是否有效
 */
export const isValidAmount = (amount: number | string): boolean => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return !isNaN(num) && num >= 0 && num <= 99999999.99;
};

/**
 * 验证发票号码
 * @param invoiceNumber 发票号码
 * @returns 是否有效
 */
export const isValidInvoiceNumber = (invoiceNumber: string): boolean => {
  // 发票号码一般为8位数字
  const invoiceRegex = /^\d{8}$/;
  return invoiceRegex.test(invoiceNumber);
};

/**
 * 验证日期格式
 * @param date 日期字符串
 * @param _format 格式（可选，保留参数以兼容调用方）
 * @returns 是否有效
 */
export const isValidDate = (date: string, _format?: string): boolean => {
  if (!date) return false;
  
  // 默认支持 YYYY-MM-DD 和 YYYY-MM-DD HH:mm:ss
  const dateRegex = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/;
  if (!dateRegex.test(date)) return false;
  
  const d = new Date(date);
  return !isNaN(d.getTime());
};

/**
 * 验证密码强度
 * @param password 密码
 * @returns 强度等级（0-4）
 */
export const getPasswordStrength = (password: string): number => {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  
  return Math.min(strength, 4);
};

/**
 * 验证必填字段
 * @param value 值
 * @param fieldName 字段名称
 * @returns 错误信息或null
 */
export const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === undefined || value === null || value === "") {
    return `${fieldName}不能为空`;
  }
  return null;
};

/**
 * 验证字符串长度
 * @param value 字符串
 * @param min 最小长度
 * @param max 最大长度
 * @param fieldName 字段名称
 * @returns 错误信息或null
 */
export const validateLength = (
  value: string,
  min: number,
  max: number,
  fieldName: string
): string | null => {
  if (value.length < min) {
    return `${fieldName}长度不能少于${min}个字符`;
  }
  if (value.length > max) {
    return `${fieldName}长度不能超过${max}个字符`;
  }
  return null;
};