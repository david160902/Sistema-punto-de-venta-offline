import React, { useState, useEffect } from 'react';
import { Trash2, User, Bike, Plus, CreditCard } from 'lucide-react';

export default function StaffAdmin() {
  const [activeTab, setActiveTab] = useState('cajeros');
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, user: null });
  
  const [username, setUsername] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState('');

  // Estados para Motorizados
  const [drivers, setDrivers] = useState([]);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [confirmDriverModal, setConfirmDriverModal] = useState({ show: false, id: null, name: null });
  const [newDriverName, setNewDriverName] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/pos/users`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Error al cargar personal:", err);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/pos/drivers`);
      const data = await res.json();
      setDrivers(data);
    } catch (err) {
      console.error("Error al cargar motorizados:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDrivers();
  }, []);

  const openCreateModal = () => {
    setUsername('');
    setPinCode('');
    setError('');
    setShowModal(true);
  };

  const openDriverModal = () => {
    setNewDriverName('');
    setError('');
    setShowDriverModal(true);
  };

  const handleSaveUser = async () => {
    if (!username.trim() || !pinCode.trim()) {
      setError("El nombre y el PIN son obligatorios.");
      return;
    }
    if (pinCode.length !== 4 || isNaN(pinCode)) {
      setError("El PIN debe ser exactamente 4 números.");
      return;
    }

    const payload = { username, pin_code: pinCode };
    const url = `http://${window.location.hostname}:3000/api/pos/users`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        setShowModal(false);
        fetchUsers();
      } else {
        setError(data.error || "Ocurrió un error al guardar.");
      }
    } catch (err) {
      setError("Error de conexión.");
    }
  };

  const requestToggleUser = (user) => {
    setConfirmModal({ show: true, user });
  };

  const confirmToggleUserStatus = async () => {
    const user = confirmModal.user;
    if (!user) return;
    try {
      await fetch(`http://${window.location.hostname}:3000/api/pos/users/${user.id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmModal({ show: false, user: null });
    }
  };

  const addDriver = async () => {
    if(!newDriverName.trim()) {
      setError("El nombre del repartidor es obligatorio.");
      return;
    }
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/pos/drivers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDriverName.trim() })
      });
      const data = await res.json();
      if(res.ok) {
        setShowDriverModal(false);
        fetchDrivers();
      } else {
        setError(data.error || "Error al guardar el repartidor.");
      }
    } catch (e) {
      setError("Error de conexión al servidor.");
      console.error(e);
    }
  };

  const requestDeleteDriver = (driver) => {
    setConfirmDriverModal({ show: true, id: driver.id, name: driver.name });
  };

  const confirmDeleteDriver = async () => {
    if(!confirmDriverModal.id) return;
    try {
      await fetch(`http://${window.location.hostname}:3000/api/pos/drivers/${confirmDriverModal.id}`, { method: 'DELETE' });
      fetchDrivers();
    } catch (e) {
      console.error(e); 
    } finally {
      setConfirmDriverModal({ show: false, id: null, name: null });
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px', color: '#fff' }}>Administración de Personal</h2>
      
      {/* TABS DE NAVEGACIÓN */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #334155', paddingBottom: '15px', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('cajeros')}
          style={{ padding: '10px 20px', borderRadius: '30px', border: 'none', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px', background: activeTab === 'cajeros' ? '#3b82f6' : '#1e293b', color: activeTab === 'cajeros' ? '#fff' : '#94a3b8' }}>
          <User size={18} /> Cajeros
        </button>
        <button 
          onClick={() => setActiveTab('motorizados')}
          style={{ padding: '10px 20px', borderRadius: '30px', border: 'none', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px', background: activeTab === 'motorizados' ? '#3b82f6' : '#1e293b', color: activeTab === 'motorizados' ? '#fff' : '#94a3b8' }}>
          <Bike size={18} /> Motorizados
        </button>
      </div>

      {activeTab === 'cajeros' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#e2e8f0' }}>Personal Activo</h3>
            <button 
              onClick={openCreateModal} 
              style={{ background: '#10b981', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              + Agregar Cajero
            </button>
          </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {users.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#1e293b', borderRadius: '16px', border: '1px dashed #334155' }}>
            No hay cajeros registrados.
          </div>
        )}
        
        {users.map(u => (
          <div key={u.id} style={{ background: '#1e293b', borderRadius: '16px', border: `1px solid ${u.active ? '#334155' : '#ef444455'}`, overflow: 'hidden', opacity: u.active ? 1 : 0.5, position: 'relative' }}>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
                <User size={30} color={u.active ? '#f59e0b' : '#94a3b8'} />
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '5px', color: u.active ? '#fff' : '#94a3b8' }}>{u.username}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '24px', color: u.active ? '#10b981' : '#94a3b8', letterSpacing: '4px', marginBottom: '15px' }}>{u.pin_code}</div>
              
              {u.active ? (
                <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>ACTIVO</span>
              ) : (
                <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>INACTIVO</span>
              )}
            </div>
            
            {u.active && (
              <button 
                onClick={() => requestToggleUser(u)} 
                style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                title="Desactivar permanentemente"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}
          </div>
        </>
      )}

      {activeTab === 'motorizados' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#e2e8f0' }}>Motorizados (Delivery)</h3>
            <button 
              onClick={openDriverModal} 
              style={{ background: '#f59e0b', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              + Agregar Repartidor
            </button>
          </div>
        
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {drivers.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#1e293b', borderRadius: '16px', border: '1px dashed #334155' }}>
                No hay motorizados registrados.
              </div>
            )}
            
            {drivers.map(d => {
              // Verificamos "is_active" pero manejamos compatibilidad si se llamara "active"
              const isActive = d.is_active === 1 || d.active === 1;
              return (
              <div key={d.id} style={{ background: '#1e293b', borderRadius: '16px', border: `1px solid ${isActive ? '#334155' : '#ef444455'}`, overflow: 'hidden', opacity: isActive ? 1 : 0.5, position: 'relative' }}>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
                    <Bike size={30} color={isActive ? '#f59e0b' : '#94a3b8'} />
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '15px', color: isActive ? '#fff' : '#94a3b8' }}>{d.name}</div>
                  
                  {isActive ? (
                    <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>ACTIVO</span>
                  ) : (
                    <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>INACTIVO</span>
                  )}
                </div>
                
                {isActive && (
                  <button 
                    onClick={() => requestDeleteDriver(d)} 
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                    title="Desactivar permanentemente"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            )})}
          </div>
        </>
      )}

      {/* Modal Crear/Editar */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', width: '400px', borderRadius: '16px', padding: '25px', border: '1px solid #334155' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Nuevo Cajero</h3>
            
            {error && <div style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '14px' }}>Nombre del Empleado</label>
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="Ej. Juan Pérez"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '14px' }}>PIN de Acceso (4 dígitos)</label>
              <input 
                type="text" 
                maxLength="4"
                value={pinCode} 
                onChange={e => setPinCode(e.target.value.replace(/[^0-9]/g, ''))} 
                placeholder="Ej. 1234"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f59e0b', fontSize: '24px', letterSpacing: '5px', textAlign: 'center', boxSizing: 'border-box', fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: '#ef4444', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Cancelar
              </button>
              <button 
                onClick={handleSaveUser} 
                disabled={!username.trim() || pinCode.length !== 4}
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  background: (!username.trim() || pinCode.length !== 4) ? '#334155' : '#10b981', 
                  border: 'none', 
                  color: (!username.trim() || pinCode.length !== 4) ? '#94a3b8' : 'white', 
                  borderRadius: '8px', 
                  cursor: (!username.trim() || pinCode.length !== 4) ? 'not-allowed' : 'pointer', 
                  fontWeight: 'bold' 
                }}>
                Guardar Cajero
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Repartidor */}
      {showDriverModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', width: '400px', borderRadius: '16px', padding: '25px', border: '1px solid #334155' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bike size={24} color="#f59e0b" /> Nuevo Repartidor
            </h3>
            
            {error && <div style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '14px' }}>Nombre del Repartidor</label>
              <input 
                type="text" 
                value={newDriverName} 
                onChange={e => setNewDriverName(e.target.value)} 
                placeholder="Ej. Luis Pérez"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box' }}
                onKeyPress={(e) => e.key === 'Enter' && addDriver()}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDriverModal(false)} style={{ flex: 1, padding: '12px', background: '#ef4444', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Cancelar
              </button>
              <button 
                onClick={addDriver} 
                disabled={!newDriverName.trim()}
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  background: !newDriverName.trim() ? '#334155' : '#f59e0b', 
                  border: 'none', 
                  color: !newDriverName.trim() ? '#94a3b8' : 'white', 
                  borderRadius: '8px', 
                  cursor: !newDriverName.trim() ? 'not-allowed' : 'pointer', 
                  fontWeight: 'bold' 
                }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Activar/Desactivar */}
      {confirmModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', width: '400px', borderRadius: '16px', padding: '25px', border: '1px solid #334155', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>¿Estás seguro?</h3>
            <p style={{ color: '#94a3b8', marginBottom: '25px', lineHeight: '1.5' }}>
              Estás a punto de <strong>{confirmModal.user?.active ? 'desactivar' : 'reactivar'}</strong> al cajero <span style={{color: '#fff'}}>{confirmModal.user?.username}</span>.
              <br/>
              {confirmModal.user?.active ? "Ya no podrá acceder al punto de venta, pero su historial se mantendrá." : "Volverá a tener acceso al punto de venta."}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setConfirmModal({ show: false, user: null })} 
                style={{ flex: 1, padding: '12px', background: '#334155', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Cancelar
              </button>
              <button 
                onClick={confirmToggleUserStatus} 
                style={{ flex: 1, padding: '12px', background: confirmModal.user?.active ? '#ef4444' : '#10b981', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Sí, {confirmModal.user?.active ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar Repartidor */}
      {confirmDriverModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', width: '400px', borderRadius: '16px', padding: '25px', border: '1px solid #334155', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#fff' }}>¿Estás seguro?</h3>
            <p style={{ color: '#94a3b8', marginBottom: '25px', lineHeight: '1.5' }}>
              Estás a punto de desactivar al motorizado: <br/>
              <strong style={{ color: '#ef4444', fontSize: '18px' }}>{confirmDriverModal.name}</strong><br/><br/>
              Ya no podrá ser seleccionado para nuevos pedidos.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setConfirmDriverModal({ show: false, id: null, name: null })} 
                style={{ flex: 1, padding: '12px', background: '#334155', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteDriver} 
                style={{ flex: 1, padding: '12px', background: '#ef4444', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Sí, Desactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
