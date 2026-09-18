/**
 * 本地 OCR 服务客户端 + 发票字段抽取
 *
 * 依赖同目录下 ocr-server.js 提供的本地服务（Windows 内置 OCR 引擎，离线）。
 * 服务未启动时抛出的错误带有 code === 'OCR_OFFLINE'，便于界面给出友好提示。
 */

export const DEFAULT_OCR_SERVICE = 'http://127.0.0.1:3100';

const SERVICE_KEY = 'finance_ledger_ocr_service';

export function getOcrServiceUrl(): string {
  try {
    return localStorage.getItem(SERVICE_KEY) || DEFAULT_OCR_SERVICE;
  } catch {
    return DEFAULT_OCR_SERVICE;
  }
}

export function setOcrServiceUrl(url: string): void {
  try {
    localStorage.setItem(SERVICE_KEY, url);
  } catch {
    /* ignore */
  }
}

export interface OcrResult {
  text: string;
  lines: string[];
  lineCount: number;
  elapsedMs: number;
  totalMs: number;
  language: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export interface OcrHealth {
  ok: boolean;
  engine: string;
  languages: string[];
  defaultLanguage: string;
  uptimeMs: number;
}

function offlineError(cause?: unknown): Error {
  const err = new Error(
    `OCR 服务未启动。请先运行：node ocr-server.js（默认端口 3100）` +
      (cause ? ` 原因：${(cause as Error).message || cause}` : '')
  );
  (err as Error & { code?: string }).code = 'OCR_OFFLINE';
  return err;
}

/** 探测 OCR 服务状态 */
export async function checkOcrHealth(timeoutMs = 4000): Promise<OcrHealth> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${getOcrServiceUrl()}/health`, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as OcrHealth;
  } catch (err) {
    throw offlineError(err);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 把图片文件转成适合传输的 base64（过大的图先等比缩小，提升识别速度与成功率）
 */
async function fileToImagePayload(file: File): Promise<{ image: string; mimeType: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('读取图片文件失败'));
    reader.readAsDataURL(file);
  });

  const MAX_EDGE = 2400;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('图片解码失败，请换一张图片'));
    el.src = dataUrl;
  });

  const longest = Math.max(img.width, img.height);
  if (longest <= MAX_EDGE) {
    return { image: dataUrl, mimeType: file.type || 'image/png' };
  }

  // 等比缩小后统一导出 PNG（Windows OCR 对 PNG 支持最好）
  const scale = MAX_EDGE / longest;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { image: dataUrl, mimeType: file.type || 'image/png' };
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { image: canvas.toDataURL('image/png'), mimeType: 'image/png' };
}

/** 识别一张图片，返回原始文本与逐行结果 */
export async function recognizeImage(
  file: File,
  options: { language?: string; timeoutMs?: number } = {}
): Promise<OcrResult> {
  const { image, mimeType } = await fileToImagePayload(file);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 60000);
  try {
    const res = await fetch(`${getOcrServiceUrl()}/ocr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, mimeType, language: options.language }),
      signal: controller.signal,
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error((payload && payload.error) || `OCR 服务返回 HTTP ${res.status}`);
    }
    return payload as OcrResult;
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error('OCR 识别超时，请换一张更清晰或更小的图片');
    }
    if (err instanceof TypeError) {
      // fetch 网络层失败 —— 服务没起来
      throw offlineError(err);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ *
 * 文本归一化与字段抽取
 * ------------------------------------------------------------------ */

/**
 * 归一化 OCR 文本：
 *  1. 全角数字/符号转半角（`1130．00` -> `1130.00`）
 *  2. 去除中文字符之间的空格（OCR 常把 `发票号码` 输出成 `发 票 号 码`）
 *  3. 修正已知的字形拆分问题（`钅肖` -> `销`）
 */
export function normalizeOcrText(raw: string): string {
  let text = raw || '';

  // 全角 -> 半角（数字、字母、常见标点）
  text = text.replace(/[\uFF01-\uFF5E]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );
  text = text.replace(/\u3000/g, ' ');

  // 修正偏旁被拆开的情况
  text = text.replace(/钅肖/g, '销').replace(/钅艮/g, '银').replace(/讠十/g, '计');

  // 去掉中文字符之间的空格
  text = text.replace(/([\u4e00-\u9fa5])\s+(?=[\u4e00-\u9fa5])/g, '$1');

  // 压缩连续空白（保留换行信息时另用 lines）
  return text.replace(/[ \t]{2,}/g, ' ').trim();
}

export interface InvoiceFields {
  invoiceNumber?: string;
  invoiceDate?: string; // YYYY-MM-DD
  totalAmount?: number; // 价税合计
  taxAmount?: number; // 税额
  amount?: number; // 不含税金额
  sellerName?: string;
  buyerName?: string;
}

const NAME_CHARS = '\\u4e00-\\u9fa5A-Za-z0-9()（）·\\-—';

function toNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const num = Number(value.replace(/[,，\s]/g, ''));
  return Number.isFinite(num) ? num : undefined;
}

