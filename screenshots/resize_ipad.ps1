Add-Type -AssemblyName System.Drawing

$srcDir = "C:\Users\pennw\.gemini\antigravity\brain\dab89097-def6-4a52-b62f-9829c5a68847"
$dstDir = "c:\Users\pennw\OneDrive\Documents\Google agent manager\resilient-path-app\screenshots"
$targetW = 2048
$targetH = 2732

$files = @(
    @{src="ipad_home_1777763288067.png"; dst="ipad_01_home.png"},
    @{src="ipad_workbook_1777763327955.png"; dst="ipad_02_workbook.png"},
    @{src="ipad_chat_1777763337460.png"; dst="ipad_03_chat.png"},
    @{src="ipad_health_1777763347632.png"; dst="ipad_04_health.png"},
    @{src="ipad_emergency_1777763353447.png"; dst="ipad_05_emergency.png"}
)

foreach ($f in $files) {
    $srcPath = Join-Path $srcDir $f.src
    $dstPath = Join-Path $dstDir $f.dst
    
    $srcImg = [System.Drawing.Image]::FromFile($srcPath)
    $bmp = New-Object System.Drawing.Bitmap($targetW, $targetH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    # Calculate scaling to fill the target while maintaining aspect ratio
    $scaleX = $targetW / $srcImg.Width
    $scaleY = $targetH / $srcImg.Height
    $scale = [Math]::Max($scaleX, $scaleY)
    
    $newW = [int]($srcImg.Width * $scale)
    $newH = [int]($srcImg.Height * $scale)
    $x = [int](($targetW - $newW) / 2)
    $y = [int](($targetH - $newH) / 2)
    
    # Fill with white background first
    $g.Clear([System.Drawing.Color]::White)
    $g.DrawImage($srcImg, $x, $y, $newW, $newH)
    
    $g.Dispose()
    $bmp.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $srcImg.Dispose()
    
    Write-Host "Created: $($f.dst) at ${targetW}x${targetH}"
}

Write-Host "Done! All iPad screenshots resized."
