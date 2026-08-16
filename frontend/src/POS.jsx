import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Utensils, LogOut, UserCircle, CheckCircle2, Grid, Bike, ShoppingBag, ArrowLeft, Plus } from 'lucide-react';
import LockScreen from './LockScreen';

export default function POS() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [extrasList, setExtrasList] = useState([]);
  const [extraOptionsList, setExtraOptionsList] = useState([]);
  const [discountsList, setDiscountsList] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  
  // VISTA PRINCIPAL (Salón / Mesas / Delivery)
  const [activeTarget, setActiveTarget] = useState(null); // null = Home
  const [tables, setTables] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectingDriver, setSelectingDriver] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCheckout, setIsCheckout] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [editingCartId, setEditingCartId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [itemQty, setItemQty] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [isTakeaway, setIsTakeaway] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedDiscountId, setSelectedDiscountId] = useState('');

  // Inicialización (Menú estático)
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
      .catch(err => console.error("Error Menu:", err));
      
    fetch(`http://${window.location.hostname}:3000/api/pos/payment-methods`)
      .then(res => res.json())
      .then(data => {
        setPaymentMethods(data || []);
        if(data && data.length > 0) setPaymentMethod(data[0].name);
      });
  }, []);

  // Cargar mesas y motorizados cada vez que volvemos al Home
  useEffect(() => {
    let interval;
    if (!activeTarget) {
      loadHomeData();
      interval = setInterval(loadHomeData, 5000); // Actualización en tiempo real (cada 5s)
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTarget]);

  const loadHomeData = () => {
    fetch(`http://${window.location.hostname}:3000/api/pos/active-tables`)
      .then(res => res.json())
      .then(data => setTables(data || []));
      
    fetch(`http://${window.location.hostname}:3000/api/pos/drivers`)
      .then(res => res.json())
      .then(data => setDrivers(data || []));
  };

  const handleTargetSelect = (target) => {
    setCart([]);
    setCurrentOrderId(null);
    setCustomerName('');
    setCustomerPhone('');
    setSelectedDiscountId('');
    
    if (target.current_order) {
      // Cargar orden existente
      setCurrentOrderId(target.current_order.id);
      fetch(`http://${window.location.hostname}:3000/api/pos/order/${target.current_order.id}`)
        .then(res => res.json())
        .then(order => {
          if (order.items) {
            const mappedItems = order.items.map(i => ({
              cartId: Math.random().toString(36).substr(2, 9),
              id: i.product_id,
              name: i.name,
              price: i.unit_price,
              qty: i.quantity,
              notes_raw: (i.notes || '').replace(' | PARA LLEVAR', '').replace('PARA LLEVAR', '').trim(),
              extras: [], // Simplificación por ahora
              isTakeaway: i.notes ? i.notes.includes('PARA LLEVAR') : false,
              notes: i.notes || ''
            }));
            setCart(mappedItems);
          }
        });
    }
    setActiveTarget(target);
  };

  const handleProductClick = (product) => {
    const existingIndex = cart.findIndex(item => 
      item.id === product.id && 
      (!item.notes_raw || item.notes_raw === '') && 
      (!item.extras || item.extras.length === 0)
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].qty += 1;
      setCart(newCart);
    } else {
      const newItem = {
        cartId: Date.now(),
        id: product.id,
        name: product.name,
        price: product.price,
        qty: 1,
        notes_raw: '',
        extras: [],
        isTakeaway: false,
        notes: ''
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
      setIsTakeaway(cartItem.isTakeaway || false);
    }
  };

  const confirmEditItem = () => {
    if (!selectedProduct) return;
    const extrasTotal = selectedExtras.reduce((sum, ext) => sum + ext.price, 0);
    const unitPrice = selectedProduct.price + extrasTotal;
    let finalNotes = itemNotes;
    if (selectedExtras.length > 0) {
      const extraNames = selectedExtras.map(e => `+ ${e.name}`).join(', ');
      finalNotes = finalNotes ? `${finalNotes} | ${extraNames}` : extraNames;
    }
    if (isTakeaway) {
      finalNotes = finalNotes ? `${finalNotes} | PARA LLEVAR` : 'PARA LLEVAR';
    }
    const updatedItem = {
      cartId: editingCartId,
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: unitPrice,
      qty: itemQty,
      notes_raw: itemNotes,
      extras: selectedExtras,
      isTakeaway: isTakeaway,
      notes: finalNotes
    };
    setCart(cart.map(item => item.cartId === editingCartId ? updatedItem : item));
    setSelectedProduct(null);
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

  const removeFromCart = (cartId) => setCart(cart.filter(item => item.cartId !== cartId));

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  let discountAmount = 0;
  if (selectedDiscountId) {
    const d = discountsList.find(x => x.id.toString() === selectedDiscountId);
    if (d) {
      if (d.type === 'PERCENTAGE') discountAmount = cartSubtotal * (d.value / 100);
      else discountAmount = d.value;
    }
  }
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);

  const saveOrder = async (status) => {
    const payload = {
      order_id: currentOrderId,
      order_type: activeTarget.type, // LOCAL, DELIVERY, PARA_LLEVAR
      payment_method: status === 'ABIERTA' ? null : paymentMethod,
      total: cartTotal,
      user_id: loggedInUser?.id,
      driver_id: activeTarget.type === 'DELIVERY' ? activeTarget.id : null,
      table_id: activeTarget.type === 'LOCAL' ? activeTarget.id : null,
      customer_name: customerName,
      customer_phone: customerPhone,
      status: status,
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
        setSuccessMessage(data.message + `\nTicket N° ${String(data.ticket_number).padStart(4, '0')}`);
        setTimeout(() => {
          setSuccessMessage('');
          setIsCheckout(false);
          setActiveTarget(null); // Volver al Home
        }, 2000);
      } else {
        setSuccessMessage("Error: " + data.error);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (e) {
      setSuccessMessage("Error de conexión con la PC Central.");
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  if (!loggedInUser) {
    return <LockScreen onLogin={(user) => setLoggedInUser(user)} />;
  }

  // ===== VISTA 1: SALÓN Y MOTORIZADOS (HOME) =====
  if (!activeTarget) {
    return (
      <div className="pos-container pos-container-home">
        <style>{`
          @media (max-width: 768px) {
            .mesas-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; }
            .mesa-btn-container { padding: 10px 4px !important; }
            .mesa-btn-title { font-size: 13px !important; }
            .motorizados-panel { min-width: 100px !important; padding: 10px !important; }
            .mesas-panel { padding: 10px !important; }
          }
          @media (max-width: 1024px) and (orientation: landscape) {
            .mesas-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 10px !important; }
            .mesa-btn-title { font-size: 15px !important; }
            .motorizados-panel { min-width: 150px !important; flex: 1 !important; width: auto !important; }
            .mesas-panel { flex: 3 !important; width: auto !important; }
            .salon-container { flex-direction: row !important; }
          }
        `}</style>
        <div className="sticky-header-container" style={{ position: 'static', paddingBottom: '0px' }}>
          <div className="pos-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="header-title">SALÓN Y PEDIDOS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(245, 158, 11, 0.1)', padding: '8px 15px', borderRadius: '20px', color: '#f59e0b', fontWeight: 'bold' }}>
                <UserCircle size={20} /> <span className="user-badge-text">{loggedInUser.username}</span>
              </div>
              <button onClick={() => setLoggedInUser(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
                <LogOut size={16} /> <span className="logout-btn-text">Bloquear</span>
              </button>
            </div>
          </div>
        </div>

        <div className="salon-container" style={{ paddingTop: '10px', marginTop: '0px' }}>
          {/* Lado Izquierdo: Mesas (LOCAL) */}
          <div className="mesas-panel">
            <h2 style={{ margin: '0 0 10px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}><Grid size={24} color="#3b82f6"/> Mesas (Salón)</h2>
            <div className="mesas-grid">
              {tables.map(t => {
                const isOccupied = !!t.current_order;
                return (
                  <button 
                    key={t.id} 
                    className="mesa-btn-container"
                    onClick={() => handleTargetSelect({ type: 'LOCAL', id: t.id, name: t.name, current_order: t.current_order })}
                    style={{ 
                      background: isOccupied ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      border: `2px solid ${isOccupied ? '#ef4444' : '#10b981'}`,
                      borderRadius: '12px',  color: 'white', cursor: 'pointer',
                      
                    }}>
                    <div className="mesa-btn-title" style={{ fontSize: '20px', fontWeight: 'bold' }}>{t.name}</div>
                    <div className="mesa-btn-subtitle" style={{ fontSize: '12px', marginTop: '5px', color: isOccupied ? '#fca5a5' : '#6ee7b7' }}>
                      {isOccupied ? `S/ ${t.current_order.total.toFixed(2)}` : 'Disponible'}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Lado Derecho: Motorizados */}
          <div className="motorizados-panel" style={{ background: '#1e293b', borderRadius: '16px', padding: '15px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}><Bike size={20} color="#f59e0b"/> Motorizados</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
              {drivers.map(d => {
                const hasOrders = d.current_orders && d.current_orders.length > 0;
                return (
                  <button 
                    key={d.id}
                    onClick={() => {
                      if (hasOrders) {
                        setSelectingDriver(d);
                      } else {
                        handleTargetSelect({ type: 'DELIVERY', id: d.id, name: d.name, current_order: null });
                      }
                    }}
                    style={{ 
                      background: hasOrders ? 'rgba(239, 68, 68, 0.1)' : '#0f172a', 
                      border: `1px solid ${hasOrders ? '#ef4444' : '#334155'}`, 
                      padding: '12px 10px', borderRadius: '10px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '5px', fontWeight: 'bold', width: '100%' 
                    }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1}}>
                      <Bike size={18} color={hasOrders ? "#fca5a5" : "#94a3b8"} style={{flexShrink: 0}}/> 
                      <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{d.name}</span>
                    </div>
                    {hasOrders && <span style={{background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', flexShrink: 0}}>{d.current_orders.length}</span>}
                  </button>
                )
              })}
              {drivers.length === 0 && <div style={{color:'#64748b', fontSize:'14px', textAlign:'center'}}>No hay motorizados activos</div>}
            </div>
          </div>
        </div>
        
        {/* MODAL: SELECCIONAR PEDIDO DE MOTORIZADO */}
        {selectingDriver && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
              <div className="modal-title">Pedidos de {selectingDriver.name}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                <button 
                  onClick={() => {
                    handleTargetSelect({ type: 'DELIVERY', id: selectingDriver.id, name: selectingDriver.name, current_order: null });
                    setSelectingDriver(null);
                  }}
                  style={{ background: '#f59e0b', border: 'none', padding: '15px', borderRadius: '10px', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                  <Plus size={20} /> NUEVO PEDIDO
                </button>
                <div style={{ borderBottom: '1px solid #334155', margin: '10px 0' }}></div>
                {selectingDriver.current_orders.map(o => (
                  <button
                    key={o.id}
                    onClick={() => {
                      handleTargetSelect({ type: 'DELIVERY', id: selectingDriver.id, name: selectingDriver.name, current_order: o });
                      setSelectingDriver(null);
                    }}
                    style={{ background: '#1e293b', border: '1px solid #3b82f6', padding: '15px', borderRadius: '10px', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Ticket #{String(o.ticket_number).padStart(4, '0')}</span>
                    <span style={{ color: '#6ee7b7' }}>S/ {o.total.toFixed(2)}</span>
                  </button>
                ))}
              </div>
              <div className="btn-group" style={{ marginTop: '20px' }}>
                <button className="btn-cancel" onClick={() => setSelectingDriver(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== VISTA 2: MENÚ Y CARRITO =====
  return (
    <div className="pos-container">
      <div className="menu-section">
        <div className="sticky-header-container">
          <div className="pos-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button 
                onClick={() => setActiveTarget(null)}
                style={{ background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                <ArrowLeft size={18}/> Volver al Salón
              </button>
              <div className="header-title" style={{ color: '#38bdf8', fontSize: '18px' }}>Atendiendo: {activeTarget.name}</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(245, 158, 11, 0.1)', padding: '8px 15px', borderRadius: '20px', color: '#f59e0b', fontWeight: 'bold' }}>
                <UserCircle size={20} /> <span className="user-badge-text">{loggedInUser.username}</span>
              </div>
            </div>
          </div>
          
          <div className="categories-scroll">
            {categories.map(c => (
              <button key={c.id} className={`cat-btn ${activeCategory === c.id ? 'active' : ''}`} onClick={() => setActiveCategory(c.id)}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="products-grid">
          {products.filter(p => p.category_id === activeCategory).map(p => (
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

      <div className="cart-section">
        <div className="cart-header">
          <div className="cart-title">Orden - {activeTarget.name}</div>
          <ShoppingCart size={28} color="#f59e0b"/>
        </div>

        <div className="cart-items">
          {cart.length === 0 && <div style={{textAlign:'center', color:'#94a3b8', margin: 'auto', fontSize: '18px'}}>La orden está vacía.</div>}
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
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            {currentOrderId ? (
              <>
                <button 
                  style={{ flex: 1, padding: '15px', borderRadius: '12px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', opacity: cart.length === 0 ? 0.5 : 1 }}
                  disabled={cart.length === 0}
                  onClick={() => saveOrder('ABIERTA')}
                >
                  ACTUALIZAR
                </button>
                <button 
                  style={{ flex: 1, padding: '15px', borderRadius: '12px', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', opacity: cart.length === 0 ? 0.5 : 1 }}
                  disabled={cart.length === 0}
                  onClick={() => setIsCheckout(true)}
                >
                  COBRAR
                </button>
              </>
            ) : (
              <button 
                style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', opacity: cart.length === 0 ? 0.5 : 1 }}
                disabled={cart.length === 0}
                onClick={() => saveOrder('ABIERTA')}
              >
                ORDENAR
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL EDICIÓN... */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '600px' }}>
            <div className="modal-title">{selectedProduct.name}</div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #334155' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Cantidad</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button onClick={() => setItemQty(Math.max(1, itemQty - 1))} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#334155', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>-</button>
                <span style={{ fontSize: '24px', fontWeight: '900', width: '30px', textAlign: 'center' }}>{itemQty}</span>
                <button onClick={() => setItemQty(itemQty + 1)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#10b981', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>+</button>
              </div>
            </div>

            {extrasList.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#94a3b8' }}>Extras Adicionales</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                  {extraOptionsList.map(opt => {
                    const isSelected = selectedExtras.find(e => e.id === opt.id);
                    return (
                      <button key={opt.id} onClick={() => toggleExtra(opt)} style={{ padding: '10px 15px', borderRadius: '10px', border: `2px solid ${isSelected ? '#f59e0b' : '#334155'}`, background: isSelected ? 'rgba(245, 158, 11, 0.1)' : '#1e293b', color: isSelected ? '#f59e0b' : 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                        {opt.name} (+S/{opt.price.toFixed(2)})
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="select-group" style={{ marginTop: '15px' }}>
              <label>Indicaciones (Ej. Sin cebolla)</label>
              <input type="text" className="form-input" placeholder="Escribe aquí las notas..." value={itemNotes} onChange={e => setItemNotes(e.target.value)} />
            </div>

            <div style={{ marginTop: '15px' }}>
              <button 
                onClick={() => setIsTakeaway(!isTakeaway)}
                style={{
                  width: '100%', padding: '15px', borderRadius: '10px',
                  background: isTakeaway ? '#f59e0b' : '#334155',
                  color: 'white', fontWeight: 'bold', fontSize: '16px',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                }}>
                <ShoppingBag size={20} />
                {isTakeaway ? 'MARCADO PARA LLEVAR' : 'EMPACAR PARA LLEVAR'}
              </button>
            </div>

            <div className="btn-group" style={{ marginTop: '30px' }}>
              <button className="btn-cancel" onClick={() => { setSelectedProduct(null); setEditingCartId(null); }}>Cancelar</button>
              <button className="btn-confirm" onClick={confirmEditItem}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHECKOUT */}
      {isCheckout && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">Finalizar Venta</div>

            <div className="select-group">
              <label>Con qué está pagando?</label>
              <select className="form-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                {paymentMethods.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="select-group">
              <label>Aplicar Descuento Especial</label>
              <select className="form-select" value={selectedDiscountId} onChange={e => setSelectedDiscountId(e.target.value)}>
                <option value="">Sin Descuento</option>
                {discountsList.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.type === 'PERCENTAGE' ? `${d.value}%` : `-S/${d.value}`})</option>
                ))}
              </select>
            </div>

            <div className="total-row" style={{marginTop:'15px'}}>
              <span>A Cobrar:</span>
              <span style={{color: '#10b981'}}>S/ {cartTotal.toFixed(2)}</span>
            </div>

            <div className="btn-group">
              <button className="btn-cancel" onClick={() => setIsCheckout(false)}>Cancelar</button>
              <button className="btn-confirm" onClick={() => saveOrder('PAGADA')}>COBRAR E IMPRIMIR</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ÉXITO */}
      {successMessage && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div style={{ background: '#1e293b', padding: '40px', borderRadius: '24px', border: '2px solid #10b981', textAlign: 'center', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ color: '#10b981', marginBottom: '15px' }}><CheckCircle2 size={64} /></div>
            <h2 style={{ fontSize: '24px', whiteSpace: 'pre-line' }}>{successMessage}</h2>
          </div>
        </div>
      )}
    </div>
  );
}