/**
 * 从 OCR 文本中抽取发票字段（启发式，结果需用户确认）
 */
export function parseInvoiceFields(raw: string): InvoiceFields {
  const text = normalizeOcrText(raw);
  const flat = text.replace(/\n/g, ' ');
  const fields: InvoiceFields = {};

  // 发票号码：8~25 位数字
  const numberMatch =
    flat.match(/(?:发票号码|发票代码及号码|发票号|票据号码|号码|No\.?)[^\d]{0,8}(\d{8,25})/i) ||
    flat.match(/\b(\d{20}|\d{12}|\d{10}|\d{8})\b/);
  if (numberMatch) fields.invoiceNumber = numberMatch[1];

  // 开票日期：优先中文年月日，其次 YYYY-MM-DD
  const cnDate = flat.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (cnDate) {
    const [, y, m, d] = cnDate;
    fields.invoiceDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  } else {
    const isoDate = flat.match(/(\d{4})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})/);
    if (isoDate) {
      const [, y, m, d] = isoDate;
      fields.invoiceDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  // 价税合计（小写金额）
  const totalMatch =
    flat.match(/(?:价税合计|合计金额|价税总计)[^\d]{0,16}?([\d,]+\.\d{2})/) ||
    flat.match(/\(小写\)[^\d]{0,8}?([\d,]+\.\d{2})/);
  fields.totalAmount = toNumber(totalMatch?.[1]);

  // 税额
  const taxMatch = flat.match(/税额[^\d]{0,12}?([\d,]+\.\d{2})/);
  fields.taxAmount = toNumber(taxMatch?.[1]);

  // 不含税金额：显式匹配，否则用「价税合计 - 税额」推算
  const amountMatch = flat.match(/(?:不含税金额|金额|合计)[^\d]{0,12}?([\d,]+\.\d{2})/);
  fields.amount = toNumber(amountMatch?.[1]);
  if (fields.amount === undefined && fields.totalAmount !== undefined && fields.taxAmount !== undefined) {
    const diff = fields.totalAmount - fields.taxAmount;
    if (diff > 0) fields.amount = Number(diff.toFixed(2));
  }

  // 销售方 / 购买方名称
  const sellerMatch = flat.match(
    new RegExp(
      `(?:销售方|销货方|卖方|销方)[^${NAME_CHARS}]{0,8}(?:名称)?[：:]?\\s*([${NAME_CHARS}]{3,40}?)(?=纳税人|识别号|地址|开户|电话|购买方|购方|$)`
    )
  );
  if (sellerMatch) fields.sellerName = sellerMatch[1].trim();

  const buyerMatch = flat.match(
    new RegExp(
      `(?:购买方|购货方|买方|购方)[^${NAME_CHARS}]{0,8}(?:名称)?[：:]?\\s*([${NAME_CHARS}]{3,40}?)(?=纳税人|识别号|地址|开户|电话|销售方|销方|$)`
    )
  );
  if (buyerMatch) fields.buyerName = buyerMatch[1].trim();

  return fields;
}

/** 从 OCR 行里挑出最像「销售方/购买方名称」的一段（用于调试与人工核对） */
export function summarizeOcr(lines: string[]): string {
  return lines.slice(0, 8).join(' / ');
}
