# 安装指南

## 问题描述

运行 `pnpm tauri dev` 时出现错误：
```
'pnpm tauri dev' 不是内部或外部命令，也不是可运行的程序
```

这是因为 Tauri 依赖的 **Rust** 和 **Cargo** 没有安装。

## 解决方案

### 步骤 1：安装 Rust

#### Windows 系统

1. **下载 Rust 安装程序**
   - 访问：https://rustup.rs/
   - 下载 `rustup-init.exe`

2. **运行安装程序**
   ```bash
   rustup-init.exe
   ```

3. **选择安装选项**
   - 选择 `1) Proceed with standard installation`
   - 按回车确认

4. **配置环境变量**
   - 安装完成后，重启终端或运行：
   ```bash
   source $HOME/.cargo/env
   ```

5. **验证安装**
   ```bash
   rustc --version
   cargo --version
   ```

#### macOS/Linux 系统

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 步骤 2：安装 Tauri CLI

```bash
# 全局安装 Tauri CLI
cargo install tauri-cli

# 或者使用 pnpm 安装
pnpm add -D @tauri-apps/cli
```

### 步骤 3：安装系统依赖

#### Windows 系统

需要安装以下组件：

1. **Visual Studio Build Tools**
   - 下载：https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - 安装时选择 "C++ 桌面开发" 工作负载

2. **WebView2**
   - Windows 10/11 通常已预装
   - 如果没有，从 Microsoft 官网下载

#### macOS 系统

```bash
xcode-select --install
```

#### Linux 系统 (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

### 步骤 4：验证安装

```bash
# 检查 Rust
rustc --version
cargo --version

# 检查 Tauri
cargo tauri --version
```

### 步骤 5：运行项目

```bash
cd 财务软件开发

# 安装依赖
pnpm install

# 启动开发服务器
pnpm tauri dev
```

## 常见问题

### 1. 权限问题

**问题**：`error: unable to get packages from source`

**解决**：
```bash
# 以管理员身份运行 PowerShell
# 或者使用管理员权限的终端
```

### 2. 网络问题

**问题**：`failed to download from https://...`

**解决**：
```bash
# 配置镜像源（中国用户）
# 在 ~/.cargo/config.toml 中添加：
[source.crates-io]
replace-with = 'ustc'

[source.ustc]
registry = "git://mirrors.ustc.edu.cn/crates.io-index"
```

### 3. 编译错误

**问题**：`error: linking with 'link.exe' failed`

**解决**：
- 确保安装了 Visual Studio Build Tools
- 安装 "C++ 桌面开发" 工作负载
- 重启终端后重试

### 4. WebView2 错误

**问题**：`WebView2 runtime not found`

**解决**：
- 下载安装 WebView2 Runtime
- 地址：https://developer.microsoft.com/en-us/microsoft-edge/webview2/

## 替代方案

如果不想安装 Rust，可以考虑：

### 方案 1：使用 Electron

```bash
# 修改 package.json
# 将 Tauri 相关依赖替换为 Electron
pnpm add -D electron
```

### 方案 2：纯 Web 应用

```bash
# 移除 Tauri，只保留前端
# 使用浏览器直接访问
pnpm dev
```

## 验证安装成功

运行以下命令验证：

```bash
# 检查环境
node --version      # 应该 >= 18.0.0
pnpm --version      # 应该 >= 8.0.0
rustc --version     # 应该 >= 1.70.0
cargo --version     # 随 Rust 安装
cargo tauri --version  # Tauri CLI

# 运行项目
cd 财务软件开发
pnpm install
pnpm tauri dev
```

## 获取帮助

如果仍有问题：

1. 查看 Tauri 官方文档：https://tauri.app/v1/guides/getting-started/prerequisites
2. 搜索错误信息
3. 在 GitHub Issues 中提问

---

**祝你开发顺利！** 🎉