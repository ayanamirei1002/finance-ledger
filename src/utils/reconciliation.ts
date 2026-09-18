/**
 * 财务对账引擎
 *
 * 职责：
 *  1. 读取 Excel/CSV 文件并解析为统一结构
 *  2. 归一化日期、金额、往来名称
 *  3. 按金额 + 日期 + 往来单位三维匹配
 *  4. 输出：完全匹配 / 疑似匹配 / 未匹配 / 异常项
 */

import * as XLSX from "xlsx";

/* ================================================================== *
 *  类型定义
 * ================================================================== */

/** 统一的「流水行」结构（来源：付款流水 / 发票 / 收据） */
export interface NormalizedRow {
  _raw: Record<string, unknown>; // 原始行数据，用于调试/回溯
  _source: RowSource;           // 来源类型
  _index: number;               // 原始行号
  date: string;                 // YYYY-MM-DD
  amount: number;               // 正数，2 位小数
  counterparty: string;         // 归一化后的往来单位名称
  description: string;          // 摘要/备注
  invoiceNumber?: string;       // 发票号码（发票才有）
}

export type RowSource = "transaction" | "invoice" | "receipt";

/** 匹配结果 */
export interface MatchResult {
  matchType: MatchType;
  transaction?: NormalizedRow;
  invoice?: NormalizedRow;
  receipt?: NormalizedRow;
  amountDiff: number;
  dateDiffDays: number;
  counterpartySimilarity: number; // 0~1
  anomalies: Anomaly[];
  score: number; // 综合匹配得分 0~100
}

export type MatchType = "exact" | "suspected" | "unmatched";

/** 异常项 */
export interface Anomaly {
  type: AnomalyType;
  severity: "error" | "warning";
  message: string;
  transaction?: NormalizedRow;
  invoice?: NormalizedRow;
  receipt?: NormalizedRow;
}

export type AnomalyType =
  | "amount_mismatch"       // 金额不一致
  | "counterparty_mismatch" // 往来单位名称不一致
  | "date_mismatch"         // 日期差异过大
  | "no_invoice"            // 有流水没发票
  | "no_transaction"        // 有发票没流水
  | "duplicate"             // 疑似重复记录
  | "zero_amount";          // 金额为零

/** 列映射配置 */
export interface ColumnMapping {
  date: string;         // 列名
  amount: string;
  counterparty: string;
  description?: string;
  invoiceNumber?: string;
}

/** 匹配配置 */
export interface MatchConfig {
  amountTolerance: number;       // 金额容差（元），默认 0.01
  dateToleranceDays: number;     // 日期容差（天），默认 3
  similarityThreshold: number;   // 往来名称相似度阈值，0~1，默认 0.6
  suspectedThreshold: number;    // 疑似匹配的综合得分阈值，默认 40
}

const DEFAULT_CONFIG: MatchConfig = {
  amountTolerance: 0.01,
  dateToleranceDays: 3,
  similarityThreshold: 0.6,
  suspectedThreshold: 40,
};

/* ================================================================== *
 *  文件解析
 * ================================================================== */

/** 读取上传的 Excel/CSV 文件，返回原始行数组 */
export async function parseFile(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
  return rows;
}

/** 预览文件前 5 行，用于列映射界面 */
export async function previewFile(file: File): Promise<{
  columns: string[];
  rows: Record<string, unknown>[];
}> {
  const allRows = await parseFile(file);
  if (allRows.length === 0) return { columns: [], rows: [] };
  const columns = Object.keys(allRows[0]);
  return { columns, rows: allRows.slice(0, 5) };
}

/** 自动猜测列映射 */
export function guessColumnMapping(columns: string[]): ColumnMapping {
  const lc = columns.map((c) => c.toLowerCase().replace(/\s+/g, ""));

  const find = (...patterns: string[]): string => {
    for (const p of patterns) {
      const idx = lc.findIndex((c) => c.includes(p));
      if (idx >= 0) return columns[idx];
    }
    return columns[0] || "";
  };

  return {
    date: find("日期", "交易日期", "开票日期", "date", "时间", "记账日期"),
    amount: find("金额", "价税合计", "合计", "付款金额", "收入金额", "支出金额", "amount", "总额", "小计"),
    counterparty: find("对方", "往来", "销售方", "购买方", "收款方", "付款方", "户名", "名称", "customer", "vendor", "supplier", "对手"),
    description: find("摘要", "备注", "说明", "描述", "description", "remark", "用途"),
    invoiceNumber: find("发票号码", "发票号", "票据号", "invoice", "号码"),
  };
}

