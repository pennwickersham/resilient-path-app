$text = Get-Content "c:\Users\pennw\OneDrive\Documents\Google agent manager\resilient-path-app\regulatory-statement.txt" -Raw

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Add()
$selection = $word.Selection
$selection.Font.Name = "Calibri"
$selection.Font.Size = 11
$selection.TypeText($text)
$outputPath = "c:\Users\pennw\OneDrive\Documents\Google agent manager\resilient-path-app\regulatory-statement.pdf"
$doc.SaveAs([ref]$outputPath, [ref]17)
$doc.Close()
$word.Quit()
Write-Host "PDF created successfully at: $outputPath"
