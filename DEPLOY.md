# 部署指南

## 方式一：部署到 Vercel（推荐，2 分钟）

### 前提

- GitHub 账号
- 项目已推送到 GitHub 仓库

### 步骤

1. **登录 [vercel.com](https://vercel.com)**，用 GitHub 账号授权

2. **导入仓库**
   - 点「Add New → Project」
   - 选择你的 `finance-ledger` 仓库
   - 点「Import」

3. **配置构建参数**（Vercel 通常会自动识别 Vite 项目，确认以下设置）
   - Framework Preset: **Vite**
   - Build Command: `pnpm build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

4. **部署**
   - 点「Deploy」
   - 等待约 2 分钟
   - 完成后获得 `https://your-project.vercel.app` 链接

5. **自定义域名**（可选）
   - 在项目 Settings → Domains 添加你的域名
   - 按提示配置 DNS

### 配置文件

项目已包含 `vercel.json`，配置了：

- SPA 路由回退（`/ledger`、`/reconciliation` 等前端路由正常工作）
- Vite 框架自动识别

### 注意事项

- **OCR 功能**：依赖 Windows 本地引擎，线上不可用。首页会显示提示。
- **对账功能**：完全可用（纯前端计算，xlsx 在浏览器内运行）
- **报表功能**：完全可用（mock 数据，展示图表交互）
- **免费额度**：Vercel 的 Hobby 计划完全免费，足够个人项目使用

---

## 方式二：部署到 Netlify

1. 登录 [netlify.com](https://netlify.com)
2. 「Add new site → Import an existing project」
3. 选择 GitHub 仓库
4. Build command: `pnpm build`
5. Publish directory: `dist`
6. Deploy

---

## 方式三：GitHub Pages

```bash
# 安装 gh-pages
pnpm add -D gh-pages

# 在 package.json 的 scripts 中添加：
"deploy": "pnpm build && gh-pages -d dist"

# 运行
pnpm deploy
```

注意：GitHub Pages 不支持 SPA 路由回退，需要额外配置 404.html。

---

## 方式四：打包成桌面 exe（需要 Rust）

```bash
# 1. 安装 Rust（见 INSTALL.md）

# 2. 构建
pnpm tauri build

# 3. 产物位置
# src-tauri/target/release/bundle/msi/   → .msi 安装包
# src-tauri/target/release/              → .exe 可执行文件
```

桌面版包含完整功能（含 OCR、SQLite 持久化）。

---

## 发布清单

- [x] `vercel.json` — SPA 路由回退
- [x] `vite.config.ts` — 代码分割（antd/charts/xlsx 独立 chunk）
- [x] `.gitignore` — 排除 node_modules、dist、.env
- [ ] 推送到 GitHub
- [ ] 在 Vercel 导入并部署
- [ ] 获取在线 Demo 链接
- [ ] 写进简历
