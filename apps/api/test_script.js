const { PrismaClient } = require('@prisma/client');
const { JwtService } = require('@nestjs/jwt');
require('dotenv').config({ path: '.env' });

async function main() {
  const prisma = new PrismaClient();
  const jwtService = new JwtService({ secret: process.env.JWT_SECRET });
  
  try {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      console.error('No admin user found');
      return;
    }

    const application = await prisma.supplierApplication.findFirst({
      include: { documents: true }
    });

    if (!application) {
      console.error('No supplier application found');
      return;
    }

    const token = jwtService.sign({ id: admin.id, role: admin.role });

    for (const doc of application.documents) {
      const url = `http://localhost:3001/api/v1/supplier-applications/admin/${application.id}/documents/${doc.type}`;
      try {
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const contentType = res.headers.get('content-type');
        let errorBody = '';
        if (res.status !== 200) {
          const text = await res.text();
          errorBody = text.substring(0, 200);
        }
        console.log(`Type: ${doc.type}, Status: ${res.status}, Content-Type: ${contentType}${errorBody ? ', Error: ' + errorBody : ''}`);
      } catch (err) {
        console.error(`Fetch error for ${doc.type}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
