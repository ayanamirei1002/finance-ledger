import { useEffect } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Upload,
  Button,
  Space,
} from "antd";
import { UploadOutlined, ScanOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

interface InvoiceFormProps {
  initialValues?: any;
  onValuesChange?: (values: any) => void;
  onOCR?: (file: File) => void;
  disabled?: boolean;
}

const InvoiceForm = ({
  initialValues,
  onValuesChange,
  onOCR,
  disabled = false,
}: InvoiceFormProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        invoice_date: initialValues.invoice_date
          ? dayjs(initialValues.invoice_date)
          : undefined,
      });
    }
  }, [initialValues, form]);

  const handleValuesChange = (_changedValues: any, allValues: any) => {
    if (onValuesChange) {
      onValuesChange(allValues);
    }
  };

  const handleOCR = async () => {
    // OCR 由调用方通过 onOCR 注入（见 src/utils/ocr.ts），此处只负责触发选图
    if (onOCR) {
      onOCR(new File([], "invoice.jpg"));
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleValuesChange}
      disabled={disabled}
    >
      <Form.Item label="发票图片">
        <Space>
          <Upload
            accept="image/*"
            maxCount={1}
            beforeUpload={() => false}
            onChange={(info) => {
              if (info.fileList.length > 0 && onOCR) {
                onOCR(info.fileList[0].originFileObj as File);
              }
            }}
          >
            <Button icon={<UploadOutlined />}>选择图片</Button>
          </Upload>
          <Button icon={<ScanOutlined />} onClick={handleOCR}>
            OCR识别
          </Button>
        </Space>
      </Form.Item>

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
        <InputNumber
          style={{ width: "100%" }}
          min={0}
          precision={2}
          placeholder="请输入金额"
          addonBefore="¥"
        />
      </Form.Item>

      <Form.Item
        name="tax_amount"
        label="税额"
        rules={[{ required: true, message: "请输入税额" }]}
      >
        <InputNumber
          style={{ width: "100%" }}
          min={0}
          precision={2}
          placeholder="请输入税额"
          addonBefore="¥"
        />
      </Form.Item>

      <Form.Item
        name="total_amount"
        label="价税合计"
        rules={[{ required: true, message: "请输入价税合计" }]}
      >
        <InputNumber
          style={{ width: "100%" }}
          min={0}
          precision={2}
          placeholder="请输入价税合计"
          addonBefore="¥"
        />
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

      <Form.Item name="invoice_type" label="发票类型">
        <Select>
          <Option value="增值税专用发票">增值税专用发票</Option>
          <Option value="增值税普通发票">增值税普通发票</Option>
          <Option value="电子发票">电子发票</Option>
          <Option value="其他">其他</Option>
        </Select>
      </Form.Item>

      <Form.Item name="status" label="状态">
        <Select>
          <Option value="pending">待处理</Option>
          <Option value="matched">已匹配</Option>
          <Option value="void">已作废</Option>
        </Select>
      </Form.Item>

      <Form.Item name="ocr_result" label="OCR识别结果">
        <TextArea rows={3} placeholder="OCR识别结果将显示在这里" disabled />
      </Form.Item>
    </Form>
  );
};

export default InvoiceForm;