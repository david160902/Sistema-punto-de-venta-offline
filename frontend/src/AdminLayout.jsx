import React from 'react';
import { Outlet, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Settings, Package, Users, LogOut, Grid, CreditCard } from 'lucide-react';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="admin-container">
      <div className="sidebar">
        <div className="sidebar-logo">PC CENTRAL</div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            <LayoutDashboard size={20}/> Resumen
          </Link>
          <Link to="/productos" className={`nav-link ${location.pathname === '/productos' ? 'active' : ''}`}>
            <Package size={20}/> Productos
          </Link>
          <Link to="/mesas" className={`nav-link ${location.pathname === '/mesas' ? 'active' : ''}`}>
            <Grid size={20}/> Mesas
          </Link>
          <Link to="/operaciones" className={`nav-link ${location.pathname === '/operaciones' ? 'active' : ''}`}>
            <CreditCard size={20}/> Métodos de Pago
          </Link>
          <Link to="/personal" className={`nav-link ${location.pathname === '/personal' ? 'active' : ''}`}>
            <Users size={20}/> Personal
          </Link>
          <Link to="/configuracion" className={`nav-link ${location.pathname === '/configuracion' ? 'active' : ''}`}>
            <Settings size={20}/> Configuración
          </Link>
        </nav>
        
        {/* Botón de Cerrar Sesión (Abajo) */}
        <div style={{ marginTop: 'auto', padding: '20px' }}>
          <button 
            onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
            onMouseOver={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}
          >
            <LogOut size={20} /> Salir del Panel
          </button>
        </div>
      </div>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
