# 财务台账管理系统

面向小型企业/工作室的桌面级财务台账管理工具，覆盖日常收支记录、票据管理、报表分析的全流程。

## ✨ 功能特性

### 📊 核心功能
- **台账管理**：收支录入、分类账本、科目管理、多账簿支持
- **票据管理**：发票识别(OCR)、凭证生成、票据归档、智能匹配
- **报表中心**：收支趋势图、分类饼图、现金流瀑布图、自定义看板
- **数据可视化**：实时统计、月度报表、年度分析

### 🔧 自动化功能
- **定期记账模板**：自动生成重复交易记录
- **智能分类**：基于历史数据自动分类交易
- **智能提醒**：到期提醒、应收提醒、预算预警
- **银行流水导入**：支持CSV/Excel格式导入

### 🔒 安全与合规
- **数据加密**：AES加密敏感字段
- **审计日志**：记录所有操作历史
- **权限管理**：多级用户权限控制
- **本地+云端备份**：数据安全有保障

## 🛠️ 技术栈

### 前端
- **框架**：React 18 + TypeScript
- **UI组件库**：Ant Design 5
- **图表库**：@ant-design/charts
- **状态管理**：Zustand
- **路由**：React Router 6
- **构建工具**：Vite 5

### 后端
- **桌面框架**：Tauri 1.5
- **语言**：Rust
- **数据库**：SQLite (rusqlite)
- **序列化**：serde + serde_json

### 开发工具
- **包管理器**：pnpm
- **代码检查**：ESLint + Rust Clippy
- **测试框架**：Vitest + cargo test

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Rust** >= 1.70.0（必须安装，Tauri 依赖）
- **Cargo** (随 Rust 安装)
- **Visual Studio Build Tools** (Windows，C++ 桌面开发)

### 安装 Rust（必须）

#### Windows 系统

1. **下载 Rust 安装程序**
   - 访问：https://rustup.rs/
   - 下载并运行 `rustup-init.exe`

2. **运行安装程序**
   ```bash
   rustup-init.exe
   ```

3. **选择安装选项**
   - 选择 `1) Proceed with standard installation`
   - 按回车确认

4. **验证安装**
   ```bash
   rustc --version
   cargo --version
   ```

#### macOS/Linux 系统

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 安装依赖

```bash
# 安装前端依赖
pnpm install

# 安装 Rust 依赖（自动）
cd src-tauri
cargo build
```

### 开发模式

```bash
# Windows
scripts\dev.bat

# Linux/macOS
./scripts/dev.sh

# 或者直接运行
pnpm tauri dev
```

> **注意**：如果遇到 `'pnpm tauri dev' 不是内部或外部命令` 错误，请确保已正确安装 Rust。详见 [安装指南](INSTALL.md)。

### 构建生产版本

```bash
# Windows
scripts\build.bat

# Linux/macOS
./scripts/build.sh

# 或者直接运行
pnpm tauri build
```

### 运行测试

```bash
# Windows
scripts\test.bat

# Linux/macOS
./scripts/test.sh

# 或者分别运行
pnpm test              # 前端测试
cd src-tauri && cargo test  # 后端测试
```

### 代码检查

```bash
# Windows
scripts\lint.bat

# Linux/macOS
./scripts\lint.sh

# 或者分别运行
pnpm lint              # ESLint
cd src-tauri && cargo clippy  # Rust 检查
```

## 📁 项目结构

```
finance-ledger/
├── src-tauri/              # Tauri 后端 (Rust)
│   ├── src/
│   │   ├── db/             # 数据库操作层
│   │   │   ├── models.rs   # 数据模型
│   │   │   ├── schema.rs   # 数据库 Schema
│   │   │   ├── connection.rs # 数据库连接
│   │   │   └── migrations.rs # 数据库迁移
│   │   ├── commands/       # Tauri 命令
│   │   │   ├── account_book.rs  # 账簿命令
│   │   │   ├── transaction.rs   # 交易命令
│   │   │   ├── category.rs      # 分类命令
│   │   │   ├── invoice.rs       # 发票命令
│   │   │   └── stats.rs         # 统计命令
│   │   └── main.rs         # 主入口
│   ├── Cargo.toml          # Rust 依赖配置
│   └── tauri.conf.json     # Tauri 配置
├── src/                    # React 前端
│   ├── components/         # 通用组件
│   │   ├── TransactionForm/ # 交易表单
│   │   ├── InvoiceForm/     # 发票表单
│   │   ├── StatsCard/       # 统计卡片
│   │   └── SearchBar/       # 搜索栏
│   ├── layouts/            # 布局组件
│   │   └── MainLayout/     # 主布局
│   ├── pages/              # 页面组件
│   │   ├── Dashboard/      # 工作台
│   │   ├── Ledger/         # 台账管理
│   │   ├── Invoice/        # 票据管理
│   │   ├── Report/         # 报表中心
│   │   └── Settings/       # 系统设置
│   ├── store/              # 状态管理
│   │   └── index.ts        # Zustand Store
│   ├── utils/              # 工具函数
│   │   ├── format.ts       # 格式化工具
│   │   ├── storage.ts      # 存储工具
│   │   └── validation.ts   # 验证工具
│   ├── styles/             # 样式文件
│   │   └── global.scss     # 全局样式
│   ├── App.tsx             # 应用入口
│   └── main.tsx            # 主入口
├── scripts/                # 脚本文件
│   ├── dev.sh/bat          # 开发脚本
│   ├── build.sh/bat        # 构建脚本
│   ├── test.sh/bat         # 测试脚本
│   ├── lint.sh/bat         # 检查脚本
│   └── clean.sh/bat        # 清理脚本
├── package.json            # 前端依赖配置
├── vite.config.ts          # Vite 配置
├── tsconfig.json           # TypeScript 配置
└── README.md               # 项目文档
```

