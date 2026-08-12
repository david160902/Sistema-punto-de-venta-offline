import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Grid, Plus } from 'lucide-react';

export default function TablesAdmin() {
  const [tables, setTables] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, id: null, name: null });
  const [tableName, setTableName] = useState('');
  const [editingTableId, setEditingTableId] = useState(null);
  const [error, setError] = useState('');

  const fetchTables = async () => {
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/pos/tables`);
      const data = await res.json();
      setTables(data);
    } catch (err) {
      console.error("Error al cargar mesas:", err);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const openCreateModal = () => {
    setEditingTableId(null);
    setTableName('');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (table) => {
    setEditingTableId(table.id);
    setTableName(table.name);
    setError('');
    setShowModal(true);
  };

  const handleSaveTable = async () => {
    if (!tableName.trim()) {
      setError("El nombre de la mesa es obligatorio.");
      return;
    }

    try {
      const method = editingTableId ? 'PUT' : 'POST';
      const url = editingTableId 
        ? `http://${window.location.hostname}:3000/api/pos/tables/${editingTableId}`
        : `http://${window.location.hostname}:3000/api/pos/tables`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tableName.trim() })
      });
      
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        fetchTables();
      } else {
        setError(data.error || "Error al guardar la mesa.");
      }
    } catch (err) {
      setError("Error de conexión al servidor.");
    }
  };

  const requestDeleteTable = (table) => {
    setConfirmModal({ show: true, id: table.id, name: table.name });
  };

  const confirmDeleteTable = async () => {
    if(!confirmModal.id) return;
    try {
      await fetch(`http://${window.location.hostname}:3000/api/pos/tables/${confirmModal.id}`, { method: 'DELETE' });
      fetchTables();
    } catch (err) {
      console.error("Error al eliminar mesa:", err);
    } finally {
      setConfirmModal({ show: false, id: null, name: null });
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Grid size={28} color="#3b82f6" /> 
          Configuración de Mesas (Salón)
        </h2>
        <button 
          onClick={openCreateModal} 
          style={{ background: '#3b82f6', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
          <Plus size={20} /> Nueva Mesa
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
        {tables.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#1e293b', borderRadius: '16px', border: '1px dashed #334155' }}>
            No hay mesas registradas.
          </div>
        )}
        
        {tables.map(table => (
          <div key={table.id} style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden', position: 'relative' }}>
            <div style={{ padding: '25px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', border: '2px solid #3b82f6' }}>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{table.id}</span>
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '20px', color: '#fff', marginBottom: '20px' }}>{table.name}</div>
              
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button 
                  onClick={() => openEditModal(table)}
                  style={{ flex: 1, padding: '8px', background: '#334155', border: 'none', borderRadius: '8px', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                >
                  <Edit2 size={16} /> Editar
                </button>
                <button 
                  onClick={() => requestDeleteTable(table)}
                  style={{ flex: 1, padding: '8px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                >
                  <Trash2 size={16} /> Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear/Editar Mesa */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', width: '400px', borderRadius: '16px', padding: '25px', border: '1px solid #334155' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Grid size={24} color="#3b82f6" /> {editingTableId ? 'Editar Mesa' : 'Nueva Mesa'}
            </h3>
            
            {error && <div style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '14px' }}>Nombre o Número de Mesa</label>
              <input 
                type="text" 
                value={tableName} 
                onChange={e => setTableName(e.target.value)} 
                placeholder="Ej. Mesa 1, Terraza 5"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box', fontSize: '16px' }}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveTable()}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: '#334155', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Cancelar
              </button>
              <button 
                onClick={handleSaveTable} 
                disabled={!tableName.trim()}
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  background: !tableName.trim() ? '#334155' : '#3b82f6', 
                  border: 'none', 
                  color: !tableName.trim() ? '#94a3b8' : 'white', 
                  borderRadius: '8px', 
                  cursor: !tableName.trim() ? 'not-allowed' : 'pointer', 
                  fontWeight: 'bold' 
                }}>
                {editingTableId ? 'Guardar Cambios' : 'Crear Mesa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar Mesa */}
      {confirmModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', width: '400px', borderRadius: '16px', padding: '25px', border: '1px solid #334155', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#fff' }}>¿Estás seguro?</h3>
            <p style={{ color: '#94a3b8', marginBottom: '25px', lineHeight: '1.5' }}>
              Estás a punto de eliminar la mesa: <br/>
              <strong style={{ color: '#ef4444', fontSize: '18px' }}>{confirmModal.name}</strong><br/><br/>
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setConfirmModal({ show: false, id: null, name: null })} 
                style={{ flex: 1, padding: '12px', background: '#334155', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteTable} 
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
