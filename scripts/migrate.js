const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const defaults = {
 users: [],
 deposits: [],
 withdrawals: []
};

for (const key of Object.keys(defaults)) {
 const file = path.join(dataDir, `${key}.json`);
 if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(defaults[key], null, 2));
}

console.log('Migration completed. data/ with users.json, deposits.json, withdrawals.json created.');