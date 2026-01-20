
async function checkCourses() {
    try {
        const res = await fetch('http://localhost:3001/api/courses');
        const courses = await res.json();
        console.log(`Found ${courses.length} courses.`);

        for (const course of courses) {
            console.log(`\nCourse: ${course.title} (ID: ${course.id})`);

            // Fetch details including modules
            try {
                const resDetail = await fetch(`http://localhost:3001/api/courses/${course.id}`);
                const detail = await resDetail.json();
                const modules = detail.modules || [];
                console.log(`  Modules: ${modules.length}`);

                modules.forEach((mod, i) => {
                    console.log(`    Module ${i + 1}: ${mod.title} (${mod.lessons?.length || 0} lessons)`);
                });

                if (modules.length === 0) {
                    console.log("  [WARNING] No modules found! This course cannot be completed.");
                }
            } catch (err) {
                console.log(`  Failed to fetch details: ${err.message}`);
            }
        }
    } catch (error) {
        console.error("Failed to fetch courses list:", error.message);
    }
}

checkCourses();