/* ================================================================== *
 *  字段归一化
 * ================================================================== */

/** 日期归一化：支持各种常见格式 → YYYY-MM-DD */
export function normalizeDate(raw: unknown): string {
  if (!raw) return "";
  const str = String(raw).trim();

  // 2026-09-18, 2026/9/18, 2026.9.18
  const isoMatch = str.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // 20260918 紧凑格式
  const compact = str.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) {
    const [, y, m, d] = compact;
    return `${y}-${m}-${d}`;
  }

  // 2026年9月18日
  const cnMatch = str.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (cnMatch) {
    const [, y, m, d] = cnMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Excel serial date number
  if (typeof raw === "number" && raw > 25569) {
    const date = new Date((raw - 25569) * 86400 * 1000);
    return date.toISOString().slice(0, 10);
  }

  // Date object
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10);
  }

  return str; // 无法解析时原样返回
}

/** 金额归一化：去货币符号/千分位/全角 → 正数浮点 */
export function normalizeAmount(raw: unknown): number {
  if (raw === null || raw === undefined || raw === "") return 0;

  let str = String(raw).trim();

  // 全角→半角
  str = str.replace(/[\uFF01-\uFF5E]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );

  // 去货币符号和非数字（保留负号和小数点）
  str = str.replace(/[¥￥$元,，\s]/g, "");

  // 括号表示负数：(123.45) → -123.45
  const paren = str.match(/^\((.+)\)$/);
  if (paren) str = "-" + paren[1];

  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(Math.abs(num) * 100) / 100;
}

/** 往来单位名称归一化 */
export function normalizeCounterparty(raw: unknown): string {
  if (!raw) return "";
  let name = String(raw).trim();

  // 去除常见后缀干扰
  name = name
    .replace(/[（(].*?[）)]/g, "") // 去括号内容
    .replace(/\s+/g, "")           // 去空白
    .replace(/有限公司$/, "公司")   // 简化后缀
    .replace(/股份公司$/, "公司")
    .replace(/有限责任公司$/, "公司")
    .replace(/^.*[:：]\s*/, "")     // 去前缀冒号描述
    .replace(/分公司$/, "")
    .replace(/支公司$/, "")
    .replace(/^中国/, "")           // 去「中国」前缀（太泛）
    .trim();

  return name;
}

/* ================================================================== *
 *  相似度计算
 * ================================================================== */

/** 编辑距离 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

/** 往来名称相似度 0~1 */
export function counterpartySimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;

  // 包含关系也算高相似
  if (a.includes(b) || b.includes(a)) {
    return Math.max(a.length, b.length) / Math.min(a.length, b.length) > 2 ? 0.6 : 0.85;
  }

  // 取较短的做基准
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(a, b);
  return Math.max(0, 1 - dist / maxLen);
}

/** 两个日期之间天数差 */
export function daysDiff(a: string, b: string): number {
  if (!a || !b) return 9999;
  const da = new Date(a);
  const db = new Date(b);
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return 9999;
  return Math.abs(Math.round((da.getTime() - db.getTime()) / 86400000));
}

/* ================================================================== *
 *  行归一化
 * ================================================================== */

/** 把原始行数组 + 列映射 → 归一化行数组 */
export function normalizeRows(
  rows: Record<string, unknown>[],
  mapping: ColumnMapping,
  source: RowSource
): NormalizedRow[] {
  return rows
    .map((raw, idx) => ({
      _raw: raw,
      _source: source,
      _index: idx + 2, // Excel 行号从 2 开始（跳过表头）
      date: normalizeDate(raw[mapping.date]),
      amount: normalizeAmount(raw[mapping.amount]),
      counterparty: normalizeCounterparty(raw[mapping.counterparty]),
      description: mapping.description ? String(raw[mapping.description] || "").trim() : "",
      invoiceNumber: mapping.invoiceNumber ? String(raw[mapping.invoiceNumber] || "").trim() : undefined,
    }))
    .filter((r) => r.amount > 0); // 过滤金额为 0 的无效行
}

