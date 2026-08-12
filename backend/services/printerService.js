const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function printTicket(ticketNumber, orderData, settings = {}) {
    let ticketContent = "";
    
    // Función de centrado para 40 caracteres (ancho estandar ticket 80mm)
    const centerText = (text) => {
        if (!text) return "";
        const w = 40;
        let t = String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        if (t.length >= w) return t.substring(0, w);
        const pad = Math.floor((w - t.length) / 2);
        return " ".repeat(pad) + t + " ".repeat(w - t.length - pad);
    };

    const bName = settings?.business_name || 'SISTEMA POS CHIFERIA';
    const bAddr = settings?.address || 'Av. Siempre Viva 123';

    ticketContent += `${centerText(bName)}\n`;
    ticketContent += `${centerText(bAddr)}\n`;
    if (settings?.phone) {
        ticketContent += `${centerText('Telf: ' + settings.phone)}\n`;
    }
    ticketContent += `----------------------------------------\n`;
    // Quitamos la ° de N° para que sea 100% ASCII y no cause error en la cola
    ticketContent += ` TICKET #: ${String(ticketNumber).padStart(4, '0')}          TIPO: ${orderData.order_type}\n`;
    
    // Evitamos el toLocaleString() que puede inyectar espacios invisibles
    const d = new Date();
    const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    ticketContent += ` FECHA: ${dateStr}\n`;
    
    ticketContent += `----------------------------------------\n`;
    
    if (orderData.items && orderData.items.length > 0) {
        orderData.items.forEach(item => {
            // Quitamos tildes para evitar errores en cola de impresion
            let itemName = item.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            ticketContent += ` ${item.qty}x ${itemName.substring(0, 18).padEnd(20)} S/ ${item.price.toFixed(2)}\n`;
            if(item.notes) {
                let note = item.notes.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                ticketContent += `    * ${note}\n`;
            }
        });
    } else {
        ticketContent += ` (Sin productos en la bolsa)\n`;
    }
    
    ticketContent += `----------------------------------------\n`;
    ticketContent += ` TOTAL A PAGAR:               S/ ${orderData.total.toFixed(2)}\n`;
    ticketContent += ` PAGO:                        ${orderData.payment_method}\n`;
    
    if (orderData.order_type === 'DELIVERY') {
        ticketContent += `----------------------------------------\n`;
        let cName = (orderData.customer_name || 'Sin Nombre').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        ticketContent += ` CLIENTE: ${cName}\n`;
        ticketContent += ` TEL:     ${orderData.customer_phone || 'Sin Telefono'}\n`;
    }
    
    ticketContent += `----------------------------------------\n`;
    
    const fMsg = settings?.ticket_message || 'Gracias por su compra!';
    ticketContent += `${centerText(fMsg)}\n`;
    
    ticketContent += "\n\n\n\n"; // Espacio para el corte

    console.log("\n========================================");
    console.log("IMPRIMIENDO TICKET N " + ticketNumber);
    console.log("========================================");
    console.log(ticketContent);

    if (settings && settings.printer_type === 'WINDOWS' && settings.printer_ip) {
        const printerName = settings.printer_ip; 
        const hasLogo = settings.logo ? true : false;
        
        if (hasLogo) {
            // MÉTODO 2: Impresión gráfica (Con Logo) usando PowerShell + System.Drawing
            const logoPath = path.join(__dirname, '../uploads', settings.logo);
            const tempFilePath = path.join(__dirname, 'temp_ticket.txt');
            const psScriptPath = path.join(__dirname, 'print_graphics.ps1');
            
            // Escribimos en UTF-8 para que PowerShell lo lea correctamente
            fs.writeFileSync(tempFilePath, ticketContent, 'utf8');

            const psScript = `
Add-Type -AssemblyName System.Drawing
$doc = New-Object System.Drawing.Printing.PrintDocument
$doc.PrinterSettings.PrinterName = '${printerName}'

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

    $logoPath = '${logoPath.replace(/\\/g, '\\\\')}'
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

    $text = Get-Content '${tempFilePath.replace(/\\/g, '\\\\')}' -Raw -Encoding UTF8
    
    # Imprimimos el texto con margen de 5 unidades, centrado respecto al workingWidth
    $textX = ($actualWidth - $workingWidth) / 2 + 5
    $graphics.DrawString($text, $font, $brush, $textX, $y)
})

$doc.Print()
`;
            fs.writeFileSync(psScriptPath, psScript, 'utf8');
            
            const command = `powershell.exe -ExecutionPolicy Bypass -File "${psScriptPath}"`;
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error("[X] Error al imprimir GRÁFICO en Windows:", error);
                } else {
                    console.log(`[OK] Ticket con LOGO enviado a: ${printerName}`);
                }
            });
            
        } else {
            // MÉTODO 1: Impresión cruda súper rápida (Sin Logo)
            const tempFilePath = path.join(__dirname, 'temp_ticket.txt');
            
            // Escribimos en latin1 para que PowerShell (que lee en ANSI) no se confunda
            fs.writeFileSync(tempFilePath, ticketContent, 'latin1');
            
            // Usamos Out-Printer nativo, exactamente como te funcionaba al principio
            const command = `powershell.exe -Command "Get-Content '${tempFilePath}' | Out-Printer -Name '${printerName}'"`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error("[X] Error al imprimir TEXTO en Windows:", error);
                } else {
                    console.log(`[OK] Ticket (Texto Rápido) enviado a: ${printerName}`);
                }
            });
        }
    }
}

module.exports = { printTicket };
