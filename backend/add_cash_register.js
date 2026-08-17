const fs = require('fs');
let code = fs.readFileSync('../frontend/src/POS.jsx', 'utf8');

// 1. Update imports
code = code.replace(
  "import { ShoppingCart, Trash2, Utensils, LogOut, UserCircle, CheckCircle2, Grid, Bike, ShoppingBag, ArrowLeft, Plus } from 'lucide-react';",
  "import { ShoppingCart, Trash2, Utensils, LogOut, UserCircle, CheckCircle2, Grid, Bike, ShoppingBag, ArrowLeft, Plus, Wallet, Lock, DollarSign } from 'lucide-react';"
);

// 2. Add states
const statesBlock = `  const [activeTarget, setActiveTarget] = useState(null); // null = Home`;
const newStates = `  const [activeTarget, setActiveTarget] = useState(null); // null = Home
  
  // CAJA / TURNOS
  const [currentShift, setCurrentShift] = useState(null);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showTreasuryModal, setShowTreasuryModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  
  // Estados para Modales de Caja
  const [startingCash, setStartingCash] = useState('');
  const [movementType, setMovementType] = useState('PAY_OUT');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [shiftClosingSummary, setShiftClosingSummary] = useState(null);
`;
code = code.replace(statesBlock, newStates);

// 3. Add useEffect to load shift
const useEffectTarget = `  useEffect(() => {
    loadHomeData();`;
const useEffectReplacement = `  useEffect(() => {
    loadCurrentShift();
    loadHomeData();`;
code = code.replace(useEffectTarget, useEffectReplacement);

// 4. Add the loadCurrentShift function
const fetchFunctionsTarget = `  const loadHomeData = () => {`;
const newFunctions = `  const loadCurrentShift = () => {
    fetch(\`http://\${window.location.hostname}:3000/api/pos/shifts/current\`)
      .then(res => res.json())
      .then(data => setCurrentShift(data))
      .catch(err => console.error("Error al cargar turno", err));
  };

  const handleOpenShift = () => {
    fetch(\`http://\${window.location.hostname}:3000/api/pos/shifts/open\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: loggedInUser.id, starting_cash: parseFloat(startingCash) || 0 })
    })
    .then(res => res.json())
    .then(data => {
      if(data.error) alert(data.error);
      else {
        setSuccessMessage('Turno Abierto Exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowOpenShiftModal(false);
        loadCurrentShift();
      }
    });
  };

  const handleTreasuryMovement = () => {
    if(!movementAmount || !movementReason) return alert("Ingrese monto y motivo");
    fetch(\`http://\${window.location.hostname}:3000/api/pos/shifts/movements\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        shift_id: currentShift.id, 
        user_id: loggedInUser.id, 
        type: movementType, 
        amount: parseFloat(movementAmount), 
        reason: movementReason 
      })
    })
    .then(res => res.json())
    .then(data => {
      setSuccessMessage('Movimiento Registrado');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowTreasuryModal(false);
      setMovementAmount('');
      setMovementReason('');
      loadCurrentShift();
    });
  };

  const handleCloseShift = () => {
    if(actualCash === '') return alert("Ingrese el efectivo físico en caja");
    fetch(\`http://\${window.location.hostname}:3000/api/pos/shifts/close\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shift_id: currentShift.id, actual_cash: parseFloat(actualCash) })
    })
    .then(res => res.json())
    .then(data => {
      if(data.error) return alert(data.error);
      setShiftClosingSummary(data);
      setCurrentShift(null);
    });
  };

  const loadHomeData = () => {`;
code = code.replace(fetchFunctionsTarget, newFunctions);

// 5. Add to POS Header row
const headerRowTarget = `<button onClick={() => setLoggedInUser(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
                <LogOut size={16} /> <span className="logout-btn-text">Bloquear</span>
              </button>
            </div>
          </div>
        </div>`;
const newHeaderRow = `<button onClick={() => setShowTreasuryModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
                <Wallet size={16} /> <span className="logout-btn-text">Tesorería</span>
              </button>
              <button onClick={() => setShowCloseShiftModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
                <Lock size={16} /> <span className="logout-btn-text">Cerrar Turno</span>
              </button>
              <button onClick={() => setLoggedInUser(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid #94a3b8', color: '#94a3b8', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
                <LogOut size={16} /> <span className="logout-btn-text">Bloquear</span>
              </button>
            </div>
          </div>
        </div>`;
code = code.replace(headerRowTarget, newHeaderRow);

// 6. Add modals at the end before returning the view
const returnViewTarget = `  // ===== VISTA 1: SALÓN Y MOTORIZADOS (HOME) =====`;

