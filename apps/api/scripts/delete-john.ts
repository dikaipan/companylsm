
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️ Deleting John Employee...');

    const user = await prisma.user.findUnique({
        where: { email: 'student@lms.com' }
    });

    if (!user) {
        console.log('❌ John Employee (student@lms.com) not found.');
        return;
    }

    const userId = user.id;

    // Delete related data first (since we might not have Cascade deletes everywhere)
    console.log('   Deleting enrollments...');
    await prisma.enrollment.deleteMany({ where: { userId } });

    console.log('   Deleting lesson progress...');
    await prisma.lessonProgress.deleteMany({ where: { userId } });

    console.log('   Deleting certificates...');
    await prisma.certificate.deleteMany({ where: { userId } });

    console.log('   Deleting badges...');
    await prisma.userBadge.deleteMany({ where: { userId } });

    console.log('   Deleting submissions...');
    await prisma.submission.deleteMany({ where: { userId } });

    console.log('   Deleting quiz attempts...');
    await prisma.quizAttempt.deleteMany({ where: { userId } });

    // Finally delete user
    console.log('   Deleting User record...');
    await prisma.user.delete({ where: { id: userId } });

    console.log('✅ John Employee deleted successfully.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
