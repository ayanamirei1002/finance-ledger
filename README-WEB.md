# 财务台账管理系统 - Web 版本

这是一个纯 Web 版本的财务台账管理系统，**不需要安装 Rust**，可以直接在浏览器中运行。

## ✨ 特点

- ✅ **无需 Rust**：纯前端实现
- ✅ **快速启动**：一键运行
- ✅ **跨平台**：支持所有现代浏览器
- ✅ **易于开发**：热更新，开发体验好

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0

### 安装步骤

```bash
# 1. 进入项目目录
cd 财务软件开发

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器
pnpm dev

# 4. 打开浏览器
# 访问 http://localhost:5173
```

### 构建生产版本

```bash
# 构建
pnpm build

# 预览构建结果
pnpm preview
```

## 📁 项目结构

```
finance-ledger/
├── src/                    # 源代码
│   ├── components/         # 组件
│   ├── pages/              # 页面
│   ├── store/              # 状态管理
│   ├── utils/              # 工具函数
│   └── styles/             # 样式
├── public/                 # 静态资源
├── package.json            # 依赖配置
├── vite.config.ts          # Vite 配置
└── tsconfig.json           # TypeScript 配置
```

## 🎨 功能模块

### 1. 工作台 (Dashboard)
- 收支统计卡片
- 最近交易记录
- 快速操作入口

### 2. 台账管理 (Ledger)
- 交易记录列表
- 高级筛选功能
- 新增/编辑交易

### 3. 票据管理 (Invoice)
- 发票列表
- OCR识别（模拟）
- 状态管理

### 4. 报表中心 (Report)
- 月度趋势图
- 分类占比图
- 分类排行图

### 5. 系统设置 (Settings)
- 基本设置
- 安全设置
- 数据管理
- 通知设置

## 🛠️ 技术栈

- **前端框架**：React 18 + TypeScript
- **UI 组件库**：Ant Design 5
- **图表库**：@ant-design/charts
- **状态管理**：Zustand
- **路由**：React Router 6
- **构建工具**：Vite 5

## 📊 数据存储

Web 版本使用浏览器的 **localStorage** 进行数据存储：

- 数据保存在浏览器本地
- 清除浏览器数据会丢失数据
- 适合演示和开发

### 数据导出

支持导出为 JSON 格式，可以备份和恢复数据。

## 🔧 开发指南

### 添加新页面

1. 在 `src/pages/` 目录下创建新页面文件夹
2. 创建 `index.tsx` 和 `index.module.scss`
3. 在 `src/App.tsx` 中添加路由
4. 在 `src/layouts/MainLayout/index.tsx` 中添加菜单项

### 添加新组件

1. 在 `src/components/` 目录下创建新组件文件夹
2. 创建 `index.tsx` 和 `index.module.scss`
3. 在需要的地方导入使用

### 修改样式

- 全局样式：`src/styles/global.scss`
- 组件样式：使用 CSS Modules
- 主题配置：修改 Ant Design 主题

## 📱 响应式设计

应用支持多种屏幕尺寸：

- **桌面端**：>= 1024px
- **平板端**：768px - 1023px
- **移动端**：< 768px

## 🐛 常见问题

### 1. 端口被占用

**问题**：`Port 5173 is already in use`

**解决**：
```bash
# 使用其他端口
pnpm dev --port 3000
```

### 2. 依赖安装失败

**问题**：`ERR! code ERESOLVE`

**解决**：
```bash
# 清除缓存
pnpm store prune

# 重新安装
pnpm install
```

### 3. 页面空白

**问题**：打开页面后显示空白

**解决**：
- 检查浏览器控制台是否有错误
- 确保 Node.js 版本 >= 18.0.0
- 尝试清除浏览器缓存

## 🚀 部署

### 静态部署

```bash
# 构建
pnpm build

# 部署 dist 目录到任何静态服务器
# 例如：Nginx、Apache、Vercel、Netlify
```

### Docker 部署

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**开始使用 Web 版本，无需安装 Rust！** 🎉