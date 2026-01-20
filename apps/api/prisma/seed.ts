import { PrismaClient, Role, CourseStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // 1. Clean up existing data (Safe Order for Foreign Keys)
    // Delete "Leaf" nodes first (tables that depend on others but nothing depends on them)
    await prisma.lessonProgress.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.certificate.deleteMany();
    await prisma.review.deleteMany();
    await prisma.discussion.deleteMany();
    await prisma.courseTag.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.attachment.deleteMany();
    await (prisma as any).notification.deleteMany();
    await (prisma as any).courseDivision.deleteMany();

    // Delete "Middle" nodes
    await prisma.assignment.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.module.deleteMany();
    await prisma.quizAnswer.deleteMany();
    await prisma.quizAttempt.deleteMany();
    await prisma.questionOption.deleteMany();
    await prisma.question.deleteMany();
    await prisma.quiz.deleteMany();

    // Delete "Root" nodes (referenced by others)
    await prisma.course.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await (prisma as any).division.deleteMany();

    console.log('🧹 Database cleaned.');

    // 2. Create Users
    const password = await bcrypt.hash('admin123', 10);
    const studentPassword = await bcrypt.hash('user123', 10);

    const admin = await prisma.user.create({
        data: {
            email: 'admin@lms.com',
            name: 'Super Administrator',
            password,
            role: Role.ADMIN,
        },
    });

    const student = await prisma.user.create({
        data: {
            email: 'student@lms.com',
            name: 'John Employee',
            password: studentPassword,
            role: Role.STUDENT,
        },
    });

    const instructor = await prisma.user.create({
        data: {
            email: 'instructor@lms.com',
            name: 'Sarah Trainer',
            password: studentPassword,
            role: Role.INSTRUCTOR,
        },
    });

    console.log('👥 Users created: Admin, Student, Instructor');

    // 2.5 Create Divisions
    const divIT = await (prisma as any).division.create({
        data: { name: 'Information Technology', code: 'DIV-IT' }
    });
    const divHR = await (prisma as any).division.create({
        data: { name: 'Human Resources', code: 'DIV-HR' }
    });
    const divFinance = await (prisma as any).division.create({
        data: { name: 'Finance & Accounting', code: 'DIV-FIN' }
    });
    const divMarketing = await (prisma as any).division.create({
        data: { name: 'Marketing', code: 'DIV-MKT' }
    });
    const divOperations = await (prisma as any).division.create({
        data: { name: 'Operations', code: 'DIV-OPS' }
    });

    console.log('🏢 Divisions created: IT, HR, Finance, Marketing, Operations');

    // Assign users to divisions
    await prisma.user.update({
        where: { id: student.id },
        data: { divisionId: divIT.id } as any
    });
    await prisma.user.update({
        where: { id: instructor.id },
        data: { divisionId: divHR.id } as any
    });

    console.log('👤 Users assigned to divisions');

    // 3. Create Courses
    // Course 1: Onboarding
    const courseOnboarding = await prisma.course.create({
        data: {
            title: 'Company Onboarding 2024',
            description: 'Essential guide for all new employees joining our company. Covers culture, tools, and compliance.',
            thumbnail: 'bg-blue-100',
            status: CourseStatus.PUBLISHED,
            instructor: { connect: { id: admin.id } },
            category: {
                create: { name: 'Onboarding' }
            },
            modules: {
                create: [
                    {
                        title: 'Welcome & Vision',
                        order: 1,
                        lessons: {
                            create: [
                                {
                                    title: 'Message from our CEO',
                                    order: 1,
                                    content: 'Welcome to the team! In this video, our CEO explains the vision for 2024...',
                                    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Dummy
                                },
                                {
                                    title: 'Core Values & Culture',
                                    order: 2,
                                    content: '# Our Values\n\n1. **Integrity**: We do the right thing.\n2. **Innovation**: We dream big.\n3. **Customer First**: We serve with heart.',
                                },
                            ],
                        },
                    },
                    {
                        title: 'IT & Security',
                        order: 2,
                        lessons: {
                            create: [
                                {
                                    title: 'Setting up your workstation',
                                    order: 1,
                                    content: 'Step-by-step guide to installing VPN, Slack, and Jira.',
                                },
                                {
                                    title: 'Cyber Security Basics',
                                    order: 2,
                                    content: 'How to identify phishing emails and protect company data.',
                                },
                            ],
                        },
                    },
                ],
            },
        },
    });

    // Course 2: Technical Skill (Draft)
    await prisma.course.create({
        data: {
            title: 'Advanced React Patterns',
            description: 'Deep dive into hooks, context, and performance optimization.',
            thumbnail: 'bg-black',
            status: CourseStatus.DRAFT,
            instructor: { connect: { id: instructor.id } },
            category: {
                create: { name: 'Engineering' }
            },
        },
    });

    // Course 3: Compliance
    const courseCompliance = await prisma.course.create({
        data: {
            title: 'Workplace Harassment Policy',
            description: 'Mandatory training for maintaining a safe and respectful workplace.',
            thumbnail: 'bg-purple-100',
            status: CourseStatus.PUBLISHED,
            instructor: { connect: { id: admin.id } },
            category: {
                create: { name: 'Compliance' }
            },
            modules: {
                create: [
                    {
                        title: 'Understanding Harassment',
                        order: 1,
                        lessons: {
                            create: [
                                {
                                    title: 'Definitions & Examples',
                                    order: 1,
                                    content: `# What is Workplace Harassment?

Workplace harassment includes any unwelcome conduct that creates an intimidating, hostile, or offensive work environment.

## Types of Harassment

1. **Verbal Harassment** - Offensive jokes, slurs, name-calling
2. **Physical Harassment** - Unwanted touching, blocking movement
3. **Visual Harassment** - Offensive images, gestures, or emails
4. **Sexual Harassment** - Unwanted advances, requests for favors

## Key Points to Remember

- Harassment can occur between any individuals in the workplace
- A single serious incident can constitute harassment
- Intent does not determine whether conduct is harassment
`
                                },
                                {
                                    title: 'Reporting Procedures',
                                    order: 2,
                                    content: `# How to Report Harassment

## Step 1: Document the Incident
- Record date, time, location
- Note witnesses if any
- Save any written evidence

## Step 2: Report to HR
Contact HR department via:
- Email: hr@company.com
- Phone: Internal ext. 2000
- In person: HR Office, Floor 3

## Step 3: Follow Up
HR will investigate within 5 business days and keep you informed of the process.

## Protection Against Retaliation
The company strictly prohibits retaliation against anyone who reports harassment in good faith.
`
                                },
                            ],
                        },
                    },
                    {
                        title: 'Prevention & Response',
                        order: 2,
                        lessons: {
                            create: [
                                {
                                    title: 'Bystander Intervention',
                                    order: 1,
                                    content: `# How to Intervene as a Bystander

## The 5 D's of Bystander Intervention

1. **Direct** - Directly address the situation
2. **Distract** - Create a distraction to defuse the situation
3. **Delegate** - Ask someone else to help (security, HR, manager)
4. **Document** - Record the incident to support the target
5. **Delay** - Check in with the target after the incident

## Tips for Safe Intervention
- Assess your safety first
- Stay calm and professional
- Support the target, not the harasser
`
                                },
                                {
                                    title: 'Creating a Respectful Workplace',
                                    order: 2,
                                    content: `# Building a Respectful Culture

## Daily Practices

- Use inclusive language
- Respect personal boundaries
- Listen actively to colleagues
- Give credit where it's due

## What We Expect From You

✅ Treat everyone with dignity and respect
✅ Speak up when you see inappropriate behavior
✅ Complete annual harassment prevention training
✅ Support colleagues who report concerns

## Quiz Reminder
After completing this course, please take the quiz to earn your completion certificate.
`
                                },
                            ],
                        },
                    },
                ],
            },
        },
    });

    console.log('📚 Courses created.');

    // 4. Enroll Student
    await prisma.enrollment.create({
        data: {
            userId: student.id,
            courseId: courseOnboarding.id,
            progress: 15, // Started
        },
    });

    await prisma.enrollment.create({
        data: {
            userId: student.id,
            courseId: courseCompliance.id,
            progress: 100, // Completed
        },
    });

    console.log('🎓 Student enrolled in courses.');

    // 5. Assign courses to divisions
    // Onboarding course - All divisions (no specific division = all can see)
    // We'll leave it without division assignments = available to all

    // Add IT-specific course to IT division
    await (prisma as any).courseDivision.create({
        data: {
            courseId: courseOnboarding.id,
            divisionId: divIT.id,
            isMandatory: true // Mandatory for IT
        }
    });
    await (prisma as any).courseDivision.create({
        data: {
            courseId: courseOnboarding.id,
            divisionId: divHR.id,
            isMandatory: true // Mandatory for HR too
        }
    });

    // Compliance course - HR mandatory
    await (prisma as any).courseDivision.create({
        data: {
            courseId: courseCompliance.id,
            divisionId: divHR.id,
            isMandatory: true
        }
    });

    console.log('📋 Courses assigned to divisions with mandatory flags.');

    // 8. Create Badges for automatic awards
    const badgeFirstStep = await (prisma as any).badge.upsert({
        where: { name: 'First Step' },
        update: {},
        create: {
            name: 'First Step',
            description: 'Complete your first course',
            icon: '🎯',
            criteria: 'Complete 1 course',
            points: 100,
        }
    });

    const badgeDedicatedLearner = await (prisma as any).badge.upsert({
        where: { name: 'Dedicated Learner' },
        update: {},
        create: {
            name: 'Dedicated Learner',
            description: 'Complete 5 courses',
            icon: '📚',
            criteria: 'Complete 5 courses',
            points: 500,
        }
    });

    const badgeQuizMaster = await (prisma as any).badge.upsert({
        where: { name: 'Quiz Master' },
        update: {},
        create: {
            name: 'Quiz Master',
            description: 'Pass 10 quizzes',
            icon: '🧠',
            criteria: 'Pass 10 quizzes',
            points: 300,
        }
    });

    const badgePerfectScore = await (prisma as any).badge.upsert({
        where: { name: 'Perfect Score' },
        update: {},
        create: {
            name: 'Perfect Score',
            description: 'Score 100% on any quiz',
            icon: '💯',
            criteria: 'Score 100% on a quiz',
            points: 200,
        }
    });

    console.log('🏆 Badges created: First Step, Dedicated Learner, Quiz Master, Perfect Score');
    console.log('✅ Seed completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
