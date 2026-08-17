const fs = require('fs');
let code = fs.readFileSync('../frontend/src/Dashboard.jsx', 'utf8');

// 1. Add shifts state
const statePattern = `  const [orders, setOrders] = useState([]);`;
code = code.replace(statePattern, `  const [orders, setOrders] = useState([]);\n  const [shifts, setShifts] = useState([]);`);

// 2. Fetch shifts in loadData
const fetchPattern = `        if (data.workers) setWorkers(data.workers);`;
const fetchReplacement = `        if (data.workers) setWorkers(data.workers);
        
        fetch(\`http://\${window.location.hostname}:3000/api/pos/shifts\`)
          .then(res => res.json())
          .then(shiftsData => setShifts(shiftsData || []))
          .catch(console.error);`;
code = code.replace(fetchPattern, fetchReplacement);

// 3. Add the new tab button
const tabPattern = `          <button
            onClick={() => setActiveTab('historial')}
            style={{
              padding: '12px 25px', borderRadius: '12px', border: 'none', fontWeight: '800', fontSize: '16px', cursor: 'pointer', transition: '0.2s',
              background: activeTab === 'historial' ? '#3b82f6' : '#1e293b',
              color: activeTab === 'historial' ? '#fff' : '#94a3b8',
            }}
          >
            Historial de Recibos
          </button>`;
const newTabs = `          <button
            onClick={() => setActiveTab('historial')}
            style={{
              padding: '12px 25px', borderRadius: '12px', border: 'none', fontWeight: '800', fontSize: '16px', cursor: 'pointer', transition: '0.2s',
              background: activeTab === 'historial' ? '#3b82f6' : '#1e293b',
              color: activeTab === 'historial' ? '#fff' : '#94a3b8',
            }}
          >
            Historial de Recibos
          </button>
          <button
            onClick={() => setActiveTab('turnos')}
            style={{
              padding: '12px 25px', borderRadius: '12px', border: 'none', fontWeight: '800', fontSize: '16px', cursor: 'pointer', transition: '0.2s',
              background: activeTab === 'turnos' ? '#10b981' : '#1e293b',
              color: activeTab === 'turnos' ? '#fff' : '#94a3b8',
            }}
          >
            Arqueos y Turnos
          </button>`;
code = code.replace(tabPattern, newTabs);

// 4. Render the shifts tab
const renderEndPattern = `      {/* ===== VISTA: MODAL DE DETALLE DE ORDEN ===== */}`;
const shiftsTabRender = `
      {/* ===== VISTA: ARQUEOS Y TURNOS ===== */}
      {activeTab === 'turnos' && (
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wallet size={24} color="#10b981" /> Control de Turnos de Caja (Cortes Z)
          </h2>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '15px 10px' }}>Turno ID</th>
                  <th style={{ padding: '15px 10px' }}>Apertura</th>
                  <th style={{ padding: '15px 10px' }}>Cierre</th>
                  <th style={{ padding: '15px 10px' }}>Cajero</th>
                  <th style={{ padding: '15px 10px' }}>Estado</th>
                  <th style={{ padding: '15px 10px', textAlign: 'right' }}>Fondo Inicial</th>
                  <th style={{ padding: '15px 10px', textAlign: 'right' }}>Esperado</th>
                  <th style={{ padding: '15px 10px', textAlign: 'right' }}>Real</th>
                  <th style={{ padding: '15px 10px', textAlign: 'right' }}>Descuadre</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #334155', transition: 'background 0.2s' }}>
                    <td style={{ padding: '15px 10px', fontWeight: 'bold' }}>#{s.id}</td>
                    <td style={{ padding: '15px 10px' }}>{new Date(s.opened_at).toLocaleString()}</td>
                    <td style={{ padding: '15px 10px', color: s.closed_at ? '#94a3b8' : '#38bdf8' }}>
                      {s.closed_at ? new Date(s.closed_at).toLocaleString() : 'En curso...'}
                    </td>
                    <td style={{ padding: '15px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserCircle size={16} color="#94a3b8" /> {s.worker_name || 'Desconocido'}
                      </div>
                    </td>
                    <td style={{ padding: '15px 10px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                        background: s.status === 'OPEN' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: s.status === 'OPEN' ? '#38bdf8' : '#10b981'
                      }}>
                        {s.status === 'OPEN' ? 'ABIERTO' : 'CERRADO'}
                      </span>
                    </td>
                    <td style={{ padding: '15px 10px', textAlign: 'right', color: '#cbd5e1' }}>S/ {s.starting_cash?.toFixed(2)}</td>
                    <td style={{ padding: '15px 10px', textAlign: 'right', fontWeight: 'bold' }}>S/ {s.expected_cash?.toFixed(2) || '---'}</td>
                    <td style={{ padding: '15px 10px', textAlign: 'right', fontWeight: 'bold' }}>S/ {s.actual_cash?.toFixed(2) || '---'}</td>
                    <td style={{ padding: '15px 10px', textAlign: 'right', fontWeight: 'bold', color: s.difference < 0 ? '#ef4444' : s.difference > 0 ? '#10b981' : '#94a3b8' }}>
                      {s.difference != null ? (s.difference > 0 ? \`+S/ \${s.difference.toFixed(2)}\` : \`S/ \${s.difference.toFixed(2)}\`) : '---'}
                    </td>
                  </tr>
                ))}
                {shifts.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No hay turnos registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== VISTA: MODAL DE DETALLE DE ORDEN ===== */}`;
code = code.replace(renderEndPattern, shiftsTabRender);

// Also need to import Wallet, UserCircle in Dashboard if not present
if (!code.includes('Wallet,')) {
    code = code.replace('import { Activity,', 'import { Activity, Wallet, UserCircle,');
}

fs.writeFileSync('../frontend/src/Dashboard.jsx', code);
console.log('Dashboard updated');
