const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname);
function read(file) {
 const p = path.join(dataDir, file);
 try {
 return JSON.parse(fs.readFileSync(p));
 } catch (err) {
 return null;
 }
}
function write(file, data) {
 const p = path.join(dataDir, file);
 fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

module.exports = {
 getUsers: () => read('users.json') || [],
 saveUsers: (u) => write('users.json', u),
 getDeposits: () => read('deposits.json') || [],
 saveDeposits: (d) => write('deposits.json', d),
 getWithdrawals: () => read('withdrawals.json') || [],
 saveWithdrawals: (w) => write('withdrawals.json', w)
};