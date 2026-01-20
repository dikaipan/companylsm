import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Role enum:', Role);
    console.log('Connecting...');
    await prisma.$connect();
    console.log('Connected!');
    await prisma.$disconnect();
}

main().catch(console.error);