/* ================================================================== *
 *  匹配算法
 * ================================================================== */

interface Candidate {
  row: NormalizedRow;
  amountDiff: number;
  dateDiff: number;
  counterpartySim: number;
  score: number;
}

function buildCandidate(
  txn: NormalizedRow,
  target: NormalizedRow,
  config: MatchConfig
): Candidate {
  const amountDiff = Math.abs(txn.amount - target.amount);
  const dateDiff = daysDiff(txn.date, target.date);
  const sim = counterpartySimilarity(txn.counterparty, target.counterparty);

  // 三维得分
  const amountScore = amountDiff <= config.amountTolerance ? 40 : Math.max(0, 40 - amountDiff / txn.amount * 100);
  const dateScore = dateDiff === 0 ? 30 : dateDiff <= config.dateToleranceDays ? 20 : Math.max(0, 10 - dateDiff);
  const simScore = sim >= 0.9 ? 30 : sim >= config.similarityThreshold ? 20 : sim * 20;

  return {
    row: target,
    amountDiff,
    dateDiff,
    counterpartySim: sim,
    score: amountScore + dateScore + simScore,
  };
}

function classifyMatchType(score: number, config: MatchConfig): MatchType {
  if (score >= 85) return "exact";
  if (score >= config.suspectedThreshold) return "suspected";
  return "unmatched";
}

/**
 * 核心匹配算法：
 *  1. 对每笔流水，在发票/收据池中找最佳匹配
 *  2. 对未匹配的流水，在收据池中再找一次
 *  3. 对剩余未匹配的流水/发票/收据，各自生成「未匹配」记录
 */
