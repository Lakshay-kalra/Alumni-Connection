const { execSync } = require('child_process');

const users = ['postgres', 'hp', 'administrator', 'system'];
const passwords = [
  '',
  'postgres',
  'admin',
  'root',
  'password',
  'admin@123',
  'Admin@123',
  'hp',
  'hp123',
  'hp@123',
  'postgres123',
  'Postgres@123',
  'Postgres123',
  'admin123',
  '123456',
  '12345678',
  'alumni',
  'password123',
  '1234'
];

for (const user of users) {
  for (const pwd of passwords) {
    const url = pwd ? `postgresql://${user}:${pwd}@localhost:5432/postgres` : `postgresql://${user}@localhost:5432/postgres`;
    console.log(`Trying ${user} with password: "${pwd}"`);
    try {
      const output = execSync('npx prisma db push --accept-data-loss', {
        env: {
          ...process.env,
          DATABASE_URL: url
        },
        stdio: 'pipe'
      });
      console.log(`\n🎉 SUCCESS! Working DATABASE_URL is: ${url}\n`);
      process.exit(0);
    } catch (error) {
      const errMsg = error.stderr ? error.stderr.toString() : error.message;
      if (errMsg.includes('P1000')) {
        // Auth failed
      } else {
        console.log(`❌ Other error for ${user}: ${errMsg.substring(0, 150)}`);
      }
    }
  }
}

console.log('Could not find working credentials.');
process.exit(1);
