import React, { useState, useEffect } from 'react';
import { Save, Printer, Store, Lock, TabletSmartphone, Copy, Check, Shield, Eye, EyeOff, Upload, Trash2, Image as ImageIcon, CreditCard, Plus } from 'lucide-react';

export default function SettingsAdmin() {
  const [activeTab, setActiveTab] = useState('general');

  // Estados para datos del negocio e impresora
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [logo, setLogo] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);
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
        if (data.settings.logo) {
          setLogo(data.settings.logo.startsWith('data:') ? data.settings.logo : `http://${window.location.hostname}:3000/uploads/${data.settings.logo}`);
        } else {
          setLogo(null);
        }
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
      const formData = new FormData();
      formData.append('business_name', businessName);
      formData.append('address', address);
      formData.append('phone', phone);
      formData.append('ticket_message', ticketMessage);
      formData.append('printer_type', printerType);
      formData.append('printer_ip', printerIp);
      
      if (logoFile) {
        formData.append('logo', logoFile);
      } else if (removeLogo) {
        formData.append('remove_logo', 'true');
      }

      const res = await fetch(`http://${window.location.hostname}:3000/api/pos/settings`, {
        method: 'PUT',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setIsError(false);
        setMessage("¡Ajustes del sistema guardados correctamente!");
        setRemoveLogo(false);
        setLogoFile(null);
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
        <div style={{ 
          position: 'fixed', top: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          padding: '15px 25px', borderRadius: '12px', 
          background: isError ? '#ef4444' : '#10b981', 
          color: 'white', fontWeight: 'bold', 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'slideDown 0.3s ease-out'
        }}>
          {isError ? '⚠️' : '✓'} {message}
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
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '14px' }}>Logo del Restaurante</label>
                  
                  {!logo ? (
                    <label style={{ 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                      width: '100%', height: '120px', border: '2px dashed #475569', borderRadius: '12px', 
                      background: '#0f172a', cursor: 'pointer', transition: 'all 0.2s ease', 
                      color: '#94a3b8' 
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.color = '#94a3b8'; }}
                    >
                      <Upload size={28} style={{ marginBottom: '8px' }} />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>Subir imagen del logo</span>
                      <span style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>Formatos soportados: JPG, PNG</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setLogoFile(file);
                          setRemoveLogo(false);
                          const reader = new FileReader();
                          reader.onloadend = () => setLogo(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                  ) : (
                    <div style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      padding: '12px', background: '#0f172a', borderRadius: '12px', border: '1px solid #334155' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={logo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                        <div>
                          <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>Logo cargado</div>
                          <div style={{ color: '#10b981', fontSize: '12px' }}>✓ Listo para imprimir</div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => { setLogo(null); setLogoFile(null); setRemoveLogo(true); }} 
                        style={{ 
                          background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', 
                          padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                          fontSize: '13px', fontWeight: 'bold', transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                      >
                        <Trash2 size={16} /> Quitar
                      </button>
                    </div>
                  )}
                </div>
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
                <button onClick={saveSettings} style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                  <Save size={18} /> Guardar Datos
                </button>
              </div>

              {/* TICKET PREVIEW */}
              <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                <div style={{ background: '#f8fafc', color: '#0f172a', padding: '20px', width: '300px', fontFamily: 'monospace', fontSize: '14px', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                  {logo && <img src={logo} alt="Logo" style={{ maxWidth: '150px', maxHeight: '100px', objectFit: 'contain', marginBottom: '10px', filter: 'grayscale(100%) contrast(200%) brightness(1.2)' }} />}
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{businessName || 'SISTEMA POS CHIFERIA'}</div>
                  <div>{address || 'Av. Siempre Viva 123'}</div>
                  {phone && <div>Telf: {phone}</div>}
                  <div style={{ borderBottom: '1px dashed #94a3b8', margin: '10px 0' }}></div>
                  <div style={{ textAlign: 'left' }}>
                    <div>TICKET #: 0001 <span style={{ float: 'right' }}>LOCAL</span></div>
                    <div>FECHA: 01/08/2026 18:00</div>
                  </div>
                  <div style={{ borderBottom: '1px dashed #94a3b8', margin: '10px 0' }}></div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>1x Chaufa Especial</span><span>S/ 20.00</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>1x Sopa Wantan</span><span>S/ 12.00</span></div>
                  </div>
                  <div style={{ borderBottom: '1px dashed #94a3b8', margin: '10px 0' }}></div>
                  <div style={{ textAlign: 'left', fontWeight: 'bold' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>TOTAL A PAGAR:</span><span>S/ 32.00</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>PAGO:</span><span>EFECTIVO</span></div>
                  </div>
                  <div style={{ borderBottom: '1px dashed #94a3b8', margin: '10px 0' }}></div>
                  <div style={{ marginTop: '10px' }}>{ticketMessage || 'Gracias por su compra!'}</div>
                </div>
              </div>
            </div>
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
                style={{ 
                  width: '100%', padding: '12px 40px 12px 12px', borderRadius: '8px', border: '1px solid #334155', 
                  background: '#0f172a url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 12px center',
                  backgroundSize: '16px', color: 'white', boxSizing: 'border-box', fontSize: '16px',
                  appearance: 'none', outline: 'none', cursor: 'pointer', transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#334155'}
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
                  style={{ 
                    width: '100%', padding: '12px 40px 12px 12px', borderRadius: '8px', border: '1px solid #334155', 
                    background: '#0f172a url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2310b981\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 12px center',
                    backgroundSize: '16px', color: '#10b981', boxSizing: 'border-box', fontSize: '16px', fontWeight: '500',
                    appearance: 'none', outline: 'none', cursor: 'pointer', transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#334155'}
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
                    const text = `http://${localIp}:${window.location.port}/cajero`;
                    if (navigator.clipboard && window.isSecureContext) {
                        navigator.clipboard.writeText(text);
                    } else {
                        const textArea = document.createElement("textarea");
                        textArea.value = text;
                        textArea.style.position = "fixed";
                        textArea.style.left = "-999999px";
                        textArea.style.top = "-999999px";
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        try {
                            document.execCommand('copy');
                        } catch (err) {
                            console.error('No se pudo copiar', err);
                        }
                        textArea.remove();
                    }
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
