const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const customerPassword = await bcrypt.hash('customer123', 10);

  // Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Abhinay Singh',
      fname: 'Abhinay',
      lname: 'Singh',
      role: 'ADMIN',
      phone: '9999999999',
      addressLine1: '123 Admin Street',
      addressLine2: 'Sector 1',
      city: 'Kanpur',
      state: 'Uttar Pradesh',
      country: 'IN',
      postalCode: '208001',
    },
  });

  console.log('Admin user created:', admin.email);

  // Customer User
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: customerPassword,
      name: 'Rahul Sharma',
      fname: 'Rahul',
      lname: 'Sharma',
      role: 'CUSTOMER',
      phone: '8888888888',
      addressLine1: '456 Customer Lane',
      addressLine2: 'Near Market',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      country: 'IN',
      postalCode: '226001',
    },
  });

  console.log('Customer user created:', customer.email);

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });