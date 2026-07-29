import React, { useState, useEffect } from 'react';

const PREDEFINED_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', 
  '#334155', '#14b8a6', '#84cc16', '#06b6d4', '#f97316', '#6366f1'
];

const selectStyle = {
  appearance: 'none',
  padding: '14px 40px 14px 14px',
  background: '#0f172a url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E") no-repeat right 15px center',
  backgroundSize: '16px',
  border: '1px solid #334155',
  color: 'white',
  borderRadius: '10px',
  fontSize: '16px',
  outline: 'none',
  cursor: 'pointer'
};

export default function ProductsAdmin() {
  const [activeTab, setActiveTab] = useState('platos'); // Pestaña activa por defecto
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [extras, setExtras] = useState([]);
  const [extraOptions, setExtraOptions] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  
  // Modal states: Productos
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [editingProductId, setEditingProductId] = useState(null);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [sellingType, setSellingType] = useState('UNIT'); // UNIT o WEIGHT
  
  // Representación Visual del Producto
  const [representationType, setRepresentationType] = useState('COLOR'); // COLOR o IMAGE
  const [selectedColor, setSelectedColor] = useState(PREDEFINED_COLORS[0]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Modal states: Categorías
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(PREDEFINED_COLORS[0]);

  // Modal states: Extras
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [newExtraName, setNewExtraName] = useState('');
  const [newExtraOptions, setNewExtraOptions] = useState([{ name: '', price: '' }]);

  // Modal states: Descuentos
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [newDiscountName, setNewDiscountName] = useState('');
  const [newDiscountType, setNewDiscountType] = useState('PERCENTAGE');
  const [newDiscountValue, setNewDiscountValue] = useState('');

  // Modal Confirmación Global
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, type: null, message: '' });

  const loadMenu = () => {
    fetch(`http://${window.location.hostname}:3000/api/pos/menu`)
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories || []);
        setProducts(data.products || []);
        setExtras(data.extras || []);
        setExtraOptions(data.extra_options || []);
        setDiscounts(data.discounts || []);
      })
      .catch(err => console.error("Error cargando base de datos", err));
  };

  useEffect(() => { loadMenu(); }, []);

  // --- Funciones para PRODUCTOS ---
  const handleImageChange = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else if (file) {
      alert("Por favor selecciona un archivo de imagen válido.");
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => { setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleImageChange(e.dataTransfer.files[0]);
  };

  const handleSaveProduct = () => {
    if (!newProductName.trim() || !newProductPrice.toString().trim()) return;
    
    const formData = new FormData();
    formData.append('name', newProductName);
    formData.append('price', parseFloat(newProductPrice));
    formData.append('category_id', newProductCategory || '');
    formData.append('selling_type', sellingType);
    
    if (representationType === 'COLOR') {
      formData.append('bg_color', selectedColor);
      formData.append('clear_image', 'true');
    } else if (representationType === 'IMAGE' && imageFile) {
      formData.append('image', imageFile);
    }
    
    const url = editingProductId 
      ? `http://${window.location.hostname}:3000/api/pos/products/${editingProductId}`
      : `http://${window.location.hostname}:3000/api/pos/products`;
      
    const method = editingProductId ? 'PUT' : 'POST';

    fetch(url, { method: method, body: formData })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setShowProductModal(false);
          setEditingProductId(null);
          setNewProductName('');
          setNewProductPrice('');
          setNewProductCategory('');
          setRepresentationType('COLOR');
          setImageFile(null);
          setImagePreview(null);
          loadMenu();
        }
      })
      .catch(err => console.error("Error al guardar producto:", err));
  };
  
  const openCreateProductModal = () => {
    setEditingProductId(null);
    setNewProductName('');
    setNewProductPrice('');
    setNewProductCategory('');
    setSellingType('UNIT');
    setRepresentationType('COLOR');
    setSelectedColor(PREDEFINED_COLORS[0]);
    setImageFile(null);
    setImagePreview(null);
    setShowProductModal(true);
  };
  
  const handleEditProductClick = (p) => {
    setEditingProductId(p.id);
    setNewProductName(p.name);
    setNewProductPrice(p.price.toString());
    setNewProductCategory(p.category_id ? p.category_id.toString() : '');
    setSellingType(p.selling_type || 'UNIT');
    
    if (p.image_url) {
      setRepresentationType('IMAGE');
      setImagePreview(p.image_url.startsWith('http') ? p.image_url : `http://${window.location.hostname}:3000${p.image_url}`);
      setImageFile(null);
    } else {
      setRepresentationType('COLOR');
      setSelectedColor(p.bg_color || PREDEFINED_COLORS[0]);
      setImagePreview(null);
      setImageFile(null);
    }
    
    setShowProductModal(true);
  };

  // --- Funciones para CATEGORÍAS ---
  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/pos/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, bg_color: newCategoryColor })
      });
      const data = await res.json();
      if (data.success) {
        setShowCategoryModal(false);
        setNewCategoryName('');
        setNewCategoryColor(PREDEFINED_COLORS[0]);
        loadMenu(); 
      }
    } catch (e) { alert("Error al guardar categoría"); }
  };

  // --- Acción Global de Eliminación ---
  const confirmDeleteAction = async () => {
    const { id, type } = deleteConfirm;
    setDeleteConfirm({ show: false, id: null, type: null, message: '' });
    
    try {
      let endpoint = '';
      if (type === 'category') endpoint = `/api/pos/categories/${id}`;
      else if (type === 'extra') endpoint = `/api/pos/extras/${id}`;
      else if (type === 'discount') endpoint = `/api/pos/discounts/${id}`;
      else if (type === 'product') endpoint = `/api/pos/products/${id}`;
      
      if(endpoint) {
         const res = await fetch(`http://${window.location.hostname}:3000${endpoint}`, { method: 'DELETE' });
         const data = await res.json();
         if (data.success) loadMenu();
      }
    } catch (e) {
      alert("Error al intentar borrar el elemento.");
    }
  };

  // --- Funciones para EXTRAS y DESCUENTOS ---
  const handleAddExtraOption = () => {
    setNewExtraOptions([...newExtraOptions, { name: '', price: '' }]);
  };
  
  const handleRemoveExtraOption = (index) => {
    setNewExtraOptions(newExtraOptions.filter((_, i) => i !== index));
  };
  
  const handleExtraOptionChange = (index, field, value) => {
    const updated = [...newExtraOptions];
    if (field === 'price' && value !== '' && !/^\d*\.?\d{0,2}$/.test(value)) return;
    updated[index][field] = value;
    setNewExtraOptions(updated);
  };

  const handleSaveExtra = async () => {
    if (!newExtraName.trim()) return;
    const validOptions = newExtraOptions.filter(o => o.name.trim() !== '');
    
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/pos/extras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newExtraName, options: validOptions })
      });
      const data = await res.json();
      if (data.success) {
        setShowExtraModal(false);
        setNewExtraName('');
        setNewExtraOptions([{ name: '', price: '' }]);
        loadMenu();
      }
    } catch (e) { alert("Error al guardar Extra"); }
  };

  const handleSaveDiscount = async () => {
    if (!newDiscountName.trim() || !newDiscountValue) return;
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/pos/discounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDiscountName, type: newDiscountType, value: parseFloat(newDiscountValue) })
      });
      const data = await res.json();
      if (data.success) {
        setShowDiscountModal(false);
        setNewDiscountName('');
        setNewDiscountType('PERCENTAGE');
        setNewDiscountValue('');
        loadMenu();
      }
    } catch (e) { alert("Error al guardar Descuento"); }
  };

  // --- Validaciones ---
  const isFormValid = newProductName.trim() !== '' && newProductPrice.toString().trim() !== '' && (representationType === 'COLOR' || (representationType === 'IMAGE' && (imageFile !== null || (editingProductId && imagePreview))));
  const isExtraFormValid = newExtraName.trim() !== '' && newExtraOptions.length > 0 && newExtraOptions.every(o => o.name.trim() !== '' && o.price.toString().trim() !== '');
  const isDiscountFormValid = newDiscountName.trim() !== '' && newDiscountValue.trim() !== '' && parseFloat(newDiscountValue) > 0;

  return (
    <div style={{ padding: '30px', color: '#f8fafc', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ marginBottom: '20px', color: '#f59e0b' }}>Gestión de Menú e Inventario</h1>
      
      {/* Pestañas de Navegación */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #334155', paddingBottom: '15px', overflowX: 'auto' }}>
        <button onClick={() => setActiveTab('platos')} style={{ background: activeTab === 'platos' ? '#f59e0b' : '#1e293b', color: activeTab === 'platos' ? '#000' : '#fff', padding: '12px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>1. Productos</button>
        <button onClick={() => setActiveTab('categorias')} style={{ background: activeTab === 'categorias' ? '#f59e0b' : '#1e293b', color: activeTab === 'categorias' ? '#000' : '#fff', padding: '12px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>2. Categorías</button>
        <button onClick={() => setActiveTab('modificadores')} style={{ background: activeTab === 'modificadores' ? '#f59e0b' : '#1e293b', color: activeTab === 'modificadores' ? '#000' : '#fff', padding: '12px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>3. Extras</button>
        <button onClick={() => setActiveTab('descuentos')} style={{ background: activeTab === 'descuentos' ? '#f59e0b' : '#1e293b', color: activeTab === 'descuentos' ? '#000' : '#fff', padding: '12px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>4. Descuentos</button>
      </div>

      {/* Pestaña 1: Platos */}
      {activeTab === 'platos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ margin: 0 }}>Catálogo de Productos</h2>
            <button onClick={openCreateProductModal} style={{ background: '#10b981', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>+ Crear Producto</button>
          </div>
          
          {/* Filtro de Categorías (Píldoras) */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}>
            <button 
              onClick={() => setSelectedCategoryFilter('ALL')}
              style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: selectedCategoryFilter === 'ALL' ? '#f59e0b' : '#334155', color: selectedCategoryFilter === 'ALL' ? '#000' : '#fff', transition: '0.2s', flexShrink: 0 }}>
              Todos
            </button>
            {categories.slice().sort((a,b) => a.display_order - b.display_order).map(c => (
              <button 
                key={c.id}
                onClick={() => setSelectedCategoryFilter(c.id)}
                style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: selectedCategoryFilter === c.id ? '#f59e0b' : '#334155', color: selectedCategoryFilter === c.id ? '#000' : '#fff', transition: '0.2s', flexShrink: 0 }}>
                {c.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {products
              .filter(p => selectedCategoryFilter === 'ALL' || p.category_id === selectedCategoryFilter)
              .map(p => {
                const catName = categories.find(c => c.id === p.category_id)?.name || 'Sin categoría';
                return (
                <div key={p.id} className="product-card-admin" onClick={() => handleEditProductClick(p)} style={{ cursor: 'pointer', position: 'relative' }}>
                  {p.image_url ? (
                    <div style={{ height: '140px', width: '100%', backgroundImage: p.image_url.startsWith('http') ? `url("${p.image_url}")` : `url("http://${window.location.hostname}:3000${p.image_url}")`, backgroundSize: 'cover', backgroundPosition: 'center', borderBottom: `4px solid ${p.bg_color || '#334155'}`, borderRadius: '12px 12px 0 0' }}></div>
                  ) : (
                    <div style={{ height: '140px', width: '100%', background: p.bg_color || '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px 12px 0 0' }}>
                       <span style={{color: 'rgba(255,255,255,0.4)', fontSize: '50px', fontWeight: 'bold', textTransform: 'uppercase'}}>{p.name.charAt(0)}</span>
                    </div>
                  )}
                  
                  <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '18px' }}>S/ {p.price.toFixed(2)}</span>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
                      {catName} • {p.selling_type === 'WEIGHT' ? 'Balanza' : 'Unidad'}
                    </div>
                  </div>
                </div>
              );
            })}
            {products.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#1e293b', borderRadius: '16px', border: '1px dashed #334155' }}>No hay platos registrados. ¡Agrega tu primer plato!</div>
            )}
          </div>
        </div>
      )}

      {/* Pestaña 2: Categorías */}
      {activeTab === 'categorias' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Lista de Categorías</h2>
            <button onClick={() => setShowCategoryModal(true)} style={{ background: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>+ Crear Categoría</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            {categories.map(c => {
              const prodCount = products.filter(p => p.category_id === c.id).length;
              return (
                <div key={c.id} className="product-card-admin">
                  <div style={{ height: '110px', width: '100%', background: c.bg_color || '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{color: 'rgba(255,255,255,0.4)', fontSize: '50px', fontWeight: 'bold', textTransform: 'uppercase'}}>{c.name.charAt(0)}</span>
                  </div>
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '20px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '14px', background: '#0f172a', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold' }}>{prodCount} platos</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ show: true, id: c.id, type: 'category', message: `¿Seguro que deseas borrar la categoría "${c.name}"? Los productos asignados quedarán sin categoría.` }); }} 
                        style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}
                        onMouseOver={(e) => e.target.style.background = '#ef4444'}
                        onMouseOut={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                      >Eliminar</button>
                    </div>
                  </div>
                </div>
              );
            })}
            {categories.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#1e293b', borderRadius: '16px', border: '1px dashed #334155' }}>No hay categorías registradas. ¡Agrega tu primera categoría!</div>
            )}
          </div>
        </div>
      )}

      {/* Pestaña 3: Extras */}
      {activeTab === 'modificadores' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Lista de Extras</h2>
            <button onClick={() => setShowExtraModal(true)} style={{ background: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>+ Crear Extra</button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {extras.map(ext => {
              const opts = extraOptions.filter(o => o.extra_id === ext.id);
              return (
                <div key={ext.id} style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '20px' }}>{ext.name}</h3>
                    <button onClick={() => setDeleteConfirm({ show: true, id: ext.id, type: 'extra', message: `¿Seguro que deseas borrar el extra "${ext.name}" con todas sus opciones?` })} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Borrar</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#0f172a', padding: '15px', borderRadius: '10px' }}>
                    {opts.length === 0 && <span style={{color: '#94a3b8', fontSize: '14px'}}>Sin opciones</span>}
                    {opts.map(o => (
                      <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #334155', paddingBottom: '4px' }}>
                        <span style={{ color: '#e2e8f0' }}>{o.name}</span>
                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>S/ {o.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {extras.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#1e293b', borderRadius: '16px', border: '1px dashed #334155' }}>
                No hay extras registrados. (Ej: Término de la carne, Salsas, Adicionales...)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pestaña 4: Descuentos */}
      {activeTab === 'descuentos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Lista de Descuentos y Promociones</h2>
            <button onClick={() => setShowDiscountModal(true)} style={{ background: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>+ Crear Descuento</button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {discounts.map(d => (
              <div key={d.id} className="product-card-admin">
                <div style={{ height: '110px', width: '100%', background: d.type === 'PERCENTAGE' ? '#f59e0b' : '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{color: 'rgba(255,255,255,0.9)', fontSize: '40px', fontWeight: 'bold'}}>
                    {d.type === 'PERCENTAGE' ? `-${d.value}%` : `-S/ ${d.value.toFixed(2)}`}
                  </span>
                </div>
                
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '20px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8', fontSize: '14px', background: '#0f172a', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold' }}>
                      {d.type === 'PERCENTAGE' ? 'Porcentaje (%)' : 'Monto Fijo (S/)'}
                    </span>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ show: true, id: d.id, type: 'discount', message: `¿Seguro que deseas borrar el descuento "${d.name}"?` }); }} 
                      style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}
                      onMouseOver={(e) => e.target.style.background = '#ef4444'}
                      onMouseOut={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {discounts.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#1e293b', borderRadius: '16px', border: '1px dashed #334155' }}>
                No hay descuentos registrados. (Ej: 10% Empleados, 5.00 Soles Menú...)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para Crear Plato */}
      {showProductModal && (
        <div style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#1e293b', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #334155' }}>
            <h2 style={{ color: '#f59e0b', margin: 0 }}>{editingProductId ? 'Editar Producto' : 'Crear Producto'}</h2>
            
            <div style={{ borderTop: '1px solid #334155', paddingTop: '15px' }}>
              <h3 style={{ color: '#e2e8f0', marginBottom: '15px', fontSize: '18px' }}>1. Detalles del Producto</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: '#94a3b8', fontWeight: 'bold' }}>Nombre</label>
                  <input type="text" value={newProductName} onChange={e=>setNewProductName(e.target.value)} style={{ padding: '14px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '10px', fontSize: '16px', outline: 'none' }} placeholder="Ej: Arroz Chaufa" />
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ color: '#94a3b8', fontWeight: 'bold' }}>Precio (S/)</label>
                    <input type="text" inputMode="decimal" value={newProductPrice} onChange={(e) => { const val = e.target.value; if (/^\d*\.?\d{0,2}$/.test(val)) setNewProductPrice(val); }} style={{ padding: '14px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '10px', fontSize: '16px', outline: 'none' }} placeholder="0.00" />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ color: '#94a3b8', fontWeight: 'bold' }}>Categoría</label>
                    <select value={newProductCategory} onChange={e=>setNewProductCategory(e.target.value)} style={selectStyle}>
                      <option value="">-- Sin categoría --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: '#94a3b8', fontWeight: 'bold' }}>Modo de Venta</label>
                  <select value={sellingType} onChange={e=>setSellingType(e.target.value)} style={selectStyle}>
                    <option value="UNIT">Por Unidad / Plato</option>
                    <option value="WEIGHT">Por Peso (Balanza)</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #334155', paddingTop: '15px' }}>
              <h3 style={{ color: '#e2e8f0', marginBottom: '15px', fontSize: '18px' }}>2. Representación en Caja</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button onClick={()=>setRepresentationType('COLOR')} style={{ flex: 1, padding: '10px', background: representationType === 'COLOR' ? '#f59e0b' : '#334155', color: representationType === 'COLOR' ? '#000' : '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>Color Sólido</button>
                <button onClick={()=>setRepresentationType('IMAGE')} style={{ flex: 1, padding: '10px', background: representationType === 'IMAGE' ? '#f59e0b' : '#334155', color: representationType === 'IMAGE' ? '#000' : '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>Subir Imagen</button>
              </div>

              {representationType === 'COLOR' && (
                <div style={{ padding: '20px', background: '#0f172a', borderRadius: '10px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <p style={{ color: '#94a3b8', marginBottom: '15px', fontSize: '14px' }}>Elige un color para el botón en las tablets:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 45px)', gap: '12px', justifyContent: 'center' }}>
                    {PREDEFINED_COLORS.map(color => (
                      <div key={color} onClick={() => setSelectedColor(color)} style={{ width: '45px', height: '45px', borderRadius: '10px', background: color, cursor: 'pointer', border: selectedColor === color ? '3px solid white' : '2px solid transparent', transition: '0.2s', boxShadow: selectedColor === color ? `0 0 12px ${color}80` : 'none' }} />
                    ))}
                  </div>
                </div>
              )}

              {representationType === 'IMAGE' && (
                <div style={{ padding: '20px', background: '#0f172a', borderRadius: '10px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <p style={{ color: '#94a3b8', marginBottom: '15px', fontSize: '14px' }}>Sube una imagen desde el dispositivo:</p>
                  {imagePreview ? (
                    <div style={{ position: 'relative', width: '150px', height: '150px', borderRadius: '10px', overflow: 'hidden', border: '2px solid #10b981' }}>
                      <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ) : (
                    <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => document.getElementById('fileInput').click()} style={{ width: '100%', maxWidth: '300px', padding: '30px 20px', border: isDragging ? '2px dashed #10b981' : '2px dashed #475569', borderRadius: '10px', background: isDragging ? 'rgba(16,185,129,0.1)' : '#1e293b', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', transition: '0.2s' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={isDragging ? "#10b981" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '10px'}}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      <span style={{ color: isDragging ? '#10b981' : '#94a3b8', fontSize: '14px', textAlign: 'center' }}>{isDragging ? 'Suelta la imagen aquí' : 'Haz clic o arrastra una imagen aquí'}</span>
                      <input id="fileInput" type="file" accept="image/*" onChange={(e) => handleImageChange(e.target.files[0])} style={{ display: 'none' }} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button onClick={() => setShowProductModal(false)} style={{ flex: 1, padding: '14px', background: '#334155', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>Cancelar</button>
              <button 
                onClick={handleSaveProduct} 
                disabled={!isFormValid}
                style={{ flex: 1, padding: '14px', background: isFormValid ? '#10b981' : '#064e3b', color: isFormValid ? 'white' : '#64748b', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: isFormValid ? 'pointer' : 'not-allowed' }}>
                {editingProductId ? 'Actualizar Producto' : 'Guardar Producto'}
              </button>
              {editingProductId && (
                <button onClick={() => { setDeleteConfirm({ show: true, id: editingProductId, type: 'product', message: `¿Seguro que deseas eliminar este producto?` }); setShowProductModal(false); }} style={{ padding: '14px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>Borrar</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear Categoría */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#1e293b', padding: '35px', borderRadius: '24px', width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h2 style={{ color: '#f59e0b', margin: 0, borderBottom: '1px solid #334155', paddingBottom: '15px' }}>Crear Categoría</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: '#94a3b8', fontWeight: 'bold' }}>Nombre de Categoría</label>
              <input type="text" value={newCategoryName} onChange={e=>setNewCategoryName(e.target.value)} style={{ padding: '14px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '10px', fontSize: '16px', outline: 'none' }} placeholder="Ej: Menús, Sopas, Bebidas..." />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ color: '#94a3b8', fontWeight: 'bold' }}>Color de Categoría</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 40px)', gap: '12px', justifyContent: 'center', background: '#0f172a', padding: '15px', borderRadius: '12px', border: '1px solid #334155' }}>
                {PREDEFINED_COLORS.map(color => (
                  <div key={color} onClick={() => setNewCategoryColor(color)} style={{ width: '40px', height: '40px', borderRadius: '10px', background: color, cursor: 'pointer', border: newCategoryColor === color ? '3px solid white' : '2px solid transparent', transition: '0.2s', boxShadow: newCategoryColor === color ? `0 0 12px ${color}80` : 'none' }} />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button onClick={() => {setShowCategoryModal(false); setNewCategoryName(''); setNewCategoryColor(PREDEFINED_COLORS[0]);}} style={{ flex: 1, padding: '16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: '0.2s' }}>Cancelar</button>
              <button 
                onClick={handleSaveCategory} 
                disabled={newCategoryName.trim() === ''}
                style={{ 
                  flex: 1, padding: '16px', 
                  background: newCategoryName.trim() !== '' ? '#10b981' : '#064e3b', 
                  color: newCategoryName.trim() !== '' ? 'white' : '#64748b', 
                  border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', 
                  cursor: newCategoryName.trim() !== '' ? 'pointer' : 'not-allowed', transition: '0.2s' 
                }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear Extra */}
      {showExtraModal && (
        <div style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#1e293b', padding: '35px', borderRadius: '24px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h2 style={{ color: '#f59e0b', margin: 0, borderBottom: '1px solid #334155', paddingBottom: '15px' }}>Crear Extra</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: '#94a3b8', fontWeight: 'bold' }}>Nombre del Extra</label>
              <input type="text" value={newExtraName} onChange={e=>setNewExtraName(e.target.value)} style={{ padding: '14px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '10px', fontSize: '16px', outline: 'none' }} placeholder="Ej: Término de carne, Salsas..." />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ color: '#94a3b8', fontWeight: 'bold' }}>Nombre de la opción</label>
                <button onClick={handleAddExtraOption} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ Agregar Opción</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#0f172a', padding: '15px', borderRadius: '12px', border: '1px solid #334155' }}>
                {newExtraOptions.map((opt, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: newExtraOptions.length > 1 ? '3fr 2fr 45px' : '3fr 2fr', gap: '10px', alignItems: 'center' }}>
                    <input type="text" value={opt.name} onChange={e => handleExtraOptionChange(index, 'name', e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '8px', fontSize: '15px', outline: 'none' }} placeholder="Opción (Ej: Huevo frito)" />
                    
                    <div style={{ position: 'relative', width: '100%' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 'bold' }}>S/</span>
                      <input type="text" inputMode="decimal" value={opt.price} onChange={e => handleExtraOptionChange(index, 'price', e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 12px 12px 35px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '8px', fontSize: '15px', outline: 'none' }} placeholder="0.00" />
                    </div>

                    {newExtraOptions.length > 1 && (
                      <button onClick={() => handleRemoveExtraOption(index)} style={{ width: '45px', height: '45px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>✕</button>
                    )}
                  </div>
                ))}
                {newExtraOptions.length === 0 && <span style={{ color: '#94a3b8', fontSize: '14px' }}>Haz clic en "+ Agregar Opción"</span>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button onClick={() => {setShowExtraModal(false); setNewExtraName(''); setNewExtraOptions([{name:'', price:''}]);}} style={{ flex: 1, padding: '16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: '0.2s' }}>Cancelar</button>
              <button 
                onClick={handleSaveExtra} 
                disabled={!isExtraFormValid}
                style={{ 
                  flex: 2, padding: '16px', 
                  background: isExtraFormValid ? '#10b981' : '#064e3b', 
                  color: isExtraFormValid ? 'white' : '#64748b', 
                  border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', 
                  cursor: isExtraFormValid ? 'pointer' : 'not-allowed', transition: '0.2s' 
                }}>
                Guardar Extra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear Descuento */}
      {showDiscountModal && (
        <div style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#1e293b', padding: '35px', borderRadius: '24px', width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h2 style={{ color: '#f59e0b', margin: 0, borderBottom: '1px solid #334155', paddingBottom: '15px' }}>Crear Descuento</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: '#94a3b8', fontWeight: 'bold' }}>Nombre del Descuento</label>
              <input type="text" value={newDiscountName} onChange={e=>setNewDiscountName(e.target.value)} style={{ padding: '14px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '10px', fontSize: '16px', outline: 'none' }} placeholder="Ej: Personal, Promoción Martes..." />
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#94a3b8', fontWeight: 'bold' }}>Tipo de Descuento</label>
                <select value={newDiscountType} onChange={e=>setNewDiscountType(e.target.value)} style={selectStyle}>
                  <option value="PERCENTAGE">Porcentaje (%)</option>
                  <option value="FIXED">Monto Fijo (S/)</option>
                </select>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#94a3b8', fontWeight: 'bold' }}>Valor</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 'bold' }}>
                    {newDiscountType === 'PERCENTAGE' ? '%' : 'S/'}
                  </span>
                  <input type="text" inputMode="decimal" value={newDiscountValue} onChange={(e) => { const val = e.target.value; if (/^\d*\.?\d{0,2}$/.test(val)) setNewDiscountValue(val); }} style={{ width: '100%', boxSizing: 'border-box', padding: '14px 14px 14px 40px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '10px', fontSize: '16px', outline: 'none' }} placeholder={newDiscountType === 'PERCENTAGE' ? '10' : '5.00'} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button onClick={() => {setShowDiscountModal(false); setNewDiscountName(''); setNewDiscountType('PERCENTAGE'); setNewDiscountValue('');}} style={{ flex: 1, padding: '16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: '0.2s' }}>Cancelar</button>
              <button 
                onClick={handleSaveDiscount} 
                disabled={!isDiscountFormValid}
                style={{ 
                  flex: 1, padding: '16px', 
                  background: isDiscountFormValid ? '#10b981' : '#064e3b', 
                  color: isDiscountFormValid ? 'white' : '#64748b', 
                  border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', 
                  cursor: isDiscountFormValid ? 'pointer' : 'not-allowed', transition: '0.2s' 
                }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Global de Confirmación de Eliminación */}
      {deleteConfirm.show && (
        <div style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div style={{ background: '#1e293b', padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', border: '1px solid #ef4444', boxShadow: '0 25px 50px -12px rgba(239,68,68,0.3)' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '50%', color: '#ef4444' }}>
              <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '22px' }}>Confirmar Eliminación</h2>
              <p style={{ color: '#94a3b8', fontSize: '16px', margin: 0, lineHeight: '1.5' }}>{deleteConfirm.message}</p>
            </div>
            
            <div style={{ display: 'flex', gap: '15px', width: '100%', marginTop: '10px' }}>
              <button onClick={() => setDeleteConfirm({show: false, id: null, type: null, message: ''})} style={{ flex: 1, padding: '14px', background: '#334155', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: '0.2s' }}>Cancelar</button>
              <button onClick={confirmDeleteAction} style={{ flex: 1, padding: '14px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: '0.2s' }}>Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