export function performReconciliation(
  transactions: NormalizedRow[],
  invoices: NormalizedRow[],
  receipts: NormalizedRow[],
  config: MatchConfig = DEFAULT_CONFIG
): { matches: MatchResult[]; anomalies: Anomaly[] } {
  const matches: MatchResult[] = [];
  const anomalies: Anomaly[] = [];
  const usedInvoices = new Set<number>();
  const usedReceipts = new Set<number>();

  // 第一轮：流水 vs 发票
  for (const txn of transactions) {
    // 检查零金额异常
    if (txn.amount === 0) {
      anomalies.push({
        type: "zero_amount",
        severity: "warning",
        message: `流水第 ${txn._index} 行金额为零`,
        transaction: txn,
      });
    }

    let bestMatch: Candidate | null = null;
    let bestIdx = -1;

    for (let i = 0; i < invoices.length; i++) {
      if (usedInvoices.has(i)) continue;
      const c = buildCandidate(txn, invoices[i], config);
      if (!bestMatch || c.score > bestMatch.score) {
        bestMatch = c;
        bestIdx = i;
      }
    }

    if (bestMatch && bestMatch.score >= config.suspectedThreshold) {
      usedInvoices.add(bestIdx);
      const matchType = classifyMatchType(bestMatch.score, config);
      const matchAnomalies: Anomaly[] = [];

      // 金额不一致
      if (bestMatch.amountDiff > config.amountTolerance) {
        matchAnomalies.push({
          type: "amount_mismatch",
          severity: "error",
          message: `金额不一致：流水 ¥${txn.amount.toFixed(2)} vs 发票 ¥${bestMatch.row.amount.toFixed(2)}，差额 ¥${bestMatch.amountDiff.toFixed(2)}`,
          transaction: txn,
          invoice: bestMatch.row,
        });
      }

      // 往来单位名称不一致
      if (bestMatch.counterpartySim < config.similarityThreshold) {
        matchAnomalies.push({
          type: "counterparty_mismatch",
          severity: "warning",
          message: `往来单位不一致：流水「${txn.counterparty}」vs 发票「${bestMatch.row.counterparty}」（相似度 ${(bestMatch.counterpartySim * 100).toFixed(0)}%）`,
          transaction: txn,
          invoice: bestMatch.row,
        });
      }

      // 日期差异过大
      if (bestMatch.dateDiff > config.dateToleranceDays) {
        matchAnomalies.push({
          type: "date_mismatch",
          severity: "warning",
          message: `日期差异过大：流水 ${txn.date} vs 发票 ${bestMatch.row.date}（相差 ${bestMatch.dateDiff} 天）`,
          transaction: txn,
          invoice: bestMatch.row,
        });
      }

      matches.push({
        matchType,
        transaction: txn,
        invoice: bestMatch.row,
        amountDiff: bestMatch.amountDiff,
        dateDiffDays: bestMatch.dateDiff,
        counterpartySimilarity: bestMatch.counterpartySim,
        anomalies: matchAnomalies,
        score: bestMatch.score,
      });
      anomalies.push(...matchAnomalies);
    }
  }

  // 第二轮：未匹配的流水 vs 收据
  // 还需要找出完全没参与匹配的流水
  const matchedTxnSet = new Set(matches.filter((m) => m.transaction).map((m) => m.transaction!._index));

  for (const txn of transactions) {
    if (matchedTxnSet.has(txn._index)) continue;

    let bestMatch: Candidate | null = null;
    let bestIdx = -1;

    for (let i = 0; i < receipts.length; i++) {
      if (usedReceipts.has(i)) continue;
      const c = buildCandidate(txn, receipts[i], config);
      if (!bestMatch || c.score > bestMatch.score) {
        bestMatch = c;
        bestIdx = i;
      }
    }

    if (bestMatch && bestMatch.score >= config.suspectedThreshold) {
      usedReceipts.add(bestIdx);
      const matchType = classifyMatchType(bestMatch.score, config);
      const matchAnomalies: Anomaly[] = [];

      if (bestMatch.amountDiff > config.amountTolerance) {
        matchAnomalies.push({
          type: "amount_mismatch",
          severity: "error",
          message: `金额不一致：流水 ¥${txn.amount.toFixed(2)} vs 收据 ¥${bestMatch.row.amount.toFixed(2)}，差额 ¥${bestMatch.amountDiff.toFixed(2)}`,
          transaction: txn,
          receipt: bestMatch.row,
        });
      }

      if (bestMatch.counterpartySim < config.similarityThreshold) {
        matchAnomalies.push({
          type: "counterparty_mismatch",
          severity: "warning",
          message: `往来单位不一致：流水「${txn.counterparty}」vs 收据「${bestMatch.row.counterparty}」`,
          transaction: txn,
          receipt: bestMatch.row,
        });
      }

      matches.push({
        matchType,
        transaction: txn,
        receipt: bestMatch.row,
        amountDiff: bestMatch.amountDiff,
        dateDiffDays: bestMatch.dateDiff,
        counterpartySimilarity: bestMatch.counterpartySim,
        anomalies: matchAnomalies,
        score: bestMatch.score,
      });
      anomalies.push(...matchAnomalies);
    }
  }

  // 第三轮：剩余未匹配的流水 → 有流水没发票
  const finalMatchedTxnSet = new Set(matches.map((m) => m.transaction?._index).filter(Boolean));
  for (const txn of transactions) {
    if (finalMatchedTxnSet.has(txn._index)) continue;
    const anomaly: Anomaly = {
      type: "no_invoice",
      severity: "error",
      message: `流水第 ${txn._index} 行（${txn.date} ¥${txn.amount.toFixed(2)} ${txn.counterparty}）无匹配发票或收据`,
      transaction: txn,
    };
    anomalies.push(anomaly);
    matches.push({
      matchType: "unmatched",
      transaction: txn,
      amountDiff: 0,
      dateDiffDays: 0,
      counterpartySimilarity: 0,
      anomalies: [anomaly],
      score: 0,
    });
  }

  // 第四轮：未匹配的发票 → 有发票没流水
  for (let i = 0; i < invoices.length; i++) {
    if (usedInvoices.has(i)) continue;
    const inv = invoices[i];
    const anomaly: Anomaly = {
      type: "no_transaction",
      severity: "error",
      message: `发票第 ${inv._index} 行（${inv.date} ¥${inv.amount.toFixed(2)} ${inv.counterparty}）无匹配流水`,
      invoice: inv,
    };
    anomalies.push(anomaly);
    matches.push({
      matchType: "unmatched",
      invoice: inv,
      amountDiff: 0,
      dateDiffDays: 0,
      counterpartySimilarity: 0,
      anomalies: [anomaly],
      score: 0,
    });
  }

  // 按得分降序排列
  matches.sort((a, b) => b.score - a.score);

  return { matches, anomalies };
}

