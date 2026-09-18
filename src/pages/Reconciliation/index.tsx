import { useState, useCallback } from "react";
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Select,
  InputNumber,
  Alert,
  Statistic,
  Row,
  Col,
  Steps,
  Upload,
  message,
  Tooltip,
  Progress,
} from "antd";
import {
  InboxOutlined,
  DownloadOutlined,
  SwapOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  parseFile,
  previewFile,
  guessColumnMapping,
  normalizeRows,
  performReconciliation,
  exportToExcel,
  DEFAULT_CONFIG,
} from "../../utils/reconciliation";
import type {
  ColumnMapping,
  MatchConfig,
  MatchResult,
  Anomaly,
  RowSource,
} from "../../utils/reconciliation";
import styles from "./index.module.scss";

const { Dragger } = Upload;
const { Option } = Select;

/** 文件槽：每个来源一份文件 + 映射 + 预览 */
interface FileSlot {
  file: File | null;
  columns: string[];
  preview: Record<string, unknown>[];
  mapping: ColumnMapping;
}

const emptyMapping: ColumnMapping = {
  date: "",
  amount: "",
  counterparty: "",
  description: "",
  invoiceNumber: "",
};

function createSlot(): FileSlot {
  return { file: null, columns: [], preview: [], mapping: { ...emptyMapping } };
}

