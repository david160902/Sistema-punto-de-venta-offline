import React, { useState, useEffect } from 'react';
import { Trash2, CreditCard, Plus, Banknote } from 'lucide-react';

export default function OperationsAdmin() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newPaymentName, setNewPaymentName] = useState('');
  const [confirmModal, setConfirmModal] = useState({ show: false, id: null, name: null });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/pos/payment-methods`);
      const data = await res.json();
      setPaymentMethods(data);
    } catch (e) {
      console.error("Error fetching payment methods:", e);
    }
  };

  const openCreateModal = () => {
    setNewPaymentName('');
    setError('');
    setShowModal(true);
  };

  const addPaymentMethod = async () => {
    if (!newPaymentName.trim()) {
      setError("El nombre del método de pago es obligatorio.");
      return;
    }
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/pos/payment-methods`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPaymentName.trim() })
      });
      const data = await res.json();
      if(res.ok) {
        setShowModal(false);
        fetchPaymentMethods();
      } else {
        setError(data.error || "Error al guardar el método de pago.");
      }
    } catch (e) {
      setError("Error de conexión al servidor.");
    }
  };

  const requestDeletePayment = (payment) => {
    setConfirmModal({ show: true, id: payment.id, name: payment.name });
  };

  const confirmDeletePayment = async () => {
    if(!confirmModal.id) return;
    try {
      await fetch(`http://${window.location.hostname}:3000/api/pos/payment-methods/${confirmModal.id}`, { method: 'DELETE' });
      fetchPaymentMethods();
    } catch (e) {
      console.error(e); 
    } finally {
      setConfirmModal({ show: false, id: null, name: null });
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CreditCard size={28} color="#10b981" /> 
          Métodos de Pago
        </h2>
        <button 
          onClick={openCreateModal} 
          style={{ background: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
          <Plus size={20} /> Nuevo Método
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
        {paymentMethods.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#1e293b', borderRadius: '16px', border: '1px dashed #334155' }}>
            No hay métodos de pago registrados.
          </div>
        )}
        
        {paymentMethods.map(p => (
          <div key={p.id} style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden', position: 'relative' }}>
            <div style={{ padding: '25px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', border: '2px solid #10b981' }}>
                <Banknote size={28} color="#10b981" />
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#fff', marginBottom: '20px' }}>{p.name}</div>
              
              <button 
                onClick={() => requestDeletePayment(p)}
                style={{ width: '100%', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
              >
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear Método de Pago */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', width: '400px', borderRadius: '16px', padding: '25px', border: '1px solid #334155' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
              <CreditCard size={24} color="#10b981" /> Nuevo Método de Pago
            </h3>
            
            {error && <div style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '14px' }}>Nombre del Método</label>
              <input 
                type="text" 
                value={newPaymentName} 
                onChange={e => setNewPaymentName(e.target.value)} 
                placeholder="Ej. Yape, Plin, Tarjeta Visa..."
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box', fontSize: '16px' }}
                onKeyPress={(e) => e.key === 'Enter' && addPaymentMethod()}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: '#334155', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Cancelar
              </button>
              <button 
                onClick={addPaymentMethod} 
                disabled={!newPaymentName.trim()}
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  background: !newPaymentName.trim() ? '#334155' : '#10b981', 
                  border: 'none', 
                  color: !newPaymentName.trim() ? '#94a3b8' : 'white', 
                  borderRadius: '8px', 
                  cursor: !newPaymentName.trim() ? 'not-allowed' : 'pointer', 
                  fontWeight: 'bold' 
                }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar */}
      {confirmModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', width: '400px', borderRadius: '16px', padding: '25px', border: '1px solid #334155', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#fff' }}>¿Estás seguro?</h3>
            <p style={{ color: '#94a3b8', marginBottom: '25px', lineHeight: '1.5' }}>
              Estás a punto de eliminar el método de pago: <br/>
              <strong style={{ color: '#ef4444', fontSize: '18px' }}>{confirmModal.name}</strong><br/><br/>
              No podrás volver a usarlo para cobrar pedidos.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setConfirmModal({ show: false, id: null, name: null })} 
                style={{ flex: 1, padding: '12px', background: '#334155', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Cancelar
              </button>
              <button 
                onClick={confirmDeletePayment} 
                style={{ flex: 1, padding: '12px', background: '#ef4444', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
