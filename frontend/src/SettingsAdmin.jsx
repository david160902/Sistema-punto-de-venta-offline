import React, { useState, useEffect } from 'react';
import { Save, Printer, Store, Lock, TabletSmartphone, Copy, Check, Shield, Eye, EyeOff } from 'lucide-react';

export default function SettingsAdmin() {
  const [activeTab, setActiveTab] = useState('general');

  // Estados para datos del negocio e impresora
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [printerType, setPrinterType] = useState('WINDOWS');
  const [printerIp, setPrinterIp] = useState('');
  const [windowsPrinters, setWindowsPrinters] = useState([]);

  // Estados para el cambio de PIN de Admin
  const [currentAdminPin, setCurrentAdminPin] = useState('****');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [newAdminPin, setNewAdminPin] = useState('');
  
  // Estado para la IP local (Tablets)
  const [localIp, setLocalIp] = useState('Cargando...');
  const [copied, setCopied] = useState(false);
  
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchNetworkInfo();
  }, []);

  const fetchNetworkInfo = async () => {
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/pos/network-info`);
      const data = await res.json();
      if (data.ip) {
        setLocalIp(data.ip);
      }
      
      const pinRes = await fetch(`http://${window.location.hostname}:3000/api/pos/admin-pin`);
      const pinData = await pinRes.json();
      if (pinData.pin) {
        setCurrentAdminPin(pinData.pin);
      }
    } catch (err) {
      setLocalIp('Error de red');
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/pos/settings`);
      const data = await res.json();
      if (data.settings) {
        setBusinessName(data.settings.business_name);
        setAddress(data.settings.address);
        setPhone(data.settings.phone);
        setTicketMessage(data.settings.ticket_message);
        setPrinterType(data.settings.printer_type || 'USB');
        setPrinterIp(data.settings.printer_ip);
      }
    } catch (err) {
      console.error(err);
    }

    try {
      const winRes = await fetch(`http://${window.location.hostname}:3000/api/pos/windows-printers`);
      const winData = await winRes.json();
      if (winData.printers) {
        setWindowsPrinters(winData.printers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveSettings = async () => {
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/pos/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          address,
          phone,
          ticket_message: ticketMessage,
          printer_type: printerType,
          printer_ip: printerIp
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsError(false);
        setMessage("¡Ajustes del sistema guardados correctamente!");
        setTimeout(() => setMessage(''), 3000);
      } else {
        setIsError(true);
        setMessage("Error al guardar ajustes.");
      }
    } catch (err) {
      setIsError(true);
      setMessage("Error de conexión al servidor.");
    }
  };

  const saveAdminPin = async () => {
    if (newAdminPin.length !== 4) {
      setIsError(true);
      setMessage("El PIN de Administrador debe ser de 4 dígitos exactos.");
      return;
    }
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/pos/admin-pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_pin: newAdminPin })
      });
      const data = await res.json();
      if (data.success) {
        setIsError(false);
        setMessage("¡PIN de Administrador actualizado con éxito!");
        setCurrentAdminPin(newAdminPin);
        setNewAdminPin('');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setIsError(true);
        setMessage(data.error || "Error al actualizar PIN.");
      }
    } catch (err) {
      setIsError(true);
      setMessage("Error de conexión al servidor.");
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px', color: '#fff' }}>Configuración del Sistema</h2>

      {/* TABS DE NAVEGACIÓN */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #334155', paddingBottom: '15px', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('general')}
          style={{ padding: '10px 20px', borderRadius: '30px', border: 'none', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px', background: activeTab === 'general' ? '#3b82f6' : '#1e293b', color: activeTab === 'general' ? '#fff' : '#94a3b8' }}>
          <Store size={18} /> Datos del Negocio
        </button>
        <button 
          onClick={() => setActiveTab('impresora')}
          style={{ padding: '10px 20px', borderRadius: '30px', border: 'none', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px', background: activeTab === 'impresora' ? '#3b82f6' : '#1e293b', color: activeTab === 'impresora' ? '#fff' : '#94a3b8' }}>
          <Printer size={18} /> Impresora
        </button>
        <button 
          onClick={() => setActiveTab('tablets')}
          style={{ padding: '10px 20px', borderRadius: '30px', border: 'none', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px', background: activeTab === 'tablets' ? '#3b82f6' : '#1e293b', color: activeTab === 'tablets' ? '#fff' : '#94a3b8' }}>
          <TabletSmartphone size={18} /> Conexión Tablets
        </button>
        <button 
          onClick={() => setActiveTab('seguridad')}
          style={{ padding: '10px 20px', borderRadius: '30px', border: 'none', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px', background: activeTab === 'seguridad' ? '#3b82f6' : '#1e293b', color: activeTab === 'seguridad' ? '#fff' : '#94a3b8' }}>
          <Shield size={18} /> Seguridad
        </button>
      </div>

      {message && (
        <div style={{ padding: '15px', borderRadius: '8px', marginBottom: '20px', background: isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: isError ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
          {message}
        </div>
      )}

      <div>
        
        {/* TARJETA 1: DATOS DEL NEGOCIO */}
        {activeTab === 'general' && (
          <div style={{ background: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, color: '#10b981' }}>
              <Store size={24} /> Datos del Negocio (Cabezal del Ticket)
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
              Esta información aparecerá impresa en cada boleta que le entregues al cliente.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '14px' }}>Nombre del Restaurante</label>
                <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '14px' }}>Dirección</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '14px' }}>Teléfono (Opcional)</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '14px' }}>Mensaje de Despedida (Pie del ticket)</label>
                <input type="text" value={ticketMessage} onChange={e => setTicketMessage(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box' }} />
              </div>
            </div>
            <button onClick={saveSettings} style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> Guardar Datos
            </button>
          </div>
        )}

        {/* TARJETA 2: IMPRESORA */}
        {activeTab === 'impresora' && (
          <div style={{ background: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, color: '#38bdf8' }}>
              <Printer size={24} /> Impresora de Cocina (Tickets)
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '14px' }}>Tipo de Conexión</label>
              <select 
                value={printerType} 
                onChange={e => setPrinterType(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box', fontSize: '16px' }}
              >
                <option value="WINDOWS">Impresora del Sistema (Recomendado)</option>
                <option value="USB">Automático (Cable USB directo a la PC)</option>
                <option value="RED">Manual (Por red Wi-Fi o Cable de Red)</option>
              </select>
            </div>

            {printerType === 'WINDOWS' && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '15px' }}>
                  Selecciona la impresora que ya tienes instalada y funcionando en Windows (sin importar si es Wi-Fi o USB).
                </p>
                <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '14px' }}>Seleccionar Impresora</label>
                <select 
                  value={printerIp} 
                  onChange={e => setPrinterIp(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#10b981', boxSizing: 'border-box', fontSize: '16px' }}
                >
                  <option value="">-- Elige una impresora --</option>
                  {windowsPrinters.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            )}

            {printerType === 'USB' && (
              <div style={{ padding: '15px', background: 'rgba(56, 189, 248, 0.1)', border: '1px dashed #38bdf8', borderRadius: '8px', marginBottom: '20px', color: '#e0f2fe' }}>
                <strong>¡Modo Fácil Activado!</strong><br/>
                Solo conecta la impresora al puerto USB de esta computadora y enciéndela. El sistema se encargará de encontrarla automáticamente cuando imprimas un ticket. No necesitas configurar IPs ni nada más.
              </div>
            )}

            {printerType === 'RED' && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '15px' }}>
                  Ingresa la dirección IP de la impresora térmica conectada a tu red.
                </p>
                <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '14px' }}>IP de la Impresora</label>
                <input 
                  type="text" 
                  value={printerIp} 
                  onChange={e => setPrinterIp(e.target.value)} 
                  placeholder="Ej. 192.168.1.100"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#10b981', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '16px' }}
                />
              </div>
            )}

            <button onClick={saveSettings} style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> Guardar Impresora
            </button>
          </div>
        )}

        {/* TARJETA 3: CONEXIÓN DE TABLETS */}
        {activeTab === 'tablets' && (
          <div style={{ background: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, color: '#a855f7' }}>
              <TabletSmartphone size={24} /> Conexión de Tablets (POS)
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
              Abre este enlace exacto en el navegador de tus tablets para conectarlas a la Caja registradora.
            </p>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '14px' }}>Enlace de la Caja (URL)</label>
              <div style={{ display: 'flex', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155', overflow: 'hidden' }}>
                <input 
                  type="text" 
                  readOnly
                  value={`http://${localIp}:${window.location.port}/cajero`} 
                  style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', color: '#a855f7', fontSize: '16px', fontFamily: 'monospace', outline: 'none' }}
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`http://${localIp}:${window.location.port}/cajero`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{ padding: '0 15px', background: 'transparent', border: 'none', borderLeft: '1px solid #334155', color: copied ? '#10b981' : '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Copiar enlace"
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
              <p style={{ color: '#64748b', fontSize: '12px', marginTop: '10px' }}>
                Sugerencia: Abre esta página en tu PC, guarda este enlace en los "Favoritos" de la tablet, o guárdalo como un ícono en la pantalla de inicio de la tablet.
              </p>
            </div>
          </div>
        )}

        {/* TARJETA 4: SEGURIDAD DEL ADMIN */}
        {activeTab === 'seguridad' && (
          <div style={{ background: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, color: '#f59e0b' }}>
              <Shield size={24} /> PIN del Administrador
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
              Modifica el código maestro que utilizas para acceder a este panel de administración.
            </p>
            
            <div style={{ background: '#0f172a', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px dashed #334155' }}>
              <div>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '5px' }}>PIN Maestro Actual</div>
                <div style={{ color: '#f59e0b', fontSize: '20px', fontFamily: 'monospace', letterSpacing: '4px', fontWeight: 'bold' }}>
                  {showCurrentPin ? currentAdminPin : '****'}
                </div>
              </div>
              <button 
                onClick={() => setShowCurrentPin(!showCurrentPin)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}
                title={showCurrentPin ? "Ocultar PIN" : "Mostrar PIN"}
              >
                {showCurrentPin ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '14px' }}>Nuevo PIN (4 dígitos)</label>
              <input 
                type="text" 
                maxLength="4"
                value={newAdminPin} 
                onChange={e => setNewAdminPin(e.target.value.replace(/[^0-9]/g, ''))} 
                placeholder="Ej. 7777"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f59e0b', fontSize: '24px', letterSpacing: '5px', textAlign: 'center', boxSizing: 'border-box', fontFamily: 'monospace' }}
              />
            </div>
            <button 
              onClick={saveAdminPin}
              disabled={newAdminPin.length !== 4}
              style={{ width: '100%', padding: '12px', background: newAdminPin.length !== 4 ? '#334155' : '#10b981', color: newAdminPin.length !== 4 ? '#94a3b8' : 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: newAdminPin.length !== 4 ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> Actualizar PIN Maestro
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
