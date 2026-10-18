const API_URL = '/api/students';
const COURSE_API_URL = '/api/courses';

// 1. Load students when the page loads
// 1. Load students AND courses when the page loads
// --- PAGE NAVIGATION LOGIC ---
function showPage(pageId, btnElement) {
    // Hide all pages
    document.querySelectorAll('.page-section').forEach(page => {
        page.classList.add('hidden');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected page
    document.getElementById(pageId).classList.remove('hidden');
    
    // Highlight selected button
    if (btnElement) {
        btnElement.classList.add('active');
    }
}
document.addEventListener('DOMContentLoaded', () => {
    loadStudents();
    loadCourses();
    loadEnrollments();
    
    // Small delay to ensure students and courses are loaded before populating dropdowns
    setTimeout(() => {
        populateDropdowns();
    }, 500); 
});

// 2. Handle form submission
document.getElementById('student-form').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent page reload
    await addStudent();
});

// Fetch and display all students
async function loadStudents() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Failed to fetch students");
        
        const students = await response.json();
        const tbody = document.getElementById('student-list');
        tbody.innerHTML = ''; // Clear table

        if (students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No students found.</td></tr>';
            return;
        }

        students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.id}</td>
                <td>${student.firstName} ${student.lastName}</td>
                <td>${student.email}</td>
                <td>${student.enrollmentDate}</td>
                <td>
                    <button class="btn-delete" onclick="deleteStudent(${student.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading students:", error);
    }
}

// Add a new student (POST)
async function addStudent() {
    const errorBox = document.getElementById('error-box');
    errorBox.classList.add('hidden');
    errorBox.innerHTML = '';

    const newStudent = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        dateOfBirth: document.getElementById('dateOfBirth').value || null
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newStudent)
        });

        // Safely read the response to avoid JSON crash
        const text = await response.text();
        let data = {};
        try {
            data = text ? JSON.parse(text) : {};
        } catch (e) {
            console.error("Could not parse JSON response", text);
        }

        if (response.ok) {
            document.getElementById('student-form').reset(); // Clear form
            await loadStudents(); // Refresh table
        } else {
            // Extract our custom Java error messages safely
            let errorMessages = "";
            
            if (data.details && typeof data.details === 'object') {
                for (let field in data.details) {
                    errorMessages += `<li><strong>${field}:</strong> ${data.details[field]}</li>`;
                }
            } else if (data.error) {
                errorMessages = `<li>${data.error}</li>`;
            } else {
                errorMessages = `<li>Unknown error. Status: ${response.status}</li>`;
            }
            
            errorBox.innerHTML = `<strong>Please fix the following:</strong><ul>${errorMessages}</ul>`;
            errorBox.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Error adding student:", error);
        errorBox.innerHTML = `<strong>Error:</strong> Could not connect to the server.`;
        errorBox.classList.remove('hidden');
    }
}

// Delete a student (DELETE)
async function deleteStudent(id) {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadStudents(); // Refresh table
        } else {
            alert("Failed to delete student.");
        }
    } catch (error) {
        console.error("Error deleting student:", error);
    }
}
// ==========================================
// COURSE FUNCTIONS
// ==========================================

document.getElementById('course-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addCourse();
});

async function loadCourses() {
    try {
        const response = await fetch(COURSE_API_URL);
        if (!response.ok) throw new Error("Failed to fetch courses");
        
        const courses = await response.json();
        const tbody = document.getElementById('course-list');
        tbody.innerHTML = ''; 

        if (courses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No courses found.</td></tr>';
            return;
        }

        courses.forEach(course => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${course.id}</td>
                <td><strong>${course.code}</strong></td>
                <td>${course.title}</td>
                <td>${course.credits}</td>
                <td>
                    <button class="btn-delete" onclick="deleteCourse(${course.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading courses:", error);
    }
}

