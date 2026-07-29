const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function printTicket(ticketNumber, orderData, settings = {}) {
    let ticketContent = "";
    
    ticketContent += `          SISTEMA POS CHIFERIA         \n`;
    ticketContent += `      Av. Siempre Viva 123             \n`;
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
    // Quitamos los signos de exclamación invertidos (¡)
    ticketContent += `         Gracias por su compra!        \n`;
    ticketContent += "\n\n\n\n"; // Espacio para el corte

    console.log("\n========================================");
    console.log("IMPRIMIENDO TICKET N " + ticketNumber);
    console.log("========================================");
    console.log(ticketContent);

    if (settings && settings.printer_type === 'WINDOWS' && settings.printer_ip) {
        const printerName = settings.printer_ip; 
        const tempFilePath = path.join(__dirname, 'temp_ticket.txt');
        
        // Escribimos en latin1 para que PowerShell (que lee en ANSI) no se confunda
        fs.writeFileSync(tempFilePath, ticketContent, 'latin1');
        
        // Usamos Out-Printer nativo, exactamente como te funcionaba al principio
        const command = `powershell.exe -Command "Get-Content '${tempFilePath}' | Out-Printer -Name '${printerName}'"`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error("[X] Error al imprimir en Windows:", error);
            } else {
                console.log(`[OK] Enviado a la impresora de Windows: ${printerName}`);
            }
        });
    }
}

module.exports = { printTicket };
