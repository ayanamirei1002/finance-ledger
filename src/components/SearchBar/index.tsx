import { useState } from "react";
import { Input, Select, DatePicker, Space, Button } from "antd";
import { SearchOutlined, ClearOutlined } from "@ant-design/icons";
import styles from "./index.module.scss";

const { Option } = Select;
const { RangePicker } = DatePicker;

interface SearchBarProps {
  onSearch: (filters: any) => void;
  onReset?: () => void;
  showDateRange?: boolean;
  showTypeFilter?: boolean;
  showCategoryFilter?: boolean;
  categories?: Array<{ id: string; name: string }>;
  loading?: boolean;
}

const SearchBar = ({
  onSearch,
  onReset,
  showDateRange = true,
  showTypeFilter = true,
  showCategoryFilter = true,
  categories = [],
  loading = false,
}: SearchBarProps) => {
  const [filters, setFilters] = useState({
    search: "",
    type: undefined as string | undefined,
    category: undefined as string | undefined,
    dateRange: undefined as [any, any] | undefined,
  });

  const handleSearch = () => {
    onSearch({
      search: filters.search || undefined,
      type: filters.type,
      category: filters.category,
      startDate: filters.dateRange?.[0]?.format("YYYY-MM-DD"),
      endDate: filters.dateRange?.[1]?.format("YYYY-MM-DD"),
    });
  };

  const handleReset = () => {
    setFilters({
      search: "",
      type: undefined,
      category: undefined,
      dateRange: undefined,
    });
    if (onReset) {
      onReset();
    }
  };

  return (
    <div className={styles.container}>
      <Space wrap>
        <Input
          placeholder="搜索..."
          prefix={<SearchOutlined />}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          onPressEnter={handleSearch}
          style={{ width: 200 }}
        />

        {showTypeFilter && (
          <Select
            placeholder="交易类型"
            value={filters.type}
            onChange={(value) => setFilters({ ...filters, type: value })}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="income">收入</Option>
            <Option value="expense">支出</Option>
          </Select>
        )}

        {showCategoryFilter && categories.length > 0 && (
          <Select
            placeholder="分类"
            value={filters.category}
            onChange={(value) => setFilters({ ...filters, category: value })}
            style={{ width: 120 }}
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {categories.map((cat) => (
              <Option key={cat.id} value={cat.id}>
                {cat.name}
              </Option>
            ))}
          </Select>
        )}

        {showDateRange && (
          <RangePicker
            value={filters.dateRange}
            onChange={(dates) => setFilters({ ...filters, dateRange: dates as [any, any] })}
          />
        )}

        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleSearch}
          loading={loading}
        >
          搜索
        </Button>

        <Button icon={<ClearOutlined />} onClick={handleReset}>
          重置
        </Button>
      </Space>
    </div>
  );
};

export default SearchBar;