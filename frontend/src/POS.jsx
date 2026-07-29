import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Utensils, LogOut, UserCircle, CheckCircle2 } from 'lucide-react';
import LockScreen from './LockScreen';

export default function POS() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [extrasList, setExtrasList] = useState([]);
  const [extraOptionsList, setExtraOptionsList] = useState([]);
  const [discountsList, setDiscountsList] = useState([]);
  
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCheckout, setIsCheckout] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estado para el Modal de Edición de Producto (ahora se abre desde el carrito)
  const [editingCartId, setEditingCartId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [itemQty, setItemQty] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  const [selectedExtras, setSelectedExtras] = useState([]);
  
  // Estados para Finalizar Venta
  const [orderType, setOrderType] = useState('LOCAL');
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Cargar Menú desde el Backend (PC Central)
  useEffect(() => {
    fetch(`http://${window.location.hostname}:3000/api/pos/menu`)
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories || []);
        setProducts(data.products || []);
        setExtrasList(data.extras || []);
        setExtraOptionsList(data.extra_options || []);
        setDiscountsList(data.discounts || []);
        if (data.categories?.length > 0) setActiveCategory(data.categories[0].id);
      })
      .catch(err => console.error("Error conectando con la PC Central:", err));
  }, []);

  const handleProductClick = (product) => {
    // Buscar si ya existe en el carrito SIN notas ni extras
    const existingIndex = cart.findIndex(item => 
      item.id === product.id && 
      (!item.notes_raw || item.notes_raw === '') && 
      (!item.extras || item.extras.length === 0)
    );

    if (existingIndex >= 0) {
      // Sumar cantidad
      const newCart = [...cart];
      newCart[existingIndex].qty += 1;
      setCart(newCart);
    } else {
      // Agregar nuevo
      const newItem = {
        cartId: Date.now(),
        id: product.id,
        name: product.name,
        price: product.price, // Precio base
        qty: 1,
        notes_raw: '', // Notas escritas por el usuario
        extras: [], // Array de extras
        notes: '' // Notas formateadas para mostrar
      };
      setCart([...cart, newItem]);
    }
  };

  const openEditModal = (cartItem) => {
    const prod = products.find(p => p.id === cartItem.id);
    if (prod) {
      setEditingCartId(cartItem.cartId);
      setSelectedProduct(prod);
      setItemQty(cartItem.qty);
      setItemNotes(cartItem.notes_raw || '');
      setSelectedExtras(cartItem.extras || []);
    }
  };

  const confirmEditItem = () => {
    if (!selectedProduct) return;

    // Calcular precio extra
    const extrasTotal = selectedExtras.reduce((sum, ext) => sum + ext.price, 0);
    const unitPrice = selectedProduct.price + extrasTotal;

    // Formatear notas con extras para visualización
    let finalNotes = itemNotes;
    if (selectedExtras.length > 0) {
      const extraNames = selectedExtras.map(e => `+ ${e.name}`).join(', ');
      finalNotes = finalNotes ? `${finalNotes} | ${extraNames}` : extraNames;
    }

    const updatedItem = {
      cartId: editingCartId,
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: unitPrice,
      qty: itemQty,
      notes_raw: itemNotes,
      extras: selectedExtras,
      notes: finalNotes
    };
    
    setCart(cart.map(item => item.cartId === editingCartId ? updatedItem : item));
    setSelectedProduct(null); // Cerrar modal
    setEditingCartId(null);
  };

  const toggleExtra = (option) => {
    const exists = selectedExtras.find(e => e.id === option.id);
    if (exists) {
      setSelectedExtras(selectedExtras.filter(e => e.id !== option.id));
    } else {
      setSelectedExtras([...selectedExtras, option]);
    }
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const [selectedDiscountId, setSelectedDiscountId] = useState('');

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  // Calcular Descuento Global
  let discountAmount = 0;
  if (selectedDiscountId) {
    const d = discountsList.find(x => x.id.toString() === selectedDiscountId);
    if (d) {
      if (d.type === 'PERCENTAGE') discountAmount = cartSubtotal * (d.value / 100);
      else discountAmount = d.value;
    }
  }
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);

  const handleCheckout = async () => {
    const payload = {
      order_type: orderType,
      payment_method: paymentMethod,
      total: cartTotal,
      user_id: loggedInUser?.id, // Enviamos quién hizo la venta
      driver_id: null,
      customer_name: customerName,
      customer_phone: customerPhone,
      items: cart
    };

    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/pos/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`¡Orden enviada a cocina!\nTicket N° ${String(data.ticket_number).padStart(4, '0')}`);
        setCart([]); // Limpiar bolsa
        setIsCheckout(false); // Cerrar ventana
        
        // Ocultar mensaje después de 3 segundos
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setSuccessMessage("Error: " + data.error);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (e) {
      setSuccessMessage("Error de conexión con la PC Central.");
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const displayProducts = products.filter(p => p.category_id === activeCategory);

  // Si no hay usuario logueado, mostrar Pantalla de Bloqueo
  if (!loggedInUser) {
    return <LockScreen onLogin={(user) => setLoggedInUser(user)} />;
  }

  return (
    <div className="pos-container">
      {/* SECCIÓN IZQUIERDA: MENÚ Y PLATOS */}
      <div className="menu-section">
        <div className="sticky-header-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="header-title">CHIFERÍA POS</div>
          
          {/* Indicador de Usuario y Botón de Salir */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(245, 158, 11, 0.1)', padding: '8px 15px', borderRadius: '20px', color: '#f59e0b', fontWeight: 'bold' }}>
              <UserCircle size={20} />
              {loggedInUser.username}
            </div>
            <button 
              onClick={() => setLoggedInUser(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}
            >
              <LogOut size={16} /> Bloquear
            </button>
          </div>
        </div>
        
        {/* Categorías Slider */}
        <div className="categories-scroll">
          {categories.map(c => (
            <button 
              key={c.id} 
              className={`cat-btn ${activeCategory === c.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Cuadrícula de Platos */}
        <div className="products-grid">
          {displayProducts.map(p => (
            <div key={p.id} className="product-card" onClick={() => handleProductClick(p)}>
              {p.image_url ? (
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundImage: p.image_url.startsWith('http') ? `url("${p.image_url}")` : `url("http://${window.location.hostname}:3000${p.image_url}")`, backgroundSize: 'cover', backgroundPosition: 'center', border: `3px solid ${p.bg_color || '#334155'}` }}></div>
              ) : (
                <div className="product-icon" style={{ background: p.bg_color || '#334155' }}><Utensils size={36} color="#fff" /></div>
              )}
              <div className="product-name">{p.name}</div>
              <div className="product-price">S/ {p.price.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN DERECHA: LA BOLSA DE COMPRA */}
      <div className="cart-section">
        <div className="cart-header">
          <div className="cart-title">Ticket Actual</div>
          <ShoppingCart size={28} color="#f59e0b"/>
        </div>

        <div className="cart-items">
          {cart.length === 0 && <div style={{textAlign:'center', color:'#94a3b8', marginTop:'80px', fontSize: '18px'}}>La orden está vacía.<br/>Toca un plato para agregarlo.</div>}
          
          {cart.map(item => (
            <div key={item.cartId} className="cart-item" style={{ cursor: 'pointer' }} onClick={() => openEditModal(item)}>
              <div className="item-info">
                <div className="item-qty-name">{item.qty}x {item.name}</div>
                {item.notes && <div className="item-notes">*{item.notes}</div>}
              </div>
              <div className="item-price">S/ {(item.price * item.qty).toFixed(2)}</div>
              <button className="del-btn" onClick={(e) => { e.stopPropagation(); removeFromCart(item.cartId); }}>
                <Trash2 size={24} />
              </button>
            </div>
          ))}
        </div>

        <div className="cart-footer">
          <div className="total-row" style={{ fontSize: '20px', color: '#94a3b8' }}>
            <span>Subtotal:</span>
            <span>S/ {cartSubtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="total-row" style={{ fontSize: '18px', color: '#ef4444' }}>
              <span>Descuento:</span>
              <span>- S/ {discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="total-row" style={{ marginTop: '10px' }}>
            <span>Total:</span>
            <span style={{color: '#f59e0b'}}>S/ {cartTotal.toFixed(2)}</span>
          </div>
          <button 
            className="checkout-btn" 
            disabled={cart.length === 0}
            onClick={() => setIsCheckout(true)}
          >
            COBRAR E IMPRIMIR
          </button>
        </div>
      </div>

      {/* MODAL: OPCIONES DEL PRODUCTO (CANTIDAD, NOTAS, EXTRAS) */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '600px' }}>
            <div className="modal-title">{selectedProduct.name}</div>
            
            {/* Controles de Cantidad */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #334155' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Cantidad</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button 
                  onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#334155', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}
                >-</button>
                <span style={{ fontSize: '24px', fontWeight: '900', width: '30px', textAlign: 'center' }}>{itemQty}</span>
                <button 
                  onClick={() => setItemQty(itemQty + 1)}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#10b981', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}
                >+</button>
              </div>
            </div>

            {/* Extras Disponibles */}
            {extrasList.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#94a3b8' }}>Extras Adicionales</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                  {extraOptionsList.map(opt => {
                    const isSelected = selectedExtras.find(e => e.id === opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleExtra(opt)}
                        style={{
                          padding: '10px 15px',
                          borderRadius: '10px',
                          border: `2px solid ${isSelected ? '#f59e0b' : '#334155'}`,
                          background: isSelected ? 'rgba(245, 158, 11, 0.1)' : '#1e293b',
                          color: isSelected ? '#f59e0b' : 'white',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          transition: '0.2s'
                        }}
                      >
                        {opt.name} (+S/{opt.price.toFixed(2)})
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Notas / Indicaciones */}
            <div className="select-group" style={{ marginTop: '15px' }}>
              <label>Indicaciones (Ej. Sin cebolla)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Escribe aquí las notas para cocina..." 
                value={itemNotes} 
                onChange={e => setItemNotes(e.target.value)} 
              />
            </div>

            <div className="btn-group" style={{ marginTop: '30px' }}>
              <button className="btn-cancel" onClick={() => { setSelectedProduct(null); setEditingCartId(null); }}>Cancelar</button>
              <button className="btn-confirm" onClick={confirmEditItem}>
                Guardar S/ {((selectedProduct.price + selectedExtras.reduce((s,e)=>s+e.price,0)) * itemQty).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VENTANA EMERGENTE: FINALIZAR COBRO */}
      {isCheckout && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">Finalizar Venta</div>
            
            <div className="select-group">
              <label>Modo de Atención</label>
              <select className="form-select" value={orderType} onChange={e => setOrderType(e.target.value)}>
                <option value="LOCAL">Local / Mostrador</option>
                <option value="DELIVERY">Delivery</option>
              </select>
            </div>

            {orderType === 'DELIVERY' && (
              <>
                <div className="select-group">
                  <label>Celular del Cliente</label>
                  <input type="text" className="form-input" placeholder="Ej: 999 888 777" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} />
                </div>
                <div className="select-group">
                  <label>Nombre</label>
                  <input type="text" className="form-input" placeholder="Juan Pérez" value={customerName} onChange={e=>setCustomerName(e.target.value)} />
                </div>
              </>
            )}

            <div className="select-group">
              <label>Con qué está pagando?</label>
              <select className="form-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="EFECTIVO">Efectivo</option>
                <option value="YAPE">Yape / Plin</option>
                <option value="TARJETA">Tarjeta (POS)</option>
                <option value="MIXTO">Pago Mixto</option>
              </select>
            </div>

            <div className="select-group">
              <label>Aplicar Descuento Especial</label>
              <select className="form-select" value={selectedDiscountId} onChange={e => setSelectedDiscountId(e.target.value)}>
                <option value="">Sin Descuento</option>
                {discountsList.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.type === 'PERCENTAGE' ? `${d.value}%` : `-S/${d.value}`})
                  </option>
                ))}
              </select>
            </div>

            <div className="total-row" style={{marginTop:'15px'}}>
              <span>A Cobrar:</span>
              <span style={{color: '#10b981'}}>S/ {cartTotal.toFixed(2)}</span>
            </div>

            <div className="btn-group">
              <button className="btn-cancel" onClick={() => setIsCheckout(false)}>Cancelar</button>
              <button className="btn-confirm" onClick={handleCheckout}>CONFIRMAR E IMPRIMIR</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ÉXITO (Reemplazo del Alert) */}
      {successMessage && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div style={{
            background: '#1e293b',
            padding: '40px',
            borderRadius: '24px',
            border: '2px solid #10b981',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
            color: 'white',
            maxWidth: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{ color: '#10b981', marginBottom: '15px' }}>
              <CheckCircle2 size={64} />
            </div>
            <h2 style={{ fontSize: '24px', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
              {successMessage}
            </h2>
          </div>
        </div>
      )}
    </div>
  );
}
