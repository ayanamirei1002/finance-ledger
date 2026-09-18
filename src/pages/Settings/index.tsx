import { useState } from "react";
import {
  Card,
  Form,
  Input,
  Switch,
  Select,
  Button,
  Divider,
  Space,
  Tabs,
  message,
} from "antd";
import {
  UserOutlined,
  DatabaseOutlined,
  ExportOutlined,
  ImportOutlined,
} from "@ant-design/icons";
import styles from "./index.module.scss";

const { Option } = Select;
const { TabPane } = Tabs;

const Settings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      // TODO: 保存设置
      console.log("Saving settings:", values);
      message.success("设置已保存");
    } catch (error) {
      console.error("Validation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // TODO: 导出数据
    message.info("导出功能开发中...");
  };

  const handleImport = () => {
    // TODO: 导入数据
    message.info("导入功能开发中...");
  };

  return (
    <div className={styles.container}>
      <Card title="系统设置">
        <Tabs defaultActiveKey="general">
          <TabPane tab="基本设置" key="general">
            <Form form={form} layout="vertical" initialValues={{
              appName: "财务台账管理系统",
              currency: "CNY",
              language: "zh-CN",
              theme: "light",
            }}>
              <Form.Item name="appName" label="应用名称">
                <Input prefix={<UserOutlined />} />
              </Form.Item>
              <Form.Item name="currency" label="默认货币">
                <Select>
                  <Option value="CNY">人民币 (CNY)</Option>
                  <Option value="USD">美元 (USD)</Option>
                  <Option value="EUR">欧元 (EUR)</Option>
                  <Option value="JPY">日元 (JPY)</Option>
                </Select>
              </Form.Item>
              <Form.Item name="language" label="语言">
                <Select>
                  <Option value="zh-CN">简体中文</Option>
                  <Option value="en-US">English</Option>
                </Select>
              </Form.Item>
              <Form.Item name="theme" label="主题">
                <Select>
                  <Option value="light">浅色</Option>
                  <Option value="dark">深色</Option>
                  <Option value="auto">跟随系统</Option>
                </Select>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="安全设置" key="security">
            <Form layout="vertical">
              <Form.Item label="密码保护">
                <Space>
                  <Switch defaultChecked />
                  <span>启用密码保护</span>
                </Space>
              </Form.Item>
              <Form.Item label="自动锁定">
                <Space>
                  <Switch defaultChecked />
                  <span>闲置5分钟后自动锁定</span>
                </Space>
              </Form.Item>
              <Form.Item label="数据加密">
                <Space>
                  <Switch defaultChecked />
                  <span>启用本地数据加密</span>
                </Space>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="数据管理" key="data">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Card size="small">
                <Space>
                  <DatabaseOutlined />
                  <span>数据库大小: 2.5 MB</span>
                </Space>
              </Card>
              <Card size="small">
                <Space>
                  <span>交易记录: 1,234 条</span>
                </Space>
              </Card>
              <Card size="small">
                <Space>
                  <span>发票记录: 567 条</span>
                </Space>
              </Card>
              <Divider />
              <Space>
                <Button icon={<ExportOutlined />} onClick={handleExport}>
                  导出数据
                </Button>
                <Button icon={<ImportOutlined />} onClick={handleImport}>
                  导入数据
                </Button>
              </Space>
            </Space>
          </TabPane>

          <TabPane tab="通知设置" key="notification">
            <Form layout="vertical">
              <Form.Item label="预算提醒">
                <Space>
                  <Switch defaultChecked />
                  <span>预算达到80%时提醒</span>
                </Space>
              </Form.Item>
              <Form.Item label="账单提醒">
                <Space>
                  <Switch defaultChecked />
                  <span>账单到期前3天提醒</span>
                </Space>
              </Form.Item>
              <Form.Item label="系统通知">
                <Space>
                  <Switch defaultChecked />
                  <span>显示系统通知</span>
                </Space>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>

        <Divider />
        <Space>
          <Button type="primary" loading={loading} onClick={handleSave}>
            保存设置
          </Button>
          <Button>重置</Button>
        </Space>
      </Card>
    </div>
  );
};

export default Settings;