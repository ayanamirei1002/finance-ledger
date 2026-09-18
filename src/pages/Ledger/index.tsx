import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  InputNumber,
  message,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { api } from "../../api";
import type { ColumnsType } from "antd/es/table";
import styles from "./index.module.scss";

const { RangePicker } = DatePicker;
const { Option } = Select;

interface Transaction {
  id: string;
  book_id: string;
  category_id: string;
  amount: number;
  description: string;
  transaction_date: string;
  transaction_type: string;
  counterparty?: string;
  tags?: string;
  notes?: string;
}

interface Category {
  id: string;
  name: string;
  book_type: string;
}

interface TransactionFilter {
  book_id?: string;
  category_id?: string;
  transaction_type?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page: number;
  pageSize: number;
}

const Ledger = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [form] = Form.useForm();
  const [filter, setFilter] = useState<TransactionFilter>({
    page: 1,
    pageSize: 20,
  });

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, categoriesData] = await Promise.all([
        api.getTransactions(filter),
        api.getCategories(),
      ]);
      setTransactions(transactionsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Failed to load data:", error);
      message.error("加载数据失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTransaction(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Transaction) => {
    setEditingTransaction(record);
    form.setFieldsValue({
      ...record,
      transaction_date: record.transaction_date,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTransaction(id);
      message.success("删除成功");
      loadData();
    } catch (error) {
      message.error("删除失败");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingTransaction) {
        await api.updateTransaction(editingTransaction.id, values);
        message.success("更新成功");
      } else {
        await api.createTransaction(values);
        message.success("创建成功");
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const columns: ColumnsType<Transaction> = [
    {
      title: "日期",
      dataIndex: "transaction_date",
      key: "transaction_date",
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "金额",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (amount: number, record: Transaction) => (
        <span style={{ color: record.transaction_type === "income" ? "#52c41a" : "#ff4d4f" }}>
          {record.transaction_type === "income" ? "+" : "-"}¥{amount.toFixed(2)}
        </span>
      ),
    },
    {
      title: "类型",
      dataIndex: "transaction_type",
      key: "transaction_type",
      width: 80,
      render: (type: string) => (
        <Tag color={type === "income" ? "green" : "red"}>
          {type === "income" ? "收入" : "支出"}
        </Tag>
      ),
    },
    {
      title: "对方",
      dataIndex: "counterparty",
      key: "counterparty",
      width: 120,
      ellipsis: true,
    },
    {
      title: "标签",
      dataIndex: "tags",
      key: "tags",
      width: 120,
      render: (tags: string) =>
        tags ? tags.split(",").map((tag) => <Tag key={tag}>{tag}</Tag>) : null,
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
      {/* 筛选栏 */}
      <Card className={styles.filterCard}>
        <Space wrap>
          <Input
            placeholder="搜索描述/对方/备注"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            onChange={(e) => setFilter({ ...filter, search: e.target.value, page: 1 })}
          />
          <Select
            placeholder="交易类型"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilter({ ...filter, transaction_type: value, page: 1 })}
          >
            <Option value="income">收入</Option>
            <Option value="expense">支出</Option>
          </Select>
          <Select
            placeholder="分类"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilter({ ...filter, category_id: value, page: 1 })}
          >
            {categories.map((cat) => (
              <Option key={cat.id} value={cat.id}>
                {cat.name}
              </Option>
            ))}
          </Select>
          <RangePicker
            onChange={(dates) => {
              if (dates) {
                setFilter({
                  ...filter,
                  start_date: dates[0]?.format("YYYY-MM-DD"),
                  end_date: dates[1]?.format("YYYY-MM-DD"),
                  page: 1,
                });
              } else {
                setFilter({ ...filter, start_date: undefined, end_date: undefined, page: 1 });
              }
            }}
          />
        </Space>
      </Card>

      {/* 交易列表 */}
      <Card
        title="交易记录"
        extra={
          <Space>
            <Button icon={<ExportOutlined />}>导出</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增记录
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{
            current: filter.page,
            pageSize: filter.pageSize,
            onChange: (page, pageSize) => setFilter({ ...filter, page, pageSize }),
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingTransaction ? "编辑交易记录" : "新增交易记录"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
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
            <Input placeholder="多个标签用逗号分隔" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Ledger;