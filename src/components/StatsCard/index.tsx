import { Card, Statistic, Space } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import styles from "./index.module.scss";

interface StatsCardProps {
  title: string;
  value: number;
  precision?: number;
  prefix?: string;
  suffix?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: number;
  loading?: boolean;
  icon?: React.ReactNode;
  color?: string;
}

const StatsCard = ({
  title,
  value,
  precision = 2,
  prefix = "¥",
  suffix,
  trend,
  trendValue,
  loading = false,
  icon,
  color,
}: StatsCardProps) => {
  const getTrendIcon = () => {
    if (!trend || trend === "neutral") return null;
    return trend === "up" ? (
      <ArrowUpOutlined className={styles.trendUp} />
    ) : (
      <ArrowDownOutlined className={styles.trendDown} />
    );
  };

  const getTrendText = () => {
    if (!trendValue) return null;
    const prefix = trend === "up" ? "+" : "";
    return (
      <span className={trend === "up" ? styles.trendUp : styles.trendDown}>
        {prefix}{trendValue}%
      </span>
    );
  };

  return (
    <Card loading={loading} className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      <Statistic
        value={value}
        precision={precision}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ color: color || (trend === "up" ? "#52c41a" : trend === "down" ? "#ff4d4f" : undefined) }}
      />
      {(trend || trendValue) && (
        <div className={styles.footer}>
          <Space>
            {getTrendIcon()}
            {getTrendText()}
          </Space>
        </div>
      )}
    </Card>
  );
};

export default StatsCard;