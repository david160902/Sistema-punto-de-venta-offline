import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError('El PIN debe ser de 4 dígitos');
      return;
    }

    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/pos/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, role: 'ADMIN' })
      });
      const data = await res.json();
      
      if (data.success) {
        // Guardamos en sesión que el admin está logueado
        localStorage.setItem('token', 'true');
        navigate('/dashboard');
      } else {
        setError('PIN Incorrecto');
        setPin('');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      backgroundColor: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>
      <div style={{
        background: '#1e293b',
        padding: '50px',
        borderRadius: '24px',
        border: '1px solid #334155',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        width: '400px',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', color: '#f59e0b' }}>
          <ShieldCheck size={64} />
        </div>
        
        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '10px' }}>Acceso Administrativo</h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '30px' }}>
          Ingresa tu PIN Maestro para acceder al panel de control central.
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <ShieldAlert size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <input 
            type="password"
            value={pin}
            onChange={(e) => {
              if (e.target.value.length <= 4 && /^[0-9]*$/.test(e.target.value)) {
                setPin(e.target.value);
                setError('');
              }
            }}
            placeholder="****"
            style={{
              width: '100%',
              padding: '20px',
              fontSize: '32px',
              textAlign: 'center',
              letterSpacing: '15px',
              borderRadius: '12px',
              border: '2px solid #334155',
              background: '#020617',
              color: 'white',
              marginBottom: '20px',
              outline: 'none',
              fontFamily: 'monospace'
            }}
            autoFocus
          />
          <button 
            type="submit"
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '18px',
              fontWeight: 'bold',
              background: '#f59e0b',
              color: 'black',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'transform 0.1s'
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Entrar al Panel
          </button>
        </form>
      </div>
    </div>
  );
}
