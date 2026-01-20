
async function checkLessons() {
    try {
        const res = await fetch('http://localhost:3001/api/courses');
        const courses = await res.json();

        for (const course of courses) {
            const resDetail = await fetch(`http://localhost:3001/api/courses/${course.id}`);
            const detail = await resDetail.json();
            const modules = detail.modules || [];

            console.log(`Course: ${course.title}`);
            modules.forEach(mod => {
                mod.lessons.forEach(lesson => {
                    console.log(`  Lesson: ${lesson.title}`);
                    console.log(`    Content: ${lesson.content ? lesson.content.substring(0, 50) + '...' : 'NULL'}`);
                    console.log(`    Video: ${lesson.videoUrl || 'NULL'}`);
                });
            });
        }
    } catch (error) {
        console.error(error.message);
    }
}

checkLessons();
