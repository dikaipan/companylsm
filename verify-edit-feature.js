const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
// REPLACE WITH A VALID TOKEN
const TOKEN = 'YOUR_ADMIN_TOKEN_HERE';

async function testEditFlow() {
    try {
        console.log("1. Fetching Courses (Admin)...");
        const coursesRes = await axios.get(`${API_URL}/courses/admin`, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        });
        const course = coursesRes.data[0];
        if (!course) {
            console.log("No courses found to test.");
            return;
        }
        console.log(`Found course: ${course.title} (${course.id})`);

        console.log("2. Updating Course Title...");
        await axios.patch(`${API_URL}/courses/${course.id}`, {
            title: course.title + " (Updated)"
        }, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        });
        console.log("Course updated.");

        console.log("3. Creating Module...");
        const moduleRes = await axios.post(`${API_URL}/modules`, {
            title: "Test Module",
            courseId: course.id,
            order: 99
        }, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        });
        const moduleId = moduleRes.data.id;
        console.log(`Module created: ${moduleId}`);

        console.log("4. Creating Lesson...");
        const lessonRes = await axios.post(`${API_URL}/lessons`, {
            title: "Test Lesson",
            moduleId: moduleId,
            order: 1,
            content: "Initial Content"
        }, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        });
        const lessonId = lessonRes.data.id;
        console.log(`Lesson created: ${lessonId}`);

        console.log("5. Updating Lesson Content...");
        await axios.patch(`${API_URL}/lessons/${lessonId}`, {
            content: "# Updated Content\n\nThis is the new content."
        }, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        });
        console.log("Lesson updated.");

        console.log("6. Cleaning up (Deleting Module - cascades to lessons)...");
        // Implementing delete module in the verification script if endpoint exists
        // await axios.delete(`${API_URL}/modules/${moduleId}`, {
        //     headers: { Authorization: `Bearer ${TOKEN}` }
        // });
        // console.log("Cleanup done.");

        console.log("SUCCESS: Edit flow verified via API.");

    } catch (error) {
        console.error("Verification Failed:", error.response ? error.response.data : error.message);
    }
}

// Ensure you run this with a valid token
console.log("Please run this script with a valid ADMIN token set in the code.");
// testEditFlow();
