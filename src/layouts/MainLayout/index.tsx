import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, theme } from "antd";
import {
  DashboardOutlined,
  AccountBookOutlined,
  FileTextOutlined,
  SwapOutlined,
  BarChartOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import styles from "./index.module.scss";

const { Header, Sider, Content } = Layout;

const menuItems: MenuProps["items"] = [
  {
    key: "/",
    icon: <DashboardOutlined />,
    label: "工作台",
  },
  {
    key: "/ledger",
    icon: <AccountBookOutlined />,
    label: "台账管理",
  },
  {
    key: "/invoice",
    icon: <FileTextOutlined />,
    label: "票据管理",
  },
  {
    key: "/reconciliation",
    icon: <SwapOutlined />,
    label: "财务对账",
  },
  {
    key: "/report",
    icon: <BarChartOutlined />,
    label: "报表中心",
  },
  {
    key: "/settings",
    icon: <SettingOutlined />,
    label: "系统设置",
  },
];

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const onMenuClick: MenuProps["onClick"] = ({ key }) => {
    navigate(key);
  };

  return (
    <Layout className={styles.layout}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        collapsedWidth={64}
        width={220}
        breakpoint="lg"
        className={styles.sider}
      >
        <div className={styles.logo}>{collapsed ? "财" : "财务台账"}</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={onMenuClick}
        />
      </Sider>

      <Layout className={styles.main}>
        <Header
          className={styles.header}
          style={{ background: colorBgContainer }}
        >
          <h2 className={styles.pageTitle}>财务台账管理系统</h2>
          <div className={styles.userInfo}>
            <span>管理员</span>
          </div>
        </Header>

        <Content className={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
