Add-Type -AssemblyName System.Drawing

$screenshotDir = ".\screenshots"
$files = Get-ChildItem $screenshotDir -Filter "*.png" | Where-Object { $_.Name -notlike "app_icon*" -and $_.Name -notlike "feature_graphic*" }

foreach ($f in $files) {
    $src = [System.Drawing.Image]::FromFile($f.FullName)
    $w = $src.Width
    $h = $src.Height
    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::White)
    $g.DrawImage($src, 0, 0, $w, $h)
    $g.Dispose()
    $src.Dispose()

    $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/png" }
    $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]100)
    $bmp.Save($f.FullName, $enc, $encParams)
    $bmp.Dispose()

    Write-Host "Stripped alpha: $($f.Name) ($w x $h)"
}

Write-Host "`nDone - all PNGs converted to 24bpp RGB (no alpha channel)"
