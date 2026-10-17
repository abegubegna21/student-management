const API_URL = '/api/students';

// 1. Load students when the page loads
document.addEventListener('DOMContentLoaded', loadStudents);

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