import React, { useState, useEffect } from 'react';
import { Activity, Calendar, FileText, Search, User, Filter, Download, ArrowLeft, DollarSign, Receipt, TrendingUp, X, Check, Clock, Star } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('resumen');
  
  const [period, setPeriod] = useState('');
  const [specificMonth, setSpecificMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [specificDate, setSpecificDate] = useState(''); // YYYY-MM-DD
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState({ total_sales: 0, total_tickets: 0, total_pending: 0 });
  const [topProducts, setTopProducts] = useState([]);
  
  // Datos del historial
  const [orders, setOrders] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);

  // Filtros Historial
  const [searchTicket, setSearchTicket] = useState('');
  const [filterWorker, setFilterWorker] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterType, setFilterType] = useState('');

  // Modal de Detalle
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadData = () => {
    let url = `http://${window.location.hostname}:3000/api/pos/orders?`;
    if (startDate && endDate) url += `startDate=${startDate}&endDate=${endDate}`;
    else if (specificDate) url += `date=${specificDate}`;
    else if (specificMonth) url += `month=${specificMonth}`;
    else url += `period=${period || 'month'}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.summary) {
          setSummary({
            total_sales: data.summary.total_sales || 0,
            total_tickets: data.summary.total_tickets || 0,
            total_pending: data.summary.total_pending || 0
          });
        }
        if (data.topProducts) setTopProducts(data.topProducts);
        if (data.orders) setOrders(data.orders);
        if (data.workers) setWorkers(data.workers);
        if (data.chartData) {
          setHourlyData(data.chartData.map(h => ({ name: period === 'day' ? h.name : h.name, ventas: h.sales })));
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refrescar cada 5 segundos
    return () => clearInterval(interval);
  }, [period, specificDate, specificMonth, startDate, endDate]);

  const viewOrderDetails = (order) => {
    fetch(`http://${window.location.hostname}:3000/api/pos/orders/${order.id}`)
      .then(res => res.json())
      .then(data => {
        setSelectedOrder(data);
      })
      .catch(console.error);
  };

  const filteredOrders = orders.filter(o => {
    if (searchTicket && !String(o.ticket_number).includes(searchTicket)) return false;
    if (filterWorker && String(o.user_id) !== filterWorker) return false;
    if (filterPayment && o.payment_method !== filterPayment) return false;
    if (filterType && o.order_type !== filterType) return false;
    return true;
  });

  return (
    <div style={{ padding: '40px', color: '#f8fafc', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>Análisis y Reportes</h1>
        
        {/* Navegación de Pestañas */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('resumen')}
            style={{
              padding: '12px 25px', borderRadius: '12px', border: 'none', fontWeight: '800', fontSize: '16px', cursor: 'pointer', transition: '0.2s',
              background: activeTab === 'resumen' ? '#3b82f6' : '#1e293b',
              color: activeTab === 'resumen' ? '#fff' : '#94a3b8',
            }}
          >
            Resumen Financiero
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            style={{
              padding: '12px 25px', borderRadius: '12px', border: 'none', fontWeight: '800', fontSize: '16px', cursor: 'pointer', transition: '0.2s',
              background: activeTab === 'historial' ? '#3b82f6' : '#1e293b',
              color: activeTab === 'historial' ? '#fff' : '#94a3b8',
            }}
          >
            Historial de Búsqueda
          </button>
        </div>
      </div>
      
      {activeTab === 'resumen' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            {/* Filtros Avanzados (Rango / Mes / Día) */}
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              
              {/* Rango de Fechas */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1e293b', padding: '5px 15px', borderRadius: '12px', border: '1px solid #334155' }}>
                <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>Desde:</span>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setSpecificMonth('');
                    setSpecificDate('');
                    setPeriod('');
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontWeight: 'bold' }}
                />
                <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>Hasta:</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setSpecificMonth('');
                    setSpecificDate('');
                    setPeriod('');
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontWeight: 'bold' }}
                />
              </div>

              {/* Mes */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1e293b', padding: '5px 15px', borderRadius: '12px', border: '1px solid #334155' }}>
                <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>Mes:</span>
                <input 
                  type="month" 
                  value={specificMonth}
                  onChange={(e) => {
                    setSpecificMonth(e.target.value);
                    setSpecificDate('');
                    setStartDate('');
                    setEndDate('');
                    setPeriod('');
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontWeight: 'bold' }}
                />
              </div>

              {/* Día */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1e293b', padding: '5px 15px', borderRadius: '12px', border: '1px solid #334155' }}>
                <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>Día exacto:</span>
                <input 
                  type="date" 
                  value={specificDate}
                  onChange={(e) => {
                    setSpecificDate(e.target.value);
                    setSpecificMonth('');
                    setStartDate('');
                    setEndDate('');
                    setPeriod('');
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontWeight: 'bold' }}
                />
              </div>
              
              <div style={{ display: 'flex', background: '#1e293b', padding: '5px', borderRadius: '12px', border: '1px solid #334155' }}>
                <button 
                  onClick={() => { setPeriod('all'); setSpecificDate(''); setSpecificMonth(''); setStartDate(''); setEndDate(''); }}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: period === 'all' ? '#3b82f6' : 'transparent', color: period === 'all' ? '#fff' : '#94a3b8', cursor: 'pointer', fontWeight: 'bold' }}>
                  Histórico Global
                </button>
              </div>
            </div>
          </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1, color: '#10b981' }}><DollarSign size={100}/></div>
          <h3 style={{ color: '#94a3b8', fontWeight: '600' }}>Ventas Totales</h3>
          <p style={{ fontSize: '36px', fontWeight: '800', color: '#10b981', marginTop: '10px' }}>
            S/ {summary.total_sales.toFixed(2)}
          </p>
        </div>
        
        <div style={{ background: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1, color: '#f59e0b' }}><Receipt size={100}/></div>
          <h3 style={{ color: '#94a3b8', fontWeight: '600' }}>Tickets Emitidos</h3>
          <p style={{ fontSize: '36px', fontWeight: '800', color: '#f59e0b', marginTop: '10px' }}>
            {summary.total_tickets}
          </p>
        </div>

        <div style={{ background: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1, color: '#eab308' }}><Clock size={100}/></div>
          <h3 style={{ color: '#94a3b8', fontWeight: '600' }}>En Curso (Por Cobrar)</h3>
          <p style={{ fontSize: '36px', fontWeight: '800', color: '#eab308', marginTop: '10px' }}>
            S/ {summary.total_pending !== undefined ? summary.total_pending.toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '40px' }}>
        {/* Gráfico de Ventas */}
        <div style={{ background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155' }}>
          <h3 style={{ color: '#94a3b8', marginBottom: '20px', fontWeight: '600' }}>Flujo de Ingresos (PAGADOS)</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={value => `S/${value}`} />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#10b981' }}
                  formatter={(value) => [`S/ ${value.toFixed(2)}`, 'Ventas']}
                />
                <Area type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={3} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Platos Más Vendidos */}
        <div style={{ background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: '#94a3b8', marginBottom: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Star size={20} color="#eab308" /> Top 5 Productos
          </h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
            {topProducts.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', marginTop: '20px' }}>No hay ventas registradas</p>
            ) : (
              topProducts.map((p, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                      {index + 1}
                    </div>
                    <span style={{ color: '#f8fafc', fontWeight: '600' }}>{p.product_name}</span>
                  </div>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>{p.total_sold} und.</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
        </>
      )}

      {activeTab === 'historial' && (
        <div style={{ background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155' }}>
          <h3 style={{ color: '#94a3b8', fontWeight: '600', marginBottom: '20px' }}>Buscador Avanzado de Recibos</h3>
          
          {/* Filtros */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
            <input 
              type="text" 
              className="form-input"
              placeholder="Buscar Ticket N°..." 
              value={searchTicket}
              onChange={(e) => setSearchTicket(e.target.value)}
              style={{ fontSize: '15px', padding: '12px 15px' }}
            />
            <select 
              className="form-select"
              value={filterWorker} onChange={(e) => setFilterWorker(e.target.value)}
              style={{ fontSize: '15px', padding: '12px 15px' }}
            >
              <option value="">Todos los Trabajadores</option>
              {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <select 
              className="form-select"
              value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}
              style={{ fontSize: '15px', padding: '12px 15px' }}
            >
              <option value="">Todos los Pagos</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="YAPE">Yape / Plin</option>
              <option value="TARJETA">Tarjeta</option>
            </select>
            <select 
              className="form-select"
              value={filterType} onChange={(e) => setFilterType(e.target.value)}
              style={{ fontSize: '15px', padding: '12px 15px' }}
            >
              <option value="">Todos los Tipos</option>
              <option value="LOCAL">Local</option>
              <option value="DELIVERY">Delivery</option>
            </select>
          </div>
          
          {filteredOrders.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>No se encontraron recibos con esos filtros.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredOrders.map(order => (
                <div 
                  key={order.id} 
                  onClick={() => viewOrderDetails(order)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '15px 20px', borderRadius: '10px', border: '1px solid #334155', cursor: 'pointer', transition: '0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#334155'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '10px', color: '#f59e0b' }}>
                      <Receipt size={24} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>Ticket #{String(order.ticket_number).padStart(4, '0')}</div>
                        {order.status === 'ABIERTA' ? (
                          <span style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#eab308', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>EN CURSO</span>
                        ) : (
                          <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>PAGADO</span>
                        )}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
                        {new Date(order.created_at).toLocaleString()} • {order.order_type} • {order.payment_method}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                      S/ {order.total.toFixed(2)}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
                      Atendido por: <span style={{ color: '#94a3b8' }}>{order.worker_name || 'Admin'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalle de Recibo */}
      {selectedOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#1e293b', padding: '30px', borderRadius: '20px', width: '500px',
            border: '1px solid #334155', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Receipt size={24} color="#3b82f6" /> 
                Detalle del Ticket #{String(selectedOrder.ticket_number).padStart(4, '0')}
              </h2>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px', color: '#cbd5e1', fontSize: '15px' }}>
              <div><strong>Fecha:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</div>
              <div><strong>Tipo:</strong> {selectedOrder.order_type}</div>
              <div><strong>Pago:</strong> {selectedOrder.payment_method}</div>
              <div><strong>Cajero:</strong> {selectedOrder.worker_name || 'Admin'}</div>
            </div>

            <div style={{ background: '#0f172a', borderRadius: '12px', padding: '15px', maxHeight: '250px', overflowY: 'auto' }}>
              {selectedOrder.items && selectedOrder.items.length > 0 ? (
                selectedOrder.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #334155', padding: '10px 0' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#f8fafc' }}>{item.quantity}x {item.product_name}</div>
                      {item.notes && <div style={{ fontSize: '13px', color: '#f59e0b', marginTop: '4px' }}>* {item.notes}</div>}
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#10b981' }}>S/ {item.subtotal.toFixed(2)}</div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
                  Este recibo se generó antes de implementar el guardado de detalles.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #334155' }}>
              <div style={{ fontSize: '18px', color: '#94a3b8' }}>Total Pagado:</div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#10b981' }}>S/ {selectedOrder.total.toFixed(2)}</div>
            </div>
            
            <button 
              onClick={() => setSelectedOrder(null)}
              style={{ width: '100%', padding: '15px', marginTop: '25px', borderRadius: '12px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
            >
              Cerrar Detalle
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
