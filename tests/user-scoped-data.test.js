const fs = require('fs');
const path = require('path');
const assert = require('assert');

const files = [
  path.join(__dirname, '..', 'Backend', 'routes', 'customers.js'),
  path.join(__dirname, '..', 'Backend', 'routes', 'products.js'),
  path.join(__dirname, '..', 'Backend', 'routes', 'orders.js')
];

for (const file of files) {
  const contents = fs.readFileSync(file, 'utf8');
  assert.ok(contents.includes('x-user-id') || contents.includes('user_id'), `Expected ${path.basename(file)} to use user-scoped data`);
}

console.log('User-scoped data regression checks passed');
