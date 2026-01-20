
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Updating John Employee for Analytics Demo...');

    // 1. Find John
    const john = await prisma.user.findUnique({
        where: { email: 'student@lms.com' }
    });

    if (!john) {
        console.error('❌ User student@lms.com not found. Did you run seed?');
        return;
    }

    // 2. Find a Course
    const course = await prisma.course.findFirst({
        where: { status: 'PUBLISHED' }
    });

    if (!course) {
        console.error('❌ No published course found.');
        return;
    }

    // 3. Complete the enrollment
    console.log(`✅ Marking course "${course.title}" as completed for ${john.name}...`);
    await prisma.enrollment.upsert({
        where: {
            userId_courseId: {
                userId: john.id,
                courseId: course.id
            }
        },
        update: { progress: 100 },
        create: {
            userId: john.id,
            courseId: course.id,
            progress: 100
        }
    });

    // 4. Create and Award a Badge
    console.log('🏆 Awarding "Fast Learner" badge...');
    const badge = await prisma.badge.upsert({
        where: { name: 'Fast Learner' },
        update: {},
        create: {
            name: 'Fast Learner',
            icon: '⚡',
            description: 'Completed a course in record time!',
            criteria: 'manual',
            points: 150
        }
    });

    await prisma.userBadge.create({
        data: {
            userId: john.id,
            badgeId: badge.id
        }
    }).catch(() => console.log('   (Badge already earned)'));

    console.log('✨ Done! John Employee should now have 200 points (50 course + 150 badge).');
    console.log('👉 Refresh /admin/analytics to see the change.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
