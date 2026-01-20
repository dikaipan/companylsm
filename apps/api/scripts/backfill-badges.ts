
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Backfilling badges for existing completions...');

    // 1. Get all users
    const users = await prisma.user.findMany({
        include: {
            enrollments: {
                where: { progress: 100 }
            }
        }
    });

    // 2. Define Badge Rules
    const firstStepBadge = await prisma.badge.findUnique({ where: { name: 'First Step' } });
    const dedicatedBadge = await prisma.badge.findUnique({ where: { name: 'Dedicated Learner' } });

    if (!firstStepBadge || !dedicatedBadge) {
        console.error('❌ Badges not found. Run seed-badges.ts first.');
        return;
    }

    for (const user of users) {
        const completedCount = user.enrollments.length;
        if (completedCount === 0) continue;

        console.log(`👤 Checking ${user.name} (${completedCount} completed courses)...`);

        // Rule 1: First Step (>= 1 course)
        if (completedCount >= 1) {
            await awardIfNotExists(user.id, firstStepBadge.id, firstStepBadge.name);
        }

        // Rule 2: Dedicated Learner (>= 5 courses)
        if (completedCount >= 5) {
            await awardIfNotExists(user.id, dedicatedBadge.id, dedicatedBadge.name);
        }
    }

    console.log('✅ Backfill complete.');
}

async function awardIfNotExists(userId: string, badgeId: string, badgeName: string) {
    const existing = await prisma.userBadge.findUnique({
        where: { userId_badgeId: { userId, badgeId } }
    });

    if (!existing) {
        await prisma.userBadge.create({
            data: { userId, badgeId }
        });
        console.log(`   🏆 Awarded "${badgeName}"`);
    } else {
        console.log(`   (Already has "${badgeName}")`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
