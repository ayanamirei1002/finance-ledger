import { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Table, Tag } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  AccountBookOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { api } from "../../api";
import styles from "./index.module.scss";

interface Summary {
  total_income: number;
  total_expense: number;
  balance: number;
  transaction_count: number;
  invoice_count: number;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  transaction_type: string;
  transaction_date: string;
  category_name?: string;
}

const Dashboard = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryData, transactions] = await Promise.all([
        api.getSummary(),
        api.getTransactions({ page: 1, page_size: 10 }),
      ]);
      setSummary(summaryData);
      setRecentTransactions(transactions);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
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
      render: (type: string) => (
        <Tag color={type === "income" ? "green" : "red"}>
          {type === "income" ? "收入" : "支出"}
        </Tag>
      ),
    },
    {
      title: "日期",
      dataIndex: "transaction_date",
      key: "transaction_date",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <div className={styles.container}>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="总收入"
              value={summary?.total_income || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: "#52c41a" }}
              suffix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="总支出"
              value={summary?.total_expense || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: "#ff4d4f" }}
              suffix={<ArrowDownOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="结余"
              value={summary?.balance || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: summary?.balance && summary.balance >= 0 ? "#52c41a" : "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="交易笔数"
                  value={summary?.transaction_count || 0}
                  prefix={<AccountBookOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="发票数量"
                  value={summary?.invoice_count || 0}
                  prefix={<FileTextOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 最近交易记录 */}
      <Card
        title="最近交易记录"
        className={styles.recentTransactions}
        loading={loading}
      >
        <Table
          columns={columns}
          dataSource={recentTransactions}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default Dashboard;