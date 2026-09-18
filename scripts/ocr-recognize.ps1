# 调用 Windows 内置 OCR 引擎识别图片，结果写入 JSON 文件
#
# 用法:
#   powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\ocr-recognize.ps1 `
#       -ImagePath <图片路径> -OutputPath <输出JSON路径> [-LanguageTag zh-Hans-CN]
#
# 说明:
#   - 结果通过文件传递（而非 stdout），避免 PowerShell 控制台编码把中文弄乱
#   - 成功: 退出码 0，JSON 形如 { "text": "...", "lines": [...], "elapsedMs": 49, "language": "zh-Hans-CN" }
#   - 失败: 退出码 1，JSON 形如 { "error": "..." }

param(
    [Parameter(Mandatory = $true)][string]$ImagePath,
    [Parameter(Mandatory = $true)][string]$OutputPath,
    [string]$LanguageTag = 'zh-Hans-CN'
)

$ErrorActionPreference = 'Stop'

function Write-JsonFile($path, $object) {
    $json = $object | ConvertTo-Json -Depth 6 -Compress
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($path, $json, $utf8NoBom)
}

try {
    if (-not (Test-Path -LiteralPath $ImagePath)) {
        throw "图片不存在: $ImagePath"
    }

    # 加载 WinRT 类型
    [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
    [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
    [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime] | Out-Null
    [Windows.Globalization.Language, Windows.Globalization, ContentType = WindowsRuntime] | Out-Null
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

    # 选择语言：优先指定语言，其次用户配置语言，最后任意可用语言
    $languages = [Windows.Media.Ocr.OcrEngine]::AvailableRecognizerLanguages
    if ($languages.Count -eq 0) {
        throw '系统未安装任何 OCR 语言包'
    }

    $lang = $languages | Where-Object { $_.LanguageTag -eq $LanguageTag } | Select-Object -First 1
    if (-not $lang) { $lang = $languages | Select-Object -First 1 }

    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
    if (-not $engine) {
        $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
    }
    if (-not $engine) {
        throw "创建 OCR 引擎失败（语言: $LanguageTag）"
    }

    $absolutePath = (Resolve-Path -LiteralPath $ImagePath).Path

    $file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($absolutePath)) ([Windows.Storage.StorageFile])
    $stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
    $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $result = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
    $sw.Stop()

    # 逐行输出（行内单词之间不补空格，中日韩文本这样更贴近原文）
    $lines = @()
    foreach ($line in $result.Lines) {
        $lines += (($line.Words | ForEach-Object { $_.Text }) -join '')
    }

    $stream.Dispose()
    $bitmap.Dispose()

    Write-JsonFile $OutputPath ([ordered]@{
        text      = $result.Text
        lines     = $lines
        lineCount = $lines.Count
        elapsedMs = $sw.ElapsedMilliseconds
        language  = $lang.LanguageTag
        width     = $decoder.PixelWidth
        height    = $decoder.PixelHeight
    })

    exit 0
}
catch {
    try {
        Write-JsonFile $OutputPath ([ordered]@{ error = $_.Exception.Message })
    } catch { }
    exit 1
}
