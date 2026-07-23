const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../Database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'crm.db'));

function ensureColumn(tableName, columnName, columnDefinition) {
  const info = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const hasColumn = info.some(column => column.name === columnName);
  if (!hasColumn) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
  }
}

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT DEFAULT 'default'
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL,
    category TEXT,
    description TEXT,
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT DEFAULT 'default'
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    product_id INTEGER,
    status TEXT DEFAULT 'Pending',
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT DEFAULT 'default',
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

ensureColumn('customers', 'user_id', 'user_id TEXT DEFAULT \'default\'');
ensureColumn('products', 'user_id', 'user_id TEXT DEFAULT \'default\'');
ensureColumn('orders', 'user_id', 'user_id TEXT DEFAULT \'default\'');
ensureColumn('orders', 'receipt_id', 'receipt_id TEXT');

// Seed sample data if empty
const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get();
if (customerCount.count === 0) {
  const insertCustomer = db.prepare('INSERT INTO customers (name, phone, email, user_id) VALUES (?, ?, ?, ?)');
  insertCustomer.run('Rahul Verma', '9876543210', 'rahul@gmail.com', 'default');
  insertCustomer.run('Priya Sharma', '9812345678', 'priya@gmail.com', 'default');
  insertCustomer.run('Amit Singh', '9898989898', 'amit@gmail.com', 'default');
  insertCustomer.run('Sunita Gupta', '9765432109', 'sunita@gmail.com', 'default');
  insertCustomer.run('Mohan Lal', '9654321098', 'mohan@gmail.com', 'default');

  const insertProduct = db.prepare('INSERT INTO products (name, price, category, description, user_id) VALUES (?, ?, ?, ?, ?)');
  insertProduct.run('LED Bulb 9W', 85, 'Electronics', 'Energy saving LED bulb for home use', 'default');
  insertProduct.run('Cotton Shirt', 499, 'Clothing', 'Pure cotton casual shirt', 'default');
  insertProduct.run('Rice 5kg', 350, 'Food & Grocery', 'Premium basmati rice', 'default');
  insertProduct.run('Paracetamol Strip', 25, 'Pharmacy', 'Fever and pain relief tablets', 'default');
  insertProduct.run('Electric Wire 10m', 220, 'Hardware', 'Heavy duty copper wire', 'default');
  insertProduct.run('Wall Paint 1L', 450, 'Hardware', 'Interior emulsion paint white', 'default');

  const insertOrder = db.prepare('INSERT INTO orders (customer_id, product_id, status, user_id) VALUES (?, ?, ?, ?)');
  insertOrder.run(1, 1, 'Delivered', 'default');
  insertOrder.run(1, 4, 'Pending', 'default');
  insertOrder.run(2, 2, 'Out for Delivery', 'default');
  insertOrder.run(3, 3, 'Delivered', 'default');
  insertOrder.run(4, 5, 'Pending', 'default');
  insertOrder.run(5, 6, 'Delivered', 'default');
  insertOrder.run(2, 1, 'Pending', 'default');
}

module.exports = db;
