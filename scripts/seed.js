const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

(async function run() {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const usersFile = path.join(dataDir, 'users.json');

  const adminPasswordPlain = 'Admin@1234';
  const adminHash = await bcrypt.hash(adminPasswordPlain, 10);

  const admin = {
    id: 1,
    name: 'Admin',
    email: 'sdcarlos17gac@gmail.com',
    password: adminHash,
    role: 'admin',
    referrer: null,
    created_at: new Date().toISOString()
  };

  fs.writeFileSync(usersFile, JSON.stringify([admin], null, 2));
  console.log('Seed completed. Admin user created:');
  console.log('  email:', admin.email);
  console.log('  password (dev only):', adminPasswordPlain);
})();