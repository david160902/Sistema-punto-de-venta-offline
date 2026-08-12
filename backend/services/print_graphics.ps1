
Add-Type -AssemblyName System.Drawing
$doc = New-Object System.Drawing.Printing.PrintDocument
$doc.PrinterSettings.PrinterName = 'EPSONA14647 (L455 Series)'

$doc.add_PrintPage({
    param($sender, $e)
    $graphics = $e.Graphics
    $actualWidth = $e.PageBounds.Width
    $workingWidth = $actualWidth
    # Si la impresora de pruebas es A4 (ancho > 400), simulamos una térmica de 80mm (320 aprox)
    if ($workingWidth -gt 400) { $workingWidth = 320 }

    # Calcular tamaño de fuente exacto para que entren 40 caracteres
    $testStr = "0".PadRight(40, "0")
    $tempFont = New-Object System.Drawing.Font("Consolas", 10)
    $size10 = $graphics.MeasureString($testStr, $tempFont)
    
    $targetSize = 10 * (($workingWidth - 10) / $size10.Width)
    if ($targetSize -gt 11) { $targetSize = 11 }
    if ($targetSize -lt 6) { $targetSize = 6 }
    
    $font = New-Object System.Drawing.Font("Consolas", $targetSize, [System.Drawing.FontStyle]::Bold)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
    $y = 0

    $logoPath = 'C:\\Users\\gabo\\Desktop\\Sistema pos\\backend\\uploads\\dummy_logo.png'
    if (Test-Path $logoPath) {
        $img = [System.Drawing.Image]::FromFile($logoPath)
        
        # El logo ocupará el 50% del ancho del ticket
        $width = $workingWidth * 0.5
        $height = ($width / $img.Width) * $img.Height
        $x = ($actualWidth - $width) / 2  # Lo centramos en el papel real
        if ($x -lt 0) { $x = 0 }
        
        $cm = New-Object System.Drawing.Imaging.ColorMatrix
        $cm.Matrix00 = 0.299; $cm.Matrix01 = 0.299; $cm.Matrix02 = 0.299
        $cm.Matrix10 = 0.587; $cm.Matrix11 = 0.587; $cm.Matrix12 = 0.587
        $cm.Matrix20 = 0.114; $cm.Matrix21 = 0.114; $cm.Matrix22 = 0.114
        $ia = New-Object System.Drawing.Imaging.ImageAttributes
        $ia.SetColorMatrix($cm)
        
        $rect = New-Object System.Drawing.Rectangle([int]$x, [int]$y, [int]$width, [int]$height)
        $graphics.DrawImage($img, $rect, 0, 0, $img.Width, $img.Height, [System.Drawing.GraphicsUnit]::Pixel, $ia)
        
        $y += $height + 15
        $img.Dispose()
    }

    $text = Get-Content 'C:\\Users\\gabo\\Desktop\\Sistema pos\\backend\\services\\temp_ticket.txt' -Raw -Encoding UTF8
    
    # Imprimimos el texto con margen de 5 unidades, centrado respecto al workingWidth
    $textX = ($actualWidth - $workingWidth) / 2 + 5
    $graphics.DrawString($text, $font, $brush, $textX, $y)
})

$doc.Print()
