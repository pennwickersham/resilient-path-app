# capture_screenshots.ps1
# Captures App Store screenshots using Edge headless at 6.7-inch iPhone resolution (1284x2778)
# Then use resize_65inch.ps1 to generate the 6.5-inch variants.

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$baseUrl = "http://localhost:5173"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$pages = @(
    @{ Name = "01_home"; Path = "/" },
    @{ Name = "02_workbook"; Path = "/workbook" },
    @{ Name = "03_chat"; Path = "/chatbot" },
    @{ Name = "04_health"; Path = "/health-tools" },
    @{ Name = "05_emergency"; Path = "/emergency" }
)

# iPhone 15 Pro Max logical: 428x926, DPR 3 = 1284x2778
$width = 428
$height = 926
$dpr = 3

foreach ($page in $pages) {
    $url = "$baseUrl$($page.Path)"
    $outFile = Join-Path $scriptDir "$($page.Name).png"
    
    Write-Host "Capturing $($page.Name) from $url ..."
    
    & $edgePath `
        --headless=new `
        --disable-gpu `
        --screenshot="$outFile" `
        --window-size="$width,$height" `
        --force-device-scale-factor=$dpr `
        --hide-scrollbars `
        --disable-extensions `
        --no-first-run `
        --no-default-browser-check `
        $url
    
    Start-Sleep -Seconds 2
    
    if (Test-Path $outFile) {
        Add-Type -AssemblyName System.Drawing
        $img = [System.Drawing.Image]::FromFile($outFile)
        Write-Host "  -> $outFile ($($img.Width)x$($img.Height))"
        $img.Dispose()
    } else {
        Write-Host "  -> FAILED: $outFile not created"
    }
}

Write-Host "`nDone. Now run resize_65inch.ps1 to generate 6.5-inch variants."
