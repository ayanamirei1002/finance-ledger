# 故障排查

本文记录本项目实际遇到并已解决的问题，以及正确的启动方式。

## 一、已修复的问题

### 1. `Ignored build scripts: @parcel/watcher, esbuild`

**现象**

```
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: @parcel/watcher@2.6.0, esbuild@0.19.3
Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

**原因**

pnpm 默认不运行依赖的构建脚本。项目根目录的 `pnpm-workspace.yaml` 里，`allowBuilds` 字段当时是 pnpm 生成的占位文本（`set this to true or false`），既不是 `true` 也不是 `false`。

**修复**

`pnpm-workspace.yaml`：

```yaml
allowBuilds:
  # 原生二进制由 @esbuild/win32-x64 包直接提供，无需运行 postinstall 校验
  esbuild: false
  # 需要编译原生模块，必须允许
  '@parcel/watcher': true
```

> esbuild 设为 `false` 是刻意的：它的 postinstall 只做「下载 + 校验版本」，而原生二进制已经由
> `@esbuild/win32-x64` 这个可选依赖包直接提供，跳过校验不影响使用。

### 2. `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`

**现象**

```
2 lockfile entries failed verification:
baseline-browser-mapping@2.11.25 ... within the minimumReleaseAge cutoff
electron-to-chromium@1.5.431 ... within the minimumReleaseAge cutoff
```

**原因**

pnpm 的「最小发布年龄」策略会拒绝依赖刚发布不久的新包，锁定文件校验因此失败。

**修复**

`pnpm-workspace.yaml` 增加：

```yaml
minimumReleaseAge: 0
```

然后重建锁定文件：

```bash
pnpm install --no-frozen-lockfile
```

### 3. `pnpm dev:web` → 命令找不到

**原因**

命令拼写成了 `pnmpnpm dev:web`（多了 `pn`）。另外如果 `node_modules/.bin` 不存在，
说明上一次 `pnpm install` 中断了，`vite` 命令也不会生成——重跑一次 `pnpm install` 即可。

---

## 二、正确的启动方式

### 安装依赖（首次）

```powershell
cd C:\Users\18363\财务软件开发
pnpm install
```

看到 `@parcel/watcher install: Done` 和 `Done in xx s` 即为成功。

### 开发模式（热更新）

```powershell
pnpm dev:web
```

浏览器打开 http://localhost:3000/

### 生产构建 + 预览

```powershell
pnpm build          # 产出 dist/
node simple-server.js 3000   # 托管 dist/，打开 http://localhost:3000/
```

也可以双击 `启动简单服务器.bat`（内部就是上一条命令）。

### 桌面应用（需先装 Rust）

```powershell
pnpm tauri dev
```

Rust 安装见 [INSTALL.md](INSTALL.md)。

---

## 三、验证结果

| 检查项 | 命令 | 结果 |
|--------|------|------|
| 类型检查 | `npx tsc --noEmit` | 通过，0 错误 |
| 生产构建 | `pnpm build` | 通过，5640 个模块，产物 2.66 MB（gzip 811 KB） |
| 依赖安装 | `pnpm install` | 通过，`.bin` 含 vite/tauri/tsc/eslint |
| 应用访问 | `node simple-server.js` | 首页 200，JS/CSS 资源 200 |

---

## 四、其他已知情况

### Sass 的 `legacy-js-api` 弃用警告

```
DEPRECATION WARNING [legacy-js-api]: The legacy JS API is deprecated ...
```

这是 Vite 5 内置 Sass 集成的提示，不影响构建和运行。升级到 Vite 6+ 会消失。

### 单个 chunk 超过 500 kB

```
(!) Some chunks are larger than 500 kB after minification.
```

antd + @ant-design/charts 体积较大属正常。后续可用 `build.rollupOptions.output.manualChunks`
做代码分割优化。

### Web 版的数据来源

不带 Tauri 运行时（`window.__TAURI__` 不存在）时，`src/api/index.ts` 会自动回退到
`src/mock/api.ts` 的内存模拟数据；在 Tauri 中运行时会自动改用 SQLite 后端命令。
