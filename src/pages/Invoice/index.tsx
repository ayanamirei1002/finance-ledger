import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  Upload,
  Alert,
  Tooltip,
  message,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
  ScanOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { api } from "../../api";
import {
  recognizeImage,
  parseInvoiceFields,
  checkOcrHealth,
  normalizeOcrText,
} from "../../utils/ocr";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import styles from "./index.module.scss";

const { Option } = Select;

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  seller_name: string;
  buyer_name: string;
  invoice_type: string;
  status: string;
  image_path?: string;
  ocr_result?: string;
}

const InvoicePage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [form] = Form.useForm();

  // OCR 相关状态
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrRawText, setOcrRawText] = useState("");
  const [ocrElapsed, setOcrElapsed] = useState<number | null>(null);
  const [ocrServiceError, setOcrServiceError] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
    // 探测本地 OCR 服务是否在线，离线时界面给出明确指引
    checkOcrHealth()
      .then(() => setOcrServiceError(null))
      .catch((err) => setOcrServiceError(err.message));
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await api.getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error("Failed to load invoices:", error);
      message.error("加载发票数据失败");
    } finally {
      setLoading(false);
    }
  };

  /** 识别选中的发票图片，并把抽出的字段回填表单 */
  const handleOcrFile = async (file: File) => {
    setOcrLoading(true);
    setOcrRawText("");
    setOcrElapsed(null);
    try {
      const result = await recognizeImage(file);
      const normalized = normalizeOcrText(result.text);
      const fields = parseInvoiceFields(result.text);

      setOcrRawText(normalized);
      setOcrElapsed(result.elapsedMs);
      setOcrServiceError(null);

      // 回填表单：只覆盖识别出内容的字段，保留用户已填的其他项
      const patch: Record<string, unknown> = { ocr_result: normalized };
      if (fields.invoiceNumber) patch.invoice_number = fields.invoiceNumber;
      if (fields.invoiceDate) patch.invoice_date = dayjs(fields.invoiceDate);
      if (fields.amount !== undefined) patch.amount = fields.amount;
      if (fields.taxAmount !== undefined) patch.tax_amount = fields.taxAmount;
      if (fields.totalAmount !== undefined) patch.total_amount = fields.totalAmount;
      if (fields.sellerName) patch.seller_name = fields.sellerName;
      if (fields.buyerName) patch.buyer_name = fields.buyerName;
      form.setFieldsValue(patch);

      const hit = Object.keys(patch).length - 1; // 去掉 ocr_result 本身
      if (hit > 0) {
        message.success(`识别完成（${result.elapsedMs}ms），已回填 ${hit} 个字段，请核对后保存`);
      } else {
        message.warning(`识别完成（${result.elapsedMs}ms），但未抽取出字段，请手动填写`);
      }
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === "OCR_OFFLINE") {
        setOcrServiceError(e.message);
      }
      message.error(e.message || "OCR 识别失败");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingInvoice(null);
    setOcrRawText("");
    setOcrElapsed(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Invoice) => {
    setEditingInvoice(record);
    setOcrRawText(record.ocr_result || "");
    setOcrElapsed(null);
    form.setFieldsValue({
      ...record,
      invoice_date: record.invoice_date,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteInvoice(id);
      message.success("删除成功");
      loadInvoices();
    } catch (error) {
      message.error("删除失败");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingInvoice) {
        await api.updateInvoice(editingInvoice.id, values);
        message.success("更新成功");
      } else {
        await api.createInvoice(values);
        message.success("创建成功");
      }
      setModalVisible(false);
      loadInvoices();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const columns: ColumnsType<Invoice> = [
    {
      title: "发票号码",
      dataIndex: "invoice_number",
      key: "invoice_number",
      width: 150,
    },
    {
      title: "开票日期",
      dataIndex: "invoice_date",
      key: "invoice_date",
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "金额",
      dataIndex: "amount",
      key: "amount",
      width: 100,
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: "税额",
      dataIndex: "tax_amount",
      key: "tax_amount",
      width: 100,
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: "价税合计",
      dataIndex: "total_amount",
      key: "total_amount",
      width: 120,
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: "销售方",
      dataIndex: "seller_name",
      key: "seller_name",
      ellipsis: true,
    },
    {
      title: "购买方",
      dataIndex: "buyer_name",
      key: "buyer_name",
      ellipsis: true,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 80,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: "orange", text: "待处理" },
          matched: { color: "green", text: "已匹配" },
          void: { color: "red", text: "已作废" },
        };
        const { color, text } = statusMap[status] || { color: "default", text: status };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      {/* OCR 服务离线提示 */}
      {ocrServiceError && (
        <Alert
          type="warning"
          showIcon
          closable
          message="本地 OCR 服务未启动"
          description={
            <span>
              识别功能不可用。请在项目目录下运行 <code>node ocr-server.js</code>
              （或双击 <code>启动OCR服务.bat</code>），然后刷新本页。
            </span>
          }
          onClose={() => setOcrServiceError(null)}
        />
      )}

      {/* 筛选栏 */}
      <Card className={styles.filterCard}>
        <Space wrap>
          <Input
            placeholder="搜索发票号码/销售方/购买方"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
          />
          <Select placeholder="发票状态" style={{ width: 120 }} allowClear>
            <Option value="pending">待处理</Option>
            <Option value="matched">已匹配</Option>
            <Option value="void">已作废</Option>
          </Select>

          {/* 选图识别：识别结果直接回填到「新增发票」弹窗 */}
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={(file) => {
              setModalVisible(true);
              setEditingInvoice(null);
              form.resetFields();
              setOcrRawText("");
              handleOcrFile(file as unknown as File);
              return false; // 阻止 antd 自动上传
            }}
          >
            <Tooltip title={ocrServiceError ? "OCR 服务未启动" : "选择发票图片，自动识别并回填字段"}>
              <Button icon={ocrLoading ? <LoadingOutlined /> : <ScanOutlined />} loading={ocrLoading}>
                OCR识别
              </Button>
            </Tooltip>
          </Upload>
        </Space>
      </Card>

      {/* 发票列表 */}
      <Card
        title="发票管理"
        extra={
          <Space>
            <Button icon={<UploadOutlined />}>批量导入</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增发票
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={invoices}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingInvoice ? "编辑发票" : "新增发票"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="invoice_number"
            label="发票号码"
            rules={[{ required: true, message: "请输入发票号码" }]}
          >
            <Input placeholder="请输入发票号码" />
          </Form.Item>
          <Form.Item
            name="invoice_date"
            label="开票日期"
            rules={[{ required: true, message: "请选择开票日期" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="amount"
            label="金额"
            rules={[{ required: true, message: "请输入金额" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} precision={2} addonBefore="¥" />
          </Form.Item>
          <Form.Item
            name="tax_amount"
            label="税额"
            rules={[{ required: true, message: "请输入税额" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} precision={2} addonBefore="¥" />
          </Form.Item>
          <Form.Item
            name="total_amount"
            label="价税合计"
            rules={[{ required: true, message: "请输入价税合计" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} precision={2} addonBefore="¥" />
          </Form.Item>
          <Form.Item
            name="seller_name"
            label="销售方"
            rules={[{ required: true, message: "请输入销售方名称" }]}
          >
            <Input placeholder="请输入销售方名称" />
          </Form.Item>
          <Form.Item
            name="buyer_name"
            label="购买方"
            rules={[{ required: true, message: "请输入购买方名称" }]}
          >
            <Input placeholder="请输入购买方名称" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Option value="pending">待处理</Option>
              <Option value="matched">已匹配</Option>
              <Option value="void">已作废</Option>
            </Select>
          </Form.Item>

          {/* OCR 原始识别文本：供人工核对，随表单一起保存 */}
          <Form.Item name="ocr_result" label="OCR 识别原文">
            <Input.TextArea
              rows={4}
              placeholder="尚无识别结果。点击上方「OCR识别」选择发票图片即可自动填充"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 识别结果预览：核对无误后再保存 */}
      {ocrRawText && (
        <Modal
          title={`OCR 识别结果${ocrElapsed !== null ? `（耗时 ${ocrElapsed}ms）` : ""}`}
          open={!!ocrRawText}
          onCancel={() => setOcrRawText("")}
          footer={[
            <Button key="close" type="primary" onClick={() => setOcrRawText("")}>
              知道了
            </Button>,
          ]}
          width={640}
        >
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            message="请与发票原图核对后再保存"
            description="OCR 为启发式识别，金额、号码等关键字段请务必人工确认。"
          />
          <pre className={styles.ocrText}>{ocrRawText}</pre>
        </Modal>
      )}
    </div>
  );
};

export default InvoicePage;