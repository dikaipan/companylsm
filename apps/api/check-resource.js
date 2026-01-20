
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkResource() {
    const filename = '4218a6db1048f5ccca3c6fa27187787a8.pdf';
    const resource = await prisma.resource.findFirst({
        where: {
            fileUrl: {
                contains: filename
            }
        }
    });
    console.log('Resource found:', resource);
}

checkResource()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
