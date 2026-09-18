# Windows 内置 OCR 引擎可用性测试
# 用法: powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\ocr-test.ps1

$ErrorActionPreference = 'Stop'

# ---------- 1. 生成一张中文发票样张 ----------
Add-Type -AssemblyName System.Drawing

$w = 1000; $h = 460
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

$titleFont = New-Object System.Drawing.Font('Microsoft YaHei', 26, [System.Drawing.FontStyle]::Bold)
$bodyFont = New-Object System.Drawing.Font('Microsoft YaHei', 20)
$black = [System.Drawing.Brushes]::Black

$g.DrawString('增值税普通发票', $titleFont, $black, 40, 20)

$lines = @(
    '发票号码 12345678',
    '开票日期 2026年09月18日',
    '销售方 某某科技有限公司',
    '价税合计 1130.00 元',
    '税额 130.00 元'
)
$y = 100
foreach ($line in $lines) {
    $g.DrawString($line, $bodyFont, $black, 40, $y)
    $y += 62
}
$g.Dispose()

$imgPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'ocr-test.png'
$bmp.Save($imgPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Host "[1/3] 已生成测试图片: $imgPath" -ForegroundColor Cyan
Write-Host "      尺寸: ${w}x${h}" -ForegroundColor DarkGray

# ---------- 2. 加载 WinRT OCR 类型 ----------
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime] | Out-Null
[Windows.Globalization.Language, Windows.Globalization, ContentType = WindowsRuntime] | Out-Null

# PowerShell 5.1 中等待 IAsyncOperation 的标准写法
Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and
    $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]

function Await($operation, $resultType) {
    $task = $asTaskGeneric.MakeGenericMethod($resultType).Invoke($null, @($operation))
    $task.Wait(-1) | Out-Null
    $task.Result
}

Write-Host "[2/3] WinRT OCR 类型加载成功" -ForegroundColor Cyan

# ---------- 3. 执行识别 ----------
$lang = [Windows.Media.Ocr.OcrEngine]::AvailableRecognizerLanguages |
    Where-Object { $_.LanguageTag -eq 'zh-Hans-CN' }
if (-not $lang) { throw '未找到 zh-Hans-CN OCR 语言包' }

$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
if (-not $engine) { throw '创建 OCR 引擎失败' }

$file    = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($imgPath)) ([Windows.Storage.StorageFile])
$stream  = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
$decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
$bitmap  = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])

$sw = [System.Diagnostics.Stopwatch]::StartNew()
$result = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
$sw.Stop()

Write-Host "[3/3] 识别完成，耗时 $($sw.ElapsedMilliseconds) ms" -ForegroundColor Cyan
Write-Host ''
Write-Host '================ 识别结果 ================' -ForegroundColor Yellow
Write-Host $result.Text
Write-Host '==========================================' -ForegroundColor Yellow
Write-Host ''
Write-Host "识别出的文本行数: $($result.Lines.Count)" -ForegroundColor Green

# 逐行输出，便于核对
Write-Host ''
Write-Host '--- 按行明细 ---' -ForegroundColor DarkGray
foreach ($line in $result.Lines) {
    $words = ($line.Words | ForEach-Object { $_.Text }) -join ''
    Write-Host "  $words"
}
