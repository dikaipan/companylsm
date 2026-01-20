
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'student@lms.com';
    const password = 'user123';

    console.log(`🔍 Checking user: ${email}...`);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.error('❌ User NOT FOUND in database!');
        return;
    }

    console.log('✅ User found:', user.id, user.role);
    console.log('🔑 Stored Hash:', user.password);

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
        console.log('✅ Password MATCHES!');
    } else {
        console.error('❌ Password does NOT match!');
        const newHash = await bcrypt.hash(password, 10);
        console.log('ℹ️ Expected hash for "user123":', newHash);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
