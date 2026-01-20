
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🏅 Seeding Badges...');

    const badges = [
        {
            name: 'First Step',
            icon: '🌱',
            description: 'Completed your first course!',
            criteria: 'complete_1_course',
            points: 50
        },
        {
            name: 'Dedicated Learner',
            icon: '📚',
            description: 'Completed 5 courses.',
            criteria: 'complete_5_courses',
            points: 200
        },
        {
            name: 'Fast Learner',
            icon: '⚡',
            description: 'Completed a course in record time!',
            criteria: 'manual',
            points: 150
        }
    ];

    for (const badge of badges) {
        await prisma.badge.upsert({
            where: { name: badge.name },
            update: {},
            create: badge
        });
        console.log(`   - ${badge.name}`);
    }

    console.log('✅ Badges seeded successfully.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
