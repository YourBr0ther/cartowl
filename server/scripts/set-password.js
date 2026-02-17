// Usage: node server/scripts/set-password.js <newpassword>
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node set-password.js <password>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
const db = getDb();
db.prepare("UPDATE settings SET value=? WHERE key='admin_password_hash'").run(hash);
console.log('Admin password updated successfully.');
process.exit(0);
