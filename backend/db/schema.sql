-- schema.sql
-- Archivo maestro de la Base de Datos SQLite para la Chifería

-- 1. Tabla de Categorías (Ej: Sopas, Chaufas, Aeropuertos)
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0
);

-- 2. Tabla de Productos (Platos)
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT 1,
    FOREIGN KEY(category_id) REFERENCES categories(id)
);

-- 3. Tabla de Modificadores (Notas y extras: "Sin cebolla", "Agrandar")
CREATE TABLE IF NOT EXISTS modifiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    extra_price REAL DEFAULT 0.00
);

-- 4. Tabla Intermedia (Qué extras aplican a qué productos)
CREATE TABLE IF NOT EXISTS product_modifiers (
    product_id INTEGER,
    modifier_id INTEGER,
    FOREIGN KEY(product_id) REFERENCES products(id),
    FOREIGN KEY(modifier_id) REFERENCES modifiers(id)
);

-- 5. Trabajadores (Usuarios del sistema)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    pin_code TEXT NOT NULL, -- PIN numérico de 4 dígitos para logueo rapidísimo en tablets
    role TEXT NOT NULL -- 'ADMIN' o 'OPERADOR'
);

-- 6. Repartidores / Motorizados
CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1
);

-- 7. Clientes / CRM (Solo para Delivery)
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL
);

-- 8. Tickets de Venta (Órdenes)
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_number INTEGER NOT NULL, -- El correlativo: Ticket #005
    order_type TEXT NOT NULL, -- 'LOCAL' o 'DELIVERY'
    payment_method TEXT NOT NULL, -- 'EFECTIVO', 'YAPE', 'PLIN', 'TARJETA', 'MIXTO'
    total REAL NOT NULL,
    discount REAL DEFAULT 0.00,
    user_id INTEGER, -- Quién registró la orden
    driver_id INTEGER, -- Quién la está repartiendo
    customer_id INTEGER, -- Datos de quién lo recibe
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(driver_id) REFERENCES drivers(id),
    FOREIGN KEY(customer_id) REFERENCES customers(id)
);

-- 9. Detalles del Ticket (Qué platos se pidieron en el Ticket #005)
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    notes TEXT, -- "Sin cebolla, extra sillao"
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
);
