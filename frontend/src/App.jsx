import React from 'react';
import POS from './POS';
import AdminLayout from './AdminLayout';
import Dashboard from './Dashboard';
import ProductsAdmin from './ProductsAdmin';
import StaffAdmin from './StaffAdmin';
import SettingsAdmin from './SettingsAdmin';
import AdminLogin from './AdminLogin';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas / Sin Autenticación Global (Cada una maneja su propia seguridad interna) */}
        <Route path="/login" element={<AdminLogin />} />
        
        {/* Ruta para los cajeros/meseros: Solo pantalla completa de ventas (Tiene su propio candado de cajero) */}
        <Route path="/cajero" element={<POS />} />

        {/* Ruta para la PC Central: Con panel lateral de administrador */}
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="productos" element={<ProductsAdmin />} />
          <Route path="personal" element={<StaffAdmin />} />
          <Route path="configuracion" element={<SettingsAdmin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