const Reconciliation = () => {
  // 当前步骤
  const [step, setStep] = useState(0);

  // 三个来源的文件槽
  const [txnSlot, setTxnSlot] = useState<FileSlot>(createSlot());
  const [invSlot, setInvSlot] = useState<FileSlot>(createSlot());
  const [rcpSlot, setRcpSlot] = useState<FileSlot>(createSlot());

  // 匹配配置
  const [config, setConfig] = useState<MatchConfig>({ ...DEFAULT_CONFIG });

  // 匹配结果
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [matching, setMatching] = useState(false);
  const [resultFilter, setResultFilter] = useState<string>("all");

  // ---------- 文件处理 ----------

  const handleFile = useCallback(
    async (file: File, source: RowSource) => {
      try {
        const { columns, rows } = await previewFile(file);
        const mapping = guessColumnMapping(columns);
        const slot: FileSlot = { file, columns, preview: rows, mapping };
        if (source === "transaction") setTxnSlot(slot);
        else if (source === "invoice") setInvSlot(slot);
        else setRcpSlot(slot);
        message.success(`${file.name} 解析成功（${columns.length} 列，${rows.length}+ 行）`);
      } catch (err) {
        message.error(`解析 ${file.name} 失败: ${(err as Error).message}`);
      }
      return false; // 阻止 antd 上传
    },
    []
  );

  const updateMapping = useCallback(
    (source: RowSource, field: keyof ColumnMapping, value: string) => {
      const setter =
        source === "transaction" ? setTxnSlot : source === "invoice" ? setInvSlot : setRcpSlot;
      setter((prev) => ({
        ...prev,
        mapping: { ...prev.mapping, [field]: value },
      }));
    },
    []
  );

  // ---------- 对账执行 ----------

  const runMatch = useCallback(async () => {
    if (!txnSlot.file) {
      message.warning("请至少上传付款流水文件");
      return;
    }

    setMatching(true);
    try {
      const txnRows = await parseFile(txnSlot.file);
      const invRows = invSlot.file ? await parseFile(invSlot.file) : [];
      const rcpRows = rcpSlot.file ? await parseFile(rcpSlot.file) : [];

      const transactions = normalizeRows(txnRows, txnSlot.mapping, "transaction");
      const invoices = normalizeRows(invRows, invSlot.mapping, "invoice");
      const receipts = normalizeRows(rcpRows, rcpSlot.mapping, "receipt");

      if (transactions.length === 0) {
        message.error("付款流水解析结果为空，请检查列映射是否正确");
        return;
      }

      const result = performReconciliation(transactions, invoices, receipts, config);
      setMatches(result.matches);
      setAnomalies(result.anomalies);
      setStep(2);

      const exact = result.matches.filter((m) => m.matchType === "exact").length;
      const suspected = result.matches.filter((m) => m.matchType === "suspected").length;
      const unmatched = result.matches.filter((m) => m.matchType === "unmatched").length;
      message.success(
        `对账完成：${exact} 完全匹配、${suspected} 疑似匹配、${unmatched} 未匹配、${result.anomalies.length} 异常`
      );
    } catch (err) {
      message.error(`对账失败: ${(err as Error).message}`);
    } finally {
      setMatching(false);
    }
  }, [txnSlot, invSlot, rcpSlot, config]);

  // ---------- 导出 ----------

  const handleExport = useCallback(() => {
    if (matches.length === 0) {
      message.warning("没有可导出的结果");
      return;
    }
    exportToExcel(matches, anomalies, `财务对账结果_${new Date().toISOString().slice(0, 10)}.xlsx`);
    message.success("导出成功");
  }, [matches, anomalies]);

  // ---------- 步骤导航 ----------

  const canGoStep1 = txnSlot.columns.length > 0;

  // ---------- 渲染 ----------

  const filteredMatches = resultFilter === "all"
    ? matches
    : matches.filter((m) => m.matchType === resultFilter);

  const resultColumns: ColumnsType<MatchResult> = [
    {
      title: "类型",
      dataIndex: "matchType",
      width: 90,
      fixed: "left",
      render: (v: string) => (
        <Tag color={v === "exact" ? "success" : v === "suspected" ? "warning" : "error"}>
          {v === "exact" ? "完全匹配" : v === "suspected" ? "疑似匹配" : "未匹配"}
        </Tag>
      ),
    },
    { title: "得分", dataIndex: "score", width: 60, sorter: (a, b) => a.score - b.score },
    { title: "流水日期", dataIndex: ["transaction", "date"], width: 110 },
    {
      title: "流水金额",
      dataIndex: ["transaction", "amount"],
      width: 100,
      render: (v: number) => (v ? `¥${v.toFixed(2)}` : ""),
    },
    { title: "流水往来", dataIndex: ["transaction", "counterparty"], width: 150, ellipsis: true },
    {
      title: "发票/收据日期",
      width: 110,
      render: (_: unknown, r: MatchResult) => r.invoice?.date || r.receipt?.date || "",
    },
    {
      title: "发票/收据金额",
      width: 110,
      render: (_: unknown, r: MatchResult) => {
        const v = r.invoice?.amount || r.receipt?.amount;
        return v ? `¥${v.toFixed(2)}` : "";
      },
    },
    {
      title: "发票/收据往来",
      width: 150,
      ellipsis: true,
      render: (_: unknown, r: MatchResult) => r.invoice?.counterparty || r.receipt?.counterparty || "",
    },
    { title: "金额差异", dataIndex: "amountDiff", width: 90, render: (v: number) => v > 0 ? `¥${v.toFixed(2)}` : "-" },
    { title: "日期差", dataIndex: "dateDiffDays", width: 70, render: (v: number) => v > 0 ? `${v}天` : "-" },
    {
      title: "异常",
      width: 200,
      ellipsis: true,
      render: (_: unknown, r: MatchResult) =>
        r.anomalies.length > 0 ? (
          <Tooltip title={r.anomalies.map((a) => a.message).join("\n")}>
            <Tag color={r.anomalies.some((a) => a.severity === "error") ? "error" : "warning"}>
              {r.anomalies.length} 项
            </Tag>
          </Tooltip>
        ) : (
          <Tag color="success">正常</Tag>
        ),
    },
  ];

  return (
    <div className={styles.container}>
      <Steps
        current={step}
        onChange={setStep}
        className={styles.steps}
        items={[
          { title: "上传文件" },
          { title: "配置映射", disabled: !canGoStep1 },
          { title: "查看结果", disabled: matches.length === 0 },
        ]}
      />

      {/* ===== 步骤 0：上传文件 ===== */}
      {step === 0 && (
        <div className={styles.stepContent}>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="支持 Excel (.xlsx / .xls) 和 CSV 文件"
            description="付款流水为必填，发票和收据为选填（有则自动匹配，无则标记异常）。每个文件至少包含日期、金额、往来单位三列。"
          />

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Card title="📄 付款流水（必填）" size="small">
                <Dragger
                  accept=".xlsx,.xls,.csv"
                  showUploadList={false}
                  beforeUpload={(f) => handleFile(f as File, "transaction")}
                  style={{ marginBottom: 12 }}
                >
                  <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                  <p>点击或拖拽流水文件到此处</p>
                </Dragger>
                {txnSlot.file && (
                  <Alert type="success" showIcon message={`${txnSlot.file.name} ✓`} />
                )}
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card title="🧾 发票（选填）" size="small">
                <Dragger
                  accept=".xlsx,.xls,.csv"
                  showUploadList={false}
                  beforeUpload={(f) => handleFile(f as File, "invoice")}
                  style={{ marginBottom: 12 }}
                >
                  <p className="ant-upload-drag-icon"><FileExcelOutlined /></p>
                  <p>点击或拖拽发票文件到此处</p>
                </Dragger>
                {invSlot.file && (
                  <Alert type="success" showIcon message={`${invSlot.file.name} ✓`} />
                )}
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card title="📋 收据（选填）" size="small">
                <Dragger
                  accept=".xlsx,.xls,.csv"
                  showUploadList={false}
                  beforeUpload={(f) => handleFile(f as File, "receipt")}
                  style={{ marginBottom: 12 }}
                >
                  <p className="ant-upload-drag-icon"><FileExcelOutlined /></p>
                  <p>点击或拖拽收据文件到此处</p>
                </Dragger>
                {rcpSlot.file && (
                  <Alert type="success" showIcon message={`${rcpSlot.file.name} ✓`} />
                )}
              </Card>
            </Col>
          </Row>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Button
              type="primary"
              size="large"
              disabled={!canGoStep1}
              onClick={() => setStep(1)}
            >
              下一步：配置列映射
            </Button>
          </div>
        </div>
      )}

      {/* ===== 步骤 1：配置映射 + 匹配参数 ===== */}
      {step === 1 && (
        <div className={styles.stepContent}>
          {/* 匹配配置 */}
          <Card title="匹配参数" size="small" style={{ marginBottom: 16 }}>
            <Space size="large" wrap>
              <div>
                <span>金额容差（元）：</span>
                <InputNumber
                  min={0}
                  max={1000}
                  step={0.01}
                  value={config.amountTolerance}
                  onChange={(v) => setConfig((c) => ({ ...c, amountTolerance: v || 0 }))}
                />
              </div>
              <div>
                <span>日期容差（天）：</span>
                <InputNumber
                  min={0}
                  max={30}
                  value={config.dateToleranceDays}
                  onChange={(v) => setConfig((c) => ({ ...c, dateToleranceDays: v || 0 }))}
                />
              </div>
              <div>
                <span>名称相似度阈值：</span>
                <InputNumber
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.similarityThreshold}
                  onChange={(v) => setConfig((c) => ({ ...c, similarityThreshold: v || 0 }))}
                />
              </div>
              <div>
                <span>疑似匹配阈值：</span>
                <InputNumber
                  min={0}
                  max={100}
                  step={5}
                  value={config.suspectedThreshold}
                  onChange={(v) => setConfig((c) => ({ ...c, suspectedThreshold: v || 0 }))}
                />
              </div>
            </Space>
          </Card>

          {/* 列映射 */}
          {([
            ["transaction", "付款流水", txnSlot] as const,
            ["invoice", "发票", invSlot] as const,
            ["receipt", "收据", rcpSlot] as const,
          ]).map(([source, label, slot]) => {
            if (!slot.file) return null;
            return (
              <Card
                key={source}
                title={`${label} — ${slot.file.name} 的列映射`}
                size="small"
                style={{ marginBottom: 16 }}
              >
                <Space wrap size="middle">
                  {(["date", "amount", "counterparty", "description", "invoiceNumber"] as const).map(
                    (field) => {
                      const labels: Record<string, string> = {
                        date: "日期",
                        amount: "金额",
                        counterparty: "往来单位",
                        description: "摘要",
                        invoiceNumber: "发票号码",
                      };
                      const required = field !== "description" && field !== "invoiceNumber";
                      return (
                        <div key={field}>
                          <span>
                            {labels[field]}
                            {required && <span style={{ color: "#ff4d4f" }}>*</span>}：
                          </span>
                          <Select
                            style={{ width: 160 }}
                            value={slot.mapping[field] || undefined}
                            placeholder="选择列"
                            onChange={(v) => updateMapping(source, field, v)}
                            allowClear={!required}
                          >
                            {slot.columns.map((col) => (
                              <Option key={col} value={col}>
                                {col}
                              </Option>
                            ))}
                          </Select>
                        </div>
                      );
                    }
                  )}
                </Space>

                {/* 预览前 3 行 */}
                {slot.preview.length > 0 && (
                  <Table
                    size="small"
                    dataSource={slot.preview.slice(0, 3)}
                    columns={slot.columns.map((c) => ({
                      title: c,
                      dataIndex: c,
                      ellipsis: true,
                      width: 120,
                    }))}
                    rowKey={(_, i) => String(i)}
                    pagination={false}
                    scroll={{ x: true }}
                    style={{ marginTop: 12 }}
                  />
                )}
              </Card>
            );
          })}

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Space>
              <Button onClick={() => setStep(0)}>上一步</Button>
              <Button type="primary" size="large" loading={matching} onClick={runMatch}>
                <SwapOutlined /> 开始对账
              </Button>
            </Space>
          </div>
        </div>
      )}

      {/* ===== 步骤 2：结果展示 ===== */}
      {step === 2 && (
        <div className={styles.stepContent}>
          {/* 统计卡片 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="完全匹配"
                  value={matches.filter((m) => m.matchType === "exact").length}
                  valueStyle={{ color: "#52c41a" }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="疑似匹配"
                  value={matches.filter((m) => m.matchType === "suspected").length}
                  valueStyle={{ color: "#faad14" }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="未匹配"
                  value={matches.filter((m) => m.matchType === "unmatched").length}
                  valueStyle={{ color: "#ff4d4f" }}
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="异常项"
                  value={anomalies.length}
                  valueStyle={{ color: anomalies.length > 0 ? "#ff4d4f" : "#52c41a" }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* 匹配率进度条 */}
          {matches.length > 0 && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                <span>匹配率：</span>
                <Progress
                  percent={Math.round(
                    (matches.filter((m) => m.matchType !== "unmatched").length / matches.length) * 100
                  )}
                  status="active"
                  style={{ flex: 1 }}
                />
              </div>
            </Card>
          )}

          {/* 结果表格 */}
          <Card
            title="匹配结果"
            extra={
              <Space>
                <Select value={resultFilter} onChange={setResultFilter} style={{ width: 130 }}>
                  <Option value="all">全部</Option>
                  <Option value="exact">完全匹配</Option>
                  <Option value="suspected">疑似匹配</Option>
                  <Option value="unmatched">未匹配</Option>
                </Select>
                <Button onClick={() => setStep(1)}>重新配置</Button>
                <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
                  导出 Excel
                </Button>
              </Space>
            }
          >
            <Table
              columns={resultColumns}
              dataSource={filteredMatches}
              rowKey={(_, i) => String(i)}
              size="small"
              scroll={{ x: 1400 }}
              pagination={{ pageSize: 50, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
            />
          </Card>
        </div>
      )}
    </div>
  );
};

export default Reconciliation;
