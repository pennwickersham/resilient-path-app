# resize_65inch.ps1
# Resizes the 6.7-inch (1284x2778) screenshots down to 6.5-inch (1242x2688)
# for the App Store Connect 6.5-inch device slot.

Add-Type -AssemblyName System.Drawing

$sourceFiles = @(
    "01_home.png",
    "02_workbook.png",
    "03_chat.png",
    "04_health.png",
    "05_emergency.png"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$targetW = 1242
$targetH = 2688

foreach ($file in $sourceFiles) {
    $srcPath = Join-Path $scriptDir $file
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file)
    $outPath  = Join-Path $scriptDir "${baseName}_65.png"

    $src = [System.Drawing.Image]::FromFile($srcPath)

    $bmp = New-Object System.Drawing.Bitmap($targetW, $targetH)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $targetW, $targetH)
    $g.Dispose()

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $src.Dispose()

    Write-Host "Created: $outPath ($targetW x $targetH)"
}

Write-Host "`nDone. 5 screenshots ready for the 6.5-inch slot."
