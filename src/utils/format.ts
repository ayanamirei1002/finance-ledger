import dayjs from "dayjs";

/**
 * 格式化金额
 * @param amount 金额
 * @param showSign 是否显示正负号
 * @param currency 货币符号
 * @returns 格式化后的金额字符串
 */
export const formatAmount = (
  amount: number,
  showSign: boolean = false,
  currency: string = "¥"
): string => {
  const sign = showSign ? (amount >= 0 ? "+" : "-") : "";
  const absAmount = Math.abs(amount);
  return `${sign}${currency}${absAmount.toFixed(2)}`;
};

/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @param format 格式
 * @returns 格式化后的日期字符串
 */
export const formatDate = (
  date: string | Date,
  format: string = "YYYY-MM-DD"
): string => {
  return dayjs(date).format(format);
};

/**
 * 格式化日期时间
 * @param date 日期字符串或Date对象
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format("YYYY-MM-DD HH:mm:ss");
};

/**
 * 格式化百分比
 * @param value 数值
 * @param decimals 小数位数
 * @returns 格式化后的百分比字符串
 */
export const formatPercent = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * 格式化数字（添加千位分隔符）
 * @param num 数字
 * @returns 格式化后的数字字符串
 */
export const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * 格式化交易类型
 * @param type 交易类型
 * @returns 中文类型名称
 */
export const formatTransactionType = (type: string): string => {
  const typeMap: Record<string, string> = {
    income: "收入",
    expense: "支出",
    transfer: "转账",
  };
  return typeMap[type] || type;
};

/**
 * 格式化发票状态
 * @param status 发票状态
 * @returns 中文状态名称
 */
export const formatInvoiceStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: "待处理",
    matched: "已匹配",
    void: "已作废",
  };
  return statusMap[status] || status;
};

/**
 * 格式化预算周期类型
 * @param periodType 周期类型
 * @returns 中文周期名称
 */
export const formatPeriodType = (periodType: string): string => {
  const periodMap: Record<string, string> = {
    monthly: "月度",
    quarterly: "季度",
    yearly: "年度",
  };
  return periodMap[periodType] || periodType;
};