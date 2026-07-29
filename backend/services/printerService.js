// Servicio de Impresión
// Aquí irá la librería 'escpos' para comunicarse por USB/Red con la Lopen.
// Por ahora, usamos este simulador para ver cómo armará el ticket en papel de 80mm.

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function printTicket(ticketNumber, orderData, settings = {}) {
    let ticketContent = "";
    
    ticketContent += `          SISTEMA POS CHIFERIA         \n`;
    ticketContent += `      Av. Siempre Viva 123             \n`;
    ticketContent += `----------------------------------------\n`;
    ticketContent += ` TICKET #: ${String(ticketNumber).padStart(4, '0')}          TIPO: ${orderData.order_type}\n`;
    ticketContent += ` FECHA: ${new Date().toLocaleString()}\n`;
    ticketContent += `----------------------------------------\n`;
    
    if (orderData.items && orderData.items.length > 0) {
        orderData.items.forEach(item => {
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
    ticketContent += `       *** Gracias por su compra ***    \n`;
    ticketContent += "\n\n\n\n"; // Espacio para el corte

    // 1. Mostrar simulación en Consola
    console.log("\n========================================");
    console.log("🖨️  IMPRIMIENDO TICKET N° " + ticketNumber);
    console.log("========================================");
    console.log(ticketContent);

    // 2. Si está en modo Windows, enviar a la impresora real
    if (settings && settings.printer_type === 'WINDOWS' && settings.printer_ip) {
        const printerName = settings.printer_ip; // En modo WINDOWS, printer_ip guarda el Nombre de la Impresora
        const tempFilePath = path.join(__dirname, 'temp_ticket.txt');
        
        fs.writeFileSync(tempFilePath, ticketContent, 'utf-8');
        
        // Usar PowerShell para mandar el texto plano a la cola de la impresora
        // Importante: Dependiendo del driver, podría interpretar texto plano.
        const command = `powershell.exe -Command "Get-Content -Encoding UTF8 '${tempFilePath}' | Out-Printer -Name '${printerName}'"`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error("❌ Error al imprimir en Windows:", error);
            } else {
                console.log(`✅ ¡Enviado a la impresora de Windows: ${printerName}!`);
            }
        });
    }
}

module.exports = { printTicket };