const openShiftModal = `
  // Modal de Apertura de Caja Forzada
  if (loggedInUser && !currentShift && !shiftClosingSummary) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#0f172a', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '40px', borderRadius: '20px', width: '400px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
          <Wallet size={64} color="#38bdf8" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '10px' }}>Apertura de Caja</h2>
          <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Debes abrir un turno para poder registrar ventas.</p>
          
          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            <label style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Fondo de Caja (Sencillo Inicial):</label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '2px solid #334155', borderRadius: '12px', padding: '10px 15px' }}>
              <span style={{ color: '#94a3b8', fontSize: '20px', marginRight: '10px' }}>S/</span>
              <input 
                type="number" 
                value={startingCash} 
                onChange={e => setStartingCash(e.target.value)} 
                placeholder="0.00"
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', width: '100%', outline: 'none', fontWeight: 'bold' }}
                autoFocus
              />
            </div>
          </div>
          
          <button onClick={handleOpenShift} style={{ width: '100%', padding: '15px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)' }}>
            Abrir Turno
          </button>
        </div>
      </div>
    );
  }

  // Modal Reporte de Cierre Z
  if (shiftClosingSummary) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#0f172a', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <CheckCircle2 size={64} color="#10b981" style={{ marginBottom: '15px' }} />
            <h2 style={{ color: '#fff', fontSize: '28px', margin: 0 }}>Turno Cerrado (Corte Z)</h2>
            <p style={{ color: '#94a3b8', margin: '5px 0 0 0' }}>El reporte ha sido guardado exitosamente.</p>
          </div>
          
          <div style={{ background: '#0f172a', borderRadius: '12px', padding: '20px', marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
              <span style={{ color: '#94a3b8', fontSize: '16px' }}>Efectivo Esperado (Teórico):</span>
              <span style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>S/ {shiftClosingSummary.expected_cash.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
              <span style={{ color: '#94a3b8', fontSize: '16px' }}>Efectivo Real (Físico):</span>
              <span style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>S/ {shiftClosingSummary.actual_cash?.toFixed(2) || '0.00'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8', fontSize: '16px' }}>Descuadre:</span>
              <span style={{ color: shiftClosingSummary.difference < 0 ? '#ef4444' : shiftClosingSummary.difference > 0 ? '#10b981' : '#fff', fontSize: '20px', fontWeight: 'bold' }}>
                {shiftClosingSummary.difference > 0 ? '+' : ''}S/ {shiftClosingSummary.difference.toFixed(2)}
              </span>
            </div>
          </div>
          
          <button onClick={() => setShiftClosingSummary(null)} style={{ width: '100%', padding: '15px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            Aceptar y Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  // Modales overlay (Tesoreria y Cerrar)
  const renderModals = () => (
    <>
      {showTreasuryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '16px', width: '400px' }}>
            <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>Gestión de Tesorería</h3>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button onClick={() => setMovementType('PAY_IN')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: movementType === 'PAY_IN' ? '#10b981' : '#334155', color: '#fff' }}>Ingreso (+)</button>
              <button onClick={() => setMovementType('PAY_OUT')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: movementType === 'PAY_OUT' ? '#ef4444' : '#334155', color: '#fff' }}>Salida (-)</button>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Monto (S/):</label>
              <input type="number" value={movementAmount} onChange={e => setMovementAmount(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '16px' }} placeholder="0.00" />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Motivo:</label>
              <input type="text" value={movementReason} onChange={e => setMovementReason(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '16px' }} placeholder={movementType === 'PAY_OUT' ? 'Ej. Compra de hielo' : 'Ej. Sencillo para caja'} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowTreasuryModal(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleTreasuryMovement} style={{ flex: 1, padding: '12px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showCloseShiftModal && currentShift && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '16px', width: '450px' }}>
            <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '5px' }}>Cerrar Turno (Corte Z)</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>Auditoría de Caja. Por favor ingresa el monto total de EFECTIVO físico que tienes en la gaveta.</p>
            
            <div style={{ background: '#0f172a', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#94a3b8', fontSize: '14px' }}>
                <span>Fondo Inicial:</span> <span>S/ {currentShift.starting_cash.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#94a3b8', fontSize: '14px' }}>
                <span>Ventas en Efectivo:</span> <span>S/ {currentShift.totals?.cash_sales.toFixed(2) || '0.00'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#10b981', fontSize: '14px' }}>
                <span>Ingresos (+):</span> <span>S/ {currentShift.totals?.pay_ins.toFixed(2) || '0.00'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', fontSize: '14px' }}>
                <span>Salidas (-):</span> <span>S/ {currentShift.totals?.pay_outs.toFixed(2) || '0.00'}</span>
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ color: '#f8fafc', fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '16px' }}>Efectivo Real (Físico Contado):</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '2px solid #3b82f6', borderRadius: '12px', padding: '10px 15px' }}>
                <span style={{ color: '#3b82f6', fontSize: '20px', marginRight: '10px', fontWeight: 'bold' }}>S/</span>
                <input type="number" value={actualCash} onChange={e => setActualCash(e.target.value)} style={{ width: '100%', padding: '0', background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', fontWeight: 'bold', outline: 'none' }} placeholder="0.00" autoFocus />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowCloseShiftModal(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleCloseShift} style={{ flex: 1, padding: '12px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Confirmar Cierre</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // ===== VISTA 1: SALÓN Y MOTORIZADOS (HOME) =====`;

code = code.replace(returnViewTarget, openShiftModal);

// And inject the renderModals into the main container
const containerTarget = `<div className="pos-container pos-container-home">`;
const newContainer = `<div className="pos-container pos-container-home">
        {renderModals()}`;
code = code.replace(containerTarget, newContainer);

// Also inject renderModals into the activeTarget container (VISTA 2)
const vista2Target = `<div className="pos-container pos-container-order">`;
const newVista2 = `<div className="pos-container pos-container-order">
        {renderModals()}`;
code = code.replace(vista2Target, newVista2);


fs.writeFileSync('../frontend/src/POS.jsx', code);
console.log('Frontend modifications applied.');