/* ================================================================== *
 *  Excel 导出
 * ================================================================== */

export function exportToExcel(
  matches: MatchResult[],
  anomalies: Anomaly[],
  filename = "财务对账结果.xlsx"
): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: 全部匹配结果
  const allRows = matches.map((m, i) => ({
    序号: i + 1,
    匹配类型: m.matchType === "exact" ? "完全匹配" : m.matchType === "suspected" ? "疑似匹配" : "未匹配",
    匹配得分: m.score,
    流水日期: m.transaction?.date || "",
    流水金额: m.transaction?.amount || "",
    流水往来: m.transaction?.counterparty || "",
    流水摘要: m.transaction?.description || "",
    发票日期: m.invoice?.date || "",
    发票金额: m.invoice?.amount || "",
    发票往来: m.invoice?.counterparty || "",
    发票号码: m.invoice?.invoiceNumber || "",
    收据日期: m.receipt?.date || "",
    收据金额: m.receipt?.amount || "",
    收据往来: m.receipt?.counterparty || "",
    金额差异: m.amountDiff,
    日期差异天数: m.dateDiffDays,
    往来相似度: (m.counterpartySimilarity * 100).toFixed(0) + "%",
    异常说明: m.anomalies.map((a) => a.message).join("; "),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allRows), "全部结果");

  // Sheet 2/3/4: 分类
  const types: [MatchType, string][] = [
    ["exact", "完全匹配"],
    ["suspected", "疑似匹配"],
    ["unmatched", "未匹配"],
  ];
  for (const [type, label] of types) {
    const subset = matches
      .filter((m) => m.matchType === type)
      .map((m, i) => ({
        序号: i + 1,
        匹配得分: m.score,
        流水日期: m.transaction?.date || "",
        流水金额: m.transaction?.amount || "",
        流水往来: m.transaction?.counterparty || "",
        发票日期: m.invoice?.date || "",
        发票金额: m.invoice?.amount || "",
        发票往来: m.invoice?.counterparty || "",
        收据日期: m.receipt?.date || "",
        收据金额: m.receipt?.amount || "",
        收据往来: m.receipt?.counterparty || "",
        金额差异: m.amountDiff,
        异常说明: m.anomalies.map((a) => a.message).join("; "),
      }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(subset), label);
  }

  // Sheet 5: 异常项
  const anomalyRows = anomalies.map((a, i) => ({
    序号: i + 1,
    异常类型: anomalyTypeLabel(a.type),
    严重程度: a.severity === "error" ? "错误" : "警告",
    异常说明: a.message,
    流水日期: a.transaction?.date || "",
    流水金额: a.transaction?.amount || "",
    流水往来: a.transaction?.counterparty || "",
    发票日期: a.invoice?.date || "",
    发票金额: a.invoice?.amount || "",
    发票往来: a.invoice?.counterparty || "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(anomalyRows), "异常项");

  // Sheet 6: 统计摘要
  const exactCount = matches.filter((m) => m.matchType === "exact").length;
  const suspectedCount = matches.filter((m) => m.matchType === "suspected").length;
  const unmatchedCount = matches.filter((m) => m.matchType === "unmatched").length;
  const errorCount = anomalies.filter((a) => a.severity === "error").length;
  const warnCount = anomalies.filter((a) => a.severity === "warning").length;
  const summary = [
    { 统计项: "总匹配记录数", 数值: matches.length },
    { 统计项: "完全匹配", 数值: exactCount },
    { 统计项: "疑似匹配", 数值: suspectedCount },
    { 统计项: "未匹配", 数值: unmatchedCount },
    { 统计项: "异常总数", 数值: anomalies.length },
    { 统计项: "错误级异常", 数值: errorCount },
    { 统计项: "警告级异常", 数值: warnCount },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "统计摘要");

  XLSX.writeFile(wb, filename);
}

function anomalyTypeLabel(type: AnomalyType): string {
  const map: Record<AnomalyType, string> = {
    amount_mismatch: "金额不一致",
    counterparty_mismatch: "往来单位不一致",
    date_mismatch: "日期差异过大",
    no_invoice: "有流水无发票",
    no_transaction: "有发票无流水",
    duplicate: "疑似重复",
    zero_amount: "金额为零",
  };
  return map[type] || type;
}

export { DEFAULT_CONFIG };
