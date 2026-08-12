Add-Type -AssemblyName System.Drawing
"$doc = New-Object System.Drawing.Printing.PrintDocument
"$doc.PrinterSettings.PrinterName = 'Microsoft Print to PDF'
"$doc.PrinterSettings.PrintToFile = $true
"$doc.PrinterSettings.PrintFileName = 'C:\Users\gabo\Desktop\test_receipt.pdf'

"$doc.add_PrintPage({
    param($sender, $e)
    $graphics = $e.Graphics
    $font = New-Object System.Drawing.Font('Consolas', 10)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
    $graphics.DrawString('Hello POS Graphics', $font, $brush, 0, 0)
})
"$doc.Print()
