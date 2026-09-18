import { useState, useEffect, useCallback } from "react";
import { Card, Row, Col, Select, DatePicker, Button, Space } from "antd";
import { Line, Pie, Bar } from "@ant-design/charts";
import dayjs from "dayjs";
import { api } from "../../api";
import styles from "./index.module.scss";

const { Option } = Select;

interface MonthlyStats {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

interface CategoryStats {
  category_id: string;
  category_name: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
}

const Report = () => {
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [transactionType, setTransactionType] = useState<string>("expense");
  const [loading, setLoading] = useState(false);

  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      const [monthlyData, categoryData] = await Promise.all([
        api.getMonthlyStats(year),
        api.getCategoryStats(transactionType),
      ]);
      setMonthlyStats(monthlyData);
      setCategoryStats(categoryData);
    } catch (error) {
      console.error("Failed to load report data:", error);
    } finally {
      setLoading(false);
    }
  }, [year, transactionType]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // 月度趋势图配置（收入 / 支出 / 结余 三条序列）
  const monthlyChartConfig: any = {
    data: monthlyStats.flatMap((item) => [
      { month: item.month, type: "收入", value: item.income },
      { month: item.month, type: "支出", value: item.expense },
      { month: item.month, type: "结余", value: item.balance },
    ]),
    xField: "month",
    yField: "value",
    colorField: "type",
    smooth: true,
    autoFit: true,
    axis: {
      y: { title: "金额 (元)" },
    },
    legend: { color: { position: "top" } },
  };

  // 分类占比饼图配置
  const categoryPieConfig: any = {
    data: categoryStats.map((item) => ({
      type: item.category_name,
      value: item.total_amount,
    })),
    angleField: "value",
    colorField: "type",
    radius: 0.8,
    autoFit: true,
    label: { text: "type", position: "outside" },
    legend: { color: { position: "right" } },
  };

  // 分类排行条形图配置
  const categoryBarConfig: any = {
    data: categoryStats.map((item) => ({
      category: item.category_name,
      amount: item.total_amount,
      count: item.transaction_count,
    })),
    xField: "amount",
    yField: "category",
    colorField: "category",
    autoFit: true,
    legend: false,
    axis: {
      x: { title: "金额 (元)" },
      y: { title: "分类" },
    },
  };

  return (
    <div className={styles.container}>
      {/* 筛选栏 */}
      <Card className={styles.filterCard}>
        <Space>
          <DatePicker
            picker="year"
            value={dayjs().year(year)}
            onChange={(date) => date && setYear(date.year())}
            placeholder="选择年份"
            allowClear={false}
          />
          <Select
            value={transactionType}
            onChange={setTransactionType}
            style={{ width: 120 }}
          >
            <Option value="income">收入</Option>
            <Option value="expense">支出</Option>
          </Select>
          <Button type="primary" onClick={loadReportData}>
            刷新数据
          </Button>
        </Space>
      </Card>

      {/* 图表区域 */}
      <Row gutter={[16, 16]}>
        {/* 月度趋势 */}
        <Col xs={24} lg={16}>
          <Card title="月度收支趋势" loading={loading}>
            <div className={styles.chart}>
              <Line {...monthlyChartConfig} />
            </div>
          </Card>
        </Col>

        {/* 分类占比 */}
        <Col xs={24} lg={8}>
          <Card title="分类占比" loading={loading}>
            <div className={styles.chart}>
              <Pie {...categoryPieConfig} />
            </div>
          </Card>
        </Col>

        {/* 分类排行 */}
        <Col xs={24}>
          <Card title="分类排行" loading={loading}>
            <div className={styles.chart}>
              <Bar {...categoryBarConfig} />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Report;
