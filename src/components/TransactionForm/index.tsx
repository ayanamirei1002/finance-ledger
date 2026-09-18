import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
} from "antd";
import { invoke } from "@tauri-apps/api/tauri";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

interface Category {
  id: string;
  name: string;
  book_type: string;
}

interface TransactionFormProps {
  initialValues?: any;
  onValuesChange?: (values: any) => void;
  disabled?: boolean;
}

const TransactionForm = ({
  initialValues,
  onValuesChange,
  disabled = false,
}: TransactionFormProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        transaction_date: initialValues.transaction_date
          ? dayjs(initialValues.transaction_date)
          : undefined,
      });
    }
  }, [initialValues, form]);

  const loadCategories = async () => {
    try {
      const data = await invoke<Category[]>("get_categories");
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const handleValuesChange = (_changedValues: any, allValues: any) => {
    if (onValuesChange) {
      onValuesChange(allValues);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleValuesChange}
      disabled={disabled}
    >
      <Form.Item
        name="transaction_type"
        label="交易类型"
        rules={[{ required: true, message: "请选择交易类型" }]}
      >
        <Select>
          <Option value="income">收入</Option>
          <Option value="expense">支出</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="category_id"
        label="分类"
        rules={[{ required: true, message: "请选择分类" }]}
      >
        <Select showSearch placeholder="请选择分类">
          {categories.map((category) => (
            <Option key={category.id} value={category.id}>
              {category.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="description"
        label="描述"
        rules={[{ required: true, message: "请输入描述" }]}
      >
        <Input placeholder="请输入交易描述" />
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
        name="transaction_date"
        label="交易日期"
        rules={[{ required: true, message: "请选择交易日期" }]}
      >
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item name="counterparty" label="对方">
        <Input placeholder="请输入对方名称" />
      </Form.Item>

      <Form.Item name="tags" label="标签">
        <Select
          mode="tags"
          placeholder="输入标签后按回车"
          tokenSeparators={[","]}
        >
          <Option value="日常">日常</Option>
          <Option value="工作">工作</Option>
          <Option value="娱乐">娱乐</Option>
          <Option value="学习">学习</Option>
        </Select>
      </Form.Item>

      <Form.Item name="notes" label="备注">
        <TextArea rows={3} placeholder="请输入备注" />
      </Form.Item>
    </Form>
  );
};

export default TransactionForm;