## 📊 数据库设计

### 主要数据表

1. **account_books** - 账簿表
   - id, name, description, book_type, currency, is_default, created_at, updated_at

2. **categories** - 科目分类表
   - id, name, parent_id, book_type, icon, sort_order, created_at

3. **transactions** - 交易记录表
   - id, book_id, category_id, amount, description, transaction_date, transaction_type, counterparty, invoice_id, tags, notes, created_at, updated_at

4. **invoices** - 发票表
   - id, invoice_number, invoice_date, amount, tax_amount, total_amount, seller_name, buyer_name, invoice_type, status, image_path, ocr_result, created_at, updated_at

5. **budgets** - 预算表
   - id, category_id, amount, period_type, start_date, end_date, created_at, updated_at

6. **audit_logs** - 审计日志表
   - id, user_id, action, table_name, record_id, old_value, new_value, ip_address, created_at

## 🎨 界面预览

### 工作台
- 收支统计卡片
- 最近交易记录
- 快速操作入口

### 台账管理
- 交易记录列表
- 高级筛选功能
- 新增/编辑交易

### 票据管理
- 发票列表
- OCR识别
- 状态管理

### 报表中心
- 月度趋势图
- 分类占比图
- 分类排行图

### 系统设置
- 基本设置
- 安全设置
- 数据管理
- 通知设置

## 🔧 配置说明

### Tauri 配置 (src-tauri/tauri.conf.json)

```json
{
  "build": {
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build",
    "devUrl": "http://localhost:1420",
    "frontendDist": "../dist"
  },
  "package": {
    "productName": "财务台账管理系统",
    "version": "0.1.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": { "all": false, "open": true },
      "dialog": { "all": true },
      "fs": { "all": false, "readFile": true, "writeFile": true, "exists": true }
    },
    "windows": [
      {
        "fullscreen": false,
        "resizable": true,
        "title": "财务台账管理系统",
        "width": 1280,
        "height": 800,
        "minWidth": 1024,
        "minHeight": 768
      }
    ]
  }
}
```

### Vite 配置 (vite.config.ts)

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
```

## 📝 开发指南

### 添加新页面

1. 在 `src/pages/` 目录下创建新页面文件夹
2. 创建 `index.tsx` 和 `index.module.scss`
3. 在 `src/App.tsx` 中添加路由
4. 在 `src/layouts/MainLayout/index.tsx` 中添加菜单项

### 添加新命令

1. 在 `src-tauri/src/commands/` 目录下创建新的命令文件
2. 在 `src-tauri/src/commands/mod.rs` 中导出新模块
3. 在 `src-tauri/src/main.rs` 中注册新命令
4. 在前端使用 `invoke` 调用新命令

### 添加新组件

1. 在 `src/components/` 目录下创建新组件文件夹
2. 创建 `index.tsx` 和 `index.module.scss`
3. 在需要的地方导入使用

## 🐛 常见问题

### 1. Tauri 构建失败

**问题**：`error: linking with 'link.exe' failed`

**解决**：
- 确保安装了 Visual Studio Build Tools
- 安装 C++ 桌面开发工作负载

### 2. SQLite 数据库错误

**问题**：`unable to open database file`

**解决**：
- 检查应用数据目录权限
- 确保磁盘空间充足

### 3. 前端热更新不工作

**问题**：修改代码后页面不刷新

**解决**：
- 确保 Vite 开发服务器正在运行
- 检查 `tauri.conf.json` 中的 `devUrl` 配置

## 📄 许可证

MIT License

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📞 联系方式

如有问题或建议，请提交 Issue 或联系开发团队。

---

**感谢使用财务台账管理系统！** 🎉