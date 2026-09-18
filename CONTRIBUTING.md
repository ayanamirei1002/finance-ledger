# 贡献指南

感谢您对财务台账管理系统项目的关注！我们欢迎任何形式的贡献。

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境](#开发环境)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [问题反馈](#问题反馈)

## 行为准则

本项目采用 [贡献者公约](https://www.contributor-covenant.org/zh-cn/version/2/0/code_of_conduct/)，请在参与贡献前阅读并遵守。

## 如何贡献

### 报告问题

1. 使用 [GitHub Issues](https://github.com/your-username/finance-ledger/issues) 报告问题
2. 使用问题模板，提供详细信息
3. 包含复现步骤、期望行为、实际行为
4. 附上相关截图或日志

### 提交代码

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

### 改进文档

1. 修正错别字
2. 补充说明
3. 添加示例
4. 翻译文档

## 开发环境

### 环境要求

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Rust** >= 1.70.0
- **Cargo** (随 Rust 安装)

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/your-username/finance-ledger.git
cd finance-ledger

# 2. 安装前端依赖
pnpm install

# 3. 安装 Rust 依赖
cd src-tauri
cargo build
cd ..

# 4. 启动开发服务器
pnpm tauri dev
```

### 开发工具

- **IDE 推荐**：VS Code + Rust Analyzer + ESLint
- **调试工具**：React DevTools + Tauri DevTools
- **版本控制**：Git + GitHub

## 代码规范

### TypeScript/React 规范

1. **命名规范**
   - 组件：PascalCase (`TransactionForm`)
   - 文件：camelCase (`transactionForm.ts`)
   - 常量：UPPER_SNAKE_CASE (`MAX_AMOUNT`)
   - 变量/函数：camelCase (`handleSubmit`)

2. **代码风格**
   - 使用 ESLint 配置
   - 2 空格缩进
   - 单引号字符串
   - 无分号

3. **组件规范**
   - 使用函数组件 + Hooks
   - Props 接口定义
   - 默认导出组件

4. **样式规范**
   - 使用 CSS Modules
   - BEM 命名规范
   - 响应式设计

### Rust 规范

1. **命名规范**
   - 模块/函数/变量：snake_case
   - 类型/特征：PascalCase
   - 常量：UPPER_SNAKE_CASE

2. **代码风格**
   - 使用 `cargo fmt` 格式化
   - 使用 `cargo clippy` 检查
   - 遵循 Rust API 指南

3. **错误处理**
   - 使用 `Result` 类型
   - 避免 `unwrap()`
   - 提供有意义的错误信息

4. **文档规范**
   - 公共 API 必须文档
   - 使用 `///` 注释
   - 包含示例代码

## 提交规范

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型说明

- **feat**: 新功能
- **fix**: 修复问题
- **docs**: 文档更新
- **style**: 代码格式（不影响功能）
- **refactor**: 重构
- **perf**: 性能优化
- **test**: 测试相关
- **chore**: 构建/工具相关
- **ci**: CI 配置

### 示例

```
feat(transaction): 添加交易记录批量导入功能

- 支持 CSV 格式导入
- 支持 Excel 格式导入
- 添加数据验证
- 显示导入进度

Closes #123
```

## Pull Request 流程

### 1. 准备工作

```bash
# 1. 同步主分支
git checkout main
git pull origin main

# 2. 创建功能分支
git checkout -b feature/your-feature

# 3. 进行开发
# ...

# 4. 运行测试
pnpm test
cd src-tauri && cargo test

# 5. 运行代码检查
pnpm lint
cd src-tauri && cargo clippy
```

### 2. 提交更改

```bash
# 1. 添加更改
git add .

# 2. 提交更改
git commit -m "feat: 添加新功能"

# 3. 推送到远程
git push origin feature/your-feature
```

### 3. 创建 Pull Request

1. 访问 GitHub 仓库
2. 点击 "New Pull Request"
3. 选择目标分支（通常是 `main`）
4. 填写 PR 标题和描述
5. 关联相关 Issue
6. 请求代码审查

### 4. 代码审查

1. 响应审查意见
2. 修改代码
3. 重新提交
4. 获得批准后合并

### 5. 合并后清理

```bash
# 1. 切换到主分支
git checkout main

# 2. 拉取最新代码
git pull origin main

# 3. 删除功能分支
git branch -d feature/your-feature
git push origin --delete feature/your-feature
```

## 问题反馈

### 报告问题

使用 [GitHub Issues](https://github.com/your-username/finance-ledger/issues) 报告问题。

### 问题模板

```markdown
## 问题描述

简要描述问题。

## 复现步骤

1. 进入 '...'
2. 点击 '...'
3. 滚动到 '...'
4. 看到错误

## 期望行为

描述期望的行为。

## 实际行为

描述实际的行为。

## 截图

如果适用，添加截图。

## 环境信息

- 操作系统: [例如 Windows 11]
- 应用版本: [例如 0.1.0]
- Node.js 版本: [例如 18.0.0]
- Rust 版本: [例如 1.70.0]

## 其他信息

添加任何其他相关信息。
```

## 联系方式

- **邮箱**：[your-email@example.com](mailto:your-email@example.com)
- **GitHub**：[your-username](https://github.com/your-username)
- **微信群**：添加微信 `your-wechat` 加入开发者群

## 致谢

感谢所有贡献者的付出！

---

**欢迎加入我们，一起打造更好的财务台账管理系统！** 🎉