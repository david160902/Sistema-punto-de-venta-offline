import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, CheckCircle2, Delete } from 'lucide-react';

export default function LockScreen({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [time, setTime] = useState(new Date());

  // Actualizar la hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleKeyPress = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');
      
      // Auto-submit al llegar a 4 dígitos
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setError('');
    }
  };

  const verifyPin = async (code) => {
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/pos/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: code, role: 'CASHIER' })
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.error || 'PIN Incorrecto');
        setTimeout(() => {
          setPin('');
          setError('');
        }, 1000);
      }
    } catch (err) {
      setError('Error de conexión al servidor');
      setTimeout(() => setPin(''), 1000);
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100%',
      backgroundColor: '#020617', // Súper oscuro
      display: 'flex',
      flexDirection: 'row', // Lado a lado para tablets en horizontal
      alignItems: 'center',
      justifyContent: 'space-evenly',
      color: 'white',
      overflow: 'hidden'
    }}>
      {/* Reloj Grande (Izquierda) */}
      <div style={{ textAlign: 'center', flex: 1 }}>
        <h1 style={{ fontSize: '80px', fontWeight: '900', margin: '0', color: '#f8fafc', letterSpacing: '2px' }}>
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </h1>
        <p style={{ fontSize: '24px', color: '#94a3b8', margin: '10px 0 0 0', fontWeight: '500' }}>
          {time.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Pantalla del PIN (Derecha) */}
      <div style={{
        background: '#0f172a',
        padding: '35px',
        borderRadius: '24px',
        border: '1px solid #1e293b',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        width: '380px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginRight: '5%'
      }}>
        <h2 style={{ fontSize: '20px', color: '#cbd5e1', marginBottom: '25px', fontWeight: '600' }}>Ingresa tu PIN</h2>
        
        {/* Puntos (Dots) del PIN */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '35px' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: i < pin.length ? '#10b981' : '#334155',
              transition: 'background 0.2s',
              boxShadow: i < pin.length ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none'
            }} />
          ))}
        </div>

        {error && (
          <div style={{ color: '#ef4444', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={16} /> {error}
          </div>
        )}

        {/* Teclado Numérico */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '15px',
          width: '100%'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              style={{
                padding: '15px 0',
                fontSize: '26px',
                fontWeight: '700',
                background: '#1e293b',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.1s'
              }}
              onMouseDown={e => e.currentTarget.style.background = '#334155'}
              onMouseUp={e => e.currentTarget.style.background = '#1e293b'}
              onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}
            >
              {num}
            </button>
          ))}
          <div /> {/* Espacio vacío abajo a la izquierda */}
          <button
            onClick={() => handleKeyPress('0')}
            style={{
              padding: '15px 0',
              fontSize: '26px',
              fontWeight: '700',
              background: '#1e293b',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.1s'
            }}
            onMouseDown={e => e.currentTarget.style.background = '#334155'}
            onMouseUp={e => e.currentTarget.style.background = '#1e293b'}
            onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}
          >
            0
          </button>
          <button
            onClick={handleDelete}
            style={{
              padding: '15px 0',
              fontSize: '24px',
              fontWeight: '700',
              background: '#334155',
              color: '#f8fafc',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.1s'
            }}
            onMouseDown={e => e.currentTarget.style.background = '#ef4444'}
            onMouseUp={e => e.currentTarget.style.background = '#334155'}
            onMouseLeave={e => e.currentTarget.style.background = '#334155'}
          >
            <Delete size={28} />
          </button>
        </div>
      </div>
    </div>
  );
}