async function addCourse() {
    const errorBox = document.getElementById('course-error-box');
    errorBox.classList.add('hidden');
    errorBox.innerHTML = '';

    const newCourse = {
        code: document.getElementById('courseCode').value,
        title: document.getElementById('courseTitle').value,
        credits: parseInt(document.getElementById('courseCredits').value) || 0
    };

    try {
        const response = await fetch(COURSE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCourse)
        });

        const text = await response.text();
        let data = {};
        try {
            data = text ? JSON.parse(text) : {};
        } catch (e) {}

        if (response.ok) {
            document.getElementById('course-form').reset();
            await loadCourses();
        } else {
            let errorMessages = "";
            if (data.details && typeof data.details === 'object') {
                for (let field in data.details) {
                    errorMessages += `<li><strong>${field}:</strong> ${data.details[field]}</li>`;
                }
            } else if (data.error) {
                errorMessages = `<li>${data.error}</li>`;
            } else {
                errorMessages = `<li>Unknown error. Status: ${response.status}</li>`;
            }
            errorBox.innerHTML = `<strong>Please fix the following:</strong><ul>${errorMessages}</ul>`;
            errorBox.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Error adding course:", error);
    }
}

async function deleteCourse(id) {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
        const response = await fetch(`${COURSE_API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadCourses();
        } else {
            alert("Failed to delete course.");
        }
    } catch (error) {
        console.error("Error deleting course:", error);
    }
}
// ==========================================
// ENROLLMENT FUNCTIONS
// ==========================================

const ENROLLMENT_API_URL = '/api/enrollments';

// Load enrollments when page loads
document.addEventListener('DOMContentLoaded', () => {
    // We append to the existing DOMContentLoaded so we don't overwrite the other two
    setTimeout(() => {
        loadEnrollments();
        populateDropdowns();
    }, 500); // Small delay to ensure students and courses load first
});

document.getElementById('enrollment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await enrollStudent();
});

async function populateDropdowns() {
    try {
        // Populate Students
        const studentRes = await fetch(API_URL);
        const students = await studentRes.json();
        const studentSelect = document.getElementById('enrollStudent');
        studentSelect.innerHTML = '<option value="">-- Choose a Student --</option>';
        students.forEach(s => {
            studentSelect.innerHTML += `<option value="${s.id}">${s.firstName} ${s.lastName}</option>`;
        });

        // Populate Courses
        const courseRes = await fetch(COURSE_API_URL);
        const courses = await courseRes.json();
        const courseSelect = document.getElementById('enrollCourse');
        courseSelect.innerHTML = '<option value="">-- Choose a Course --</option>';
        courses.forEach(c => {
            courseSelect.innerHTML += `<option value="${c.id}">${c.code} - ${c.title}</option>`;
        });
    } catch (error) {
        console.error("Error populating dropdowns:", error);
    }
}

async function loadEnrollments() {
    try {
        const response = await fetch(ENROLLMENT_API_URL);
        const enrollments = await response.json();
        const tbody = document.getElementById('enrollment-list');
        tbody.innerHTML = '';

        if (enrollments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No enrollments yet.</td></tr>';
            return;
        }

        enrollments.forEach(e => {
            tbody.innerHTML += `
                <tr>
                    <td>${e.id}</td>
                    <td>${e.studentName}</td>
                    <td><strong>${e.courseCode}</strong> - ${e.courseTitle}</td>
                    <td>${e.enrolledAt}</td>
                    <td>
                        <button class="btn-delete" onclick="deleteEnrollment(${e.id})">Remove</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error loading enrollments:", error);
    }
}

async function enrollStudent() {
    const errorBox = document.getElementById('enrollment-error-box');
    errorBox.classList.add('hidden');

    const studentId = document.getElementById('enrollStudent').value;
    const courseId = document.getElementById('enrollCourse').value;

    if (!studentId || !courseId) {
        alert("Please select both a student and a course.");
        return;
    }

    try {
        const response = await fetch(ENROLLMENT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: parseInt(studentId), courseId: parseInt(courseId) })
        });

        if (response.ok) {
            document.getElementById('enrollment-form').reset();
            await loadEnrollments();
        } else {
            const data = await response.json();
            errorBox.innerHTML = `<strong>Error:</strong> ${data.details ? data.details.message : data.error}`;
            errorBox.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Error enrolling:", error);
    }
}
async function deleteEnrollment(id) {
    if (!confirm("Are you sure you want to remove this enrollment?")) return;

    try {
        const response = await fetch(`${ENROLLMENT_API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadEnrollments();
        } else {
            alert("Failed to remove enrollment.");
        }
    } catch (error) {
        console.error("Error deleting enrollment:", error);
    }
}