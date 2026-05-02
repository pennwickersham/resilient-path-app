Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem "c:\Users\pennw\OneDrive\Documents\Google agent manager\resilient-path-app\screenshots\*.png"
foreach ($f in $files) {
    $img = [System.Drawing.Image]::FromFile($f.FullName)
    Write-Host "$($f.Name): $($img.Width) x $($img.Height)"
    $img.Dispose()
}
