/**
 * EduPulse - Student Management System
 * Interactive Client Architecture & Dashboard Engine
 */

// --- API Endpoints ---
const API_URL = '/api/students';
const COURSE_API_URL = '/api/courses';
const ENROLLMENT_API_URL = '/api/enrollments';

// ==========================================================================
// 0. SECURITY & AUTHENTICATION (JWT)
// ==========================================================================

function getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function toggleLogin() {
    const token = localStorage.getItem('adminToken');
    if (token) {
        // Log out
        localStorage.removeItem('adminToken');
        window.location.reload();
    } else {
        // Show login modal
        document.getElementById('login-modal').style.display = 'flex';
    }
}

function closeLogin() {
    document.getElementById('login-modal').style.display = 'none';
}

async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorBox = document.getElementById('login-error-box');

    if (!username || !password) {
        errorBox.style.display = 'block';
        errorBox.innerHTML = '<strong>Error:</strong> Please enter both username and password.';
        return;
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('adminToken', data.token);
            window.location.reload(); // Reload to apply the token to the UI
        } else {
            errorBox.style.display = 'block';
            errorBox.innerHTML = `<strong>Error:</strong> ${data.error || "Invalid credentials"}`;
        }
    } catch (err) {
        errorBox.style.display = 'block';
        errorBox.innerHTML = `<strong>Server Error:</strong> Could not reach API.`;
    }
}

// --- Application State ---
const state = {
    students: [],
    courses: [],
    enrollments: [],
    activeTab: 'dashboard-page',
    courseView: 'table', // 'table' or 'grid'
    isLiveApi: false,
    demoMode: false,
    editingStudentId: null,
    search: {
        student: '',
        course: '',
        enrollment: ''
    },
    filters: {
        courseCredit: 'all',
        enrollmentCourse: 'all'
    },
    sort: {
        student: { field: 'id', order: 'asc' },
        course: { field: 'id', order: 'asc' },
        enrollment: { field: 'id', order: 'asc' }
    }
};

// --- Mock Seed Data for Instant Demonstration ---
const SEED_DATA = {
    students: [
        { id: 101, firstName: "Alice", lastName: "Johnson", email: "alice.johnson@university.edu", dateOfBirth: "2003-04-12", enrollmentDate: "2024-09-01" },
        { id: 102, firstName: "Marcus", lastName: "Vance", email: "m.vance@techpoly.edu", dateOfBirth: "2002-11-20", enrollmentDate: "2024-09-02" },
        { id: 103, firstName: "Sophia", lastName: "Chen", email: "sophia.chen@academia.org", dateOfBirth: "2004-01-15", enrollmentDate: "2024-09-05" },
        { id: 104, firstName: "David", lastName: "Kalu", email: "david.kalu@global.edu", dateOfBirth: "2003-08-30", enrollmentDate: "2024-09-10" },
        { id: 105, firstName: "Elena", lastName: "Rostova", email: "elena.rostova@inst.edu", dateOfBirth: "2002-06-18", enrollmentDate: "2024-09-12" }
    ],
    courses: [
        { id: 201, code: "CS101", title: "Introduction to Computer Science", credits: 3 },
        { id: 202, code: "CS204", title: "Data Structures & Algorithms", credits: 4 },
        { id: 203, code: "MATH101", title: "Differential & Integral Calculus", credits: 4 },
        { id: 204, code: "AI305", title: "Machine Learning & Neural Nets", credits: 3 },
        { id: 205, code: "ENG202", title: "Technical Communication & Ethics", credits: 2 }
    ],
    enrollments: [
        { id: 301, studentId: 101, studentName: "Alice Johnson", courseId: 201, courseCode: "CS101", courseTitle: "Introduction to Computer Science", enrolledAt: "2024-09-15" },
        { id: 302, studentId: 102, studentName: "Marcus Vance", courseId: 202, courseCode: "CS204", courseTitle: "Data Structures & Algorithms", enrolledAt: "2024-09-16" },
        { id: 303, studentId: 103, studentName: "Sophia Chen", courseId: 204, courseCode: "AI305", courseTitle: "Machine Learning & Neural Nets", enrolledAt: "2024-09-18" },
        { id: 304, studentId: 104, studentName: "David Kalu", courseId: 201, courseCode: "CS101", courseTitle: "Introduction to Computer Science", enrolledAt: "2024-09-20" },
        { id: 305, studentId: 105, studentName: "Elena Rostova", courseId: 203, courseCode: "MATH101", courseTitle: "Differential & Integral Calculus", enrolledAt: "2024-09-22" }
    ]
};

// ==========================================================================
// 1. INITIALIZATION & BACKEND HEALTH CHECK
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    setupKeyboardShortcuts();
    updateAuthButtonUI();
    await checkBackendConnection();
    await refreshAllData();
});

function updateAuthButtonUI() {
    const token = localStorage.getItem('adminToken');
    const authBtn = document.getElementById('auth-btn');
    if (authBtn) {
        if (token) {
            authBtn.innerHTML = '🔓 Logout (Admin)';
            authBtn.style.backgroundColor = '#ef4444'; // Red for logout
        } else {
            authBtn.innerHTML = '🔒 Admin Login';
            authBtn.style.backgroundColor = '#4F46E5'; // Purple for login
        }
    }
}

async function checkBackendConnection() {
    updateApiStatusUI('checking');
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(API_URL, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
            state.isLiveApi = true;
            state.demoMode = false;
            updateApiStatusUI('live');
            showToast('Connected to Spring Boot', 'Live MySQL backend is online', 'success', 3000);
            return;
        }
        throw new Error('Server returned non-200');
    } catch (err) {
        state.isLiveApi = false;
        state.demoMode = true;
        updateApiStatusUI('demo');
        showToast('Interactive Demo Mode', 'Spring Boot is offline. Demo preview active with full features.', 'info', 4500);
        
        if (state.students.length === 0) {
            state.students = JSON.parse(JSON.stringify(SEED_DATA.students));
            state.courses = JSON.parse(JSON.stringify(SEED_DATA.courses));
            state.enrollments = JSON.parse(JSON.stringify(SEED_DATA.enrollments));
        }
    }
}

function updateApiStatusUI(status) {
    const headerBadge = document.getElementById('api-status-badge');
    const headerPulse = document.getElementById('header-pulse-dot');
    const headerText = document.getElementById('api-mode-text');
    const sidebarPulse = document.getElementById('sidebar-pulse-dot');
    const sidebarText = document.getElementById('sidebar-status-text');

    if (!headerBadge) return;

    if (status === 'live') {
        headerBadge.className = 'mode-badge';
        headerPulse.className = 'status-pulse-dot';
        headerText.textContent = 'Live API';
        sidebarPulse.className = 'status-pulse-dot';
        sidebarText.textContent = 'Online (8080)';
    } else if (status === 'demo') {
        headerBadge.className = 'mode-badge demo';
        headerPulse.className = 'status-pulse-dot offline';
        headerText.textContent = 'Demo Mode';
        sidebarPulse.className = 'status-pulse-dot offline';
        sidebarText.textContent = 'Demo Preview';
    } else {
        headerBadge.className = 'mode-badge demo';
        headerPulse.className = 'status-pulse-dot offline';
        headerText.textContent = 'Checking API...';
        sidebarText.textContent = 'Checking...';
    }
}

async function toggleConnectionMode() {
    if (state.isLiveApi) {
        state.isLiveApi = false;
        state.demoMode = true;
        updateApiStatusUI('demo');
        showToast('Switched to Demo Mode', 'Using local interactive memory state', 'info', 2500);
        if (state.students.length === 0) {
            state.students = JSON.parse(JSON.stringify(SEED_DATA.students));
            state.courses = JSON.parse(JSON.stringify(SEED_DATA.courses));
            state.enrollments = JSON.parse(JSON.stringify(SEED_DATA.enrollments));
        }
        renderCurrentView();
    } else {
        showToast('Testing Live Server', 'Attempting to ping /api/students...', 'info', 1800);
        await checkBackendConnection();
        await refreshAllData();
    }
}

// ==========================================================================
// 2. DATA SYNCHRONIZATION
// ==========================================================================

async function refreshAllData() {
    await Promise.all([loadStudents(), loadCourses(), loadEnrollments()]);
    updateDashboardMetrics();
    populateEnrollmentDropdowns();
}

async function loadStudents(showNotification = false) {
    if (state.isLiveApi) {
        try {
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error('Failed to fetch students');
            state.students = await res.json();
            if (showNotification) showToast('Refreshed', 'Student list updated from server', 'success', 2000);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    }
    renderStudentsTable();
    updateNavigationBadges();
    updateDashboardMetrics();
}

async function loadCourses(showNotification = false) {
    if (state.isLiveApi) {
        try {
            const res = await fetch(COURSE_API_URL);
            if (!res.ok) throw new Error('Failed to fetch courses');
            state.courses = await res.json();
            if (showNotification) showToast('Refreshed', 'Course catalog updated from server', 'success', 2000);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    }
    renderCourses();
    updateNavigationBadges();
    updateDashboardMetrics();
    populateEnrollmentDropdowns();
}

async function loadEnrollments(showNotification = false) {
    if (state.isLiveApi) {
        try {
            const res = await fetch(ENROLLMENT_API_URL);
            if (!res.ok) throw new Error('Failed to fetch enrollments');
            state.enrollments = await res.json();
            if (showNotification) showToast('Refreshed', 'Enrollments updated from server', 'success', 2000);
        } catch (error) {
            console.error('Error fetching enrollments:', error);
        }
    }
    renderEnrollmentsTable();
    updateNavigationBadges();
    updateDashboardMetrics();
}

// ==========================================================================
// 3. PAGE NAVIGATION & TABS
// ==========================================================================

function navigateTo(pageId, btnElement) {
    state.activeTab = pageId;

    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.add('hidden');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.remove('hidden');
    if (btnElement) btnElement.classList.add('active');

    const headerTitle = document.getElementById('page-title');
    const breadcrumb = document.getElementById('breadcrumb-current');

    if (pageId === 'dashboard-page') {
        headerTitle.textContent = 'Dashboard';
        breadcrumb.textContent = 'Overview';
        updateDashboardMetrics();
    } else if (pageId === 'students-page') {
        headerTitle.textContent = 'Students';
        breadcrumb.textContent = 'Directory';
        renderStudentsTable();
    } else if (pageId === 'courses-page') {
        headerTitle.textContent = 'Courses';
        breadcrumb.textContent = 'Curriculum';
        renderCourses();
    } else if (pageId === 'enrollments-page') {
        headerTitle.textContent = 'Enrollments';
        breadcrumb.textContent = 'Registry';
        renderEnrollmentsTable();
    }

    toggleMobileSidebar(false);
}

function updateNavigationBadges() {
    const sCount = document.getElementById('nav-student-count');
    const cCount = document.getElementById('nav-course-count');
    const eCount = document.getElementById('nav-enroll-count');
    if(sCount) sCount.textContent = state.students.length;
    if(cCount) cCount.textContent = state.courses.length;
    if(eCount) eCount.textContent = state.enrollments.length;
}

function renderCurrentView() {
    updateNavigationBadges();
    updateDashboardMetrics();
    renderStudentsTable();
    renderCourses();
    renderEnrollmentsTable();
    populateEnrollmentDropdowns();
}

// ==========================================================================
// 4. DASHBOARD ANALYTICS & WIDGETS
// ==========================================================================

function updateDashboardMetrics() {
    const studentCountEl = document.getElementById('stat-total-students');
    const courseCountEl = document.getElementById('stat-total-courses');
    const enrollCountEl = document.getElementById('stat-total-enrollments');
    const avgCreditsEl = document.getElementById('stat-avg-credits');

    if (studentCountEl) studentCountEl.textContent = state.students.length;
    if (courseCountEl) courseCountEl.textContent = state.courses.length;
    if (enrollCountEl) enrollCountEl.textContent = state.enrollments.length;

    if (avgCreditsEl) {
        if (state.courses.length === 0) {
            avgCreditsEl.textContent = '0.0';
        } else {
            const sumCredits = state.courses.reduce((acc, c) => acc + (Number(c.credits) || 0), 0);
            avgCreditsEl.textContent = (sumCredits / state.courses.length).toFixed(1);
        }
    }

    const recentFeedEl = document.getElementById('dashboard-recent-enrollments');
    if (recentFeedEl) {
        if (state.enrollments.length === 0) {
            recentFeedEl.innerHTML = `<div class="empty-state" style="padding: 24px;"><p style="margin: 0; color: var(--text-muted);">No enrollments recorded yet.</p></div>`;
        } else {
            const recent = [...state.enrollments].reverse().slice(0, 5);
            recentFeedEl.innerHTML = recent.map(e => {
                const initials = getInitials(e.studentName || 'Student');
                const avatarBg = getAvatarGradient(e.studentId || e.id || 1);
                return `
                    <div class="activity-item">
                        <div class="activity-avatar" style="background: ${avatarBg};">${initials}</div>
                        <div class="activity-content">
                            <div class="activity-title">${escapeHtml(e.studentName || 'Unknown Student')}</div>
                            <div class="activity-desc">
                                <span class="badge badge-code" style="font-size: 0.7rem; padding: 1px 6px;">${escapeHtml(e.courseCode || 'COURSE')}</span>
                                <span>${escapeHtml(e.courseTitle || '')}</span>
                            </div>
                        </div>
                        <div class="activity-time">${escapeHtml(e.enrolledAt || 'Recently')}</div>
                    </div>
                `;
            }).join('');
        }
    }

    const courseDistEl = document.getElementById('dashboard-course-distribution');
    if (courseDistEl) {
        if (state.courses.length === 0) {
            courseDistEl.innerHTML = '<p style="color: var(--text-muted); font-size: 0.82rem;">No courses available.</p>';
        } else {
            const totalEnrolls = state.enrollments.length || 1;
            const sortedCourses = [...state.courses].map(course => {
                const count = state.enrollments.filter(e => e.courseCode === course.code || e.courseId === course.id).length;
                return { ...course, count };
            }).sort((a, b) => b.count - a.count).slice(0, 4);

            courseDistEl.innerHTML = sortedCourses.map(c => {
                const percentage = Math.min(100, Math.round((c.count / totalEnrolls) * 100));
                return `
                    <div class="course-dist-item">
                        <div class="course-dist-header">
                            <span>${escapeHtml(c.code)} - ${escapeHtml(c.title)}</span>
                            <span>${c.count} students (${percentage}%)</span>
                        </div>
                        <div class="course-progress-bar">
                            <div class="course-progress-fill" style="width: ${percentage}%;"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

// ==========================================================================
// 5. STUDENTS MANAGEMENT (CRUD & INTERACTION)
// ==========================================================================

function filterStudents() {
    const input = document.getElementById('student-search-input');
    const clearBtn = document.getElementById('student-clear-btn');
    state.search.student = input.value.trim().toLowerCase();
    if (clearBtn) clearBtn.style.display = state.search.student ? 'block' : 'none';
    renderStudentsTable();
}

function clearStudentSearch() {
    const input = document.getElementById('student-search-input');
    if (input) input.value = '';
    state.search.student = '';
    const clearBtn = document.getElementById('student-clear-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    renderStudentsTable();
}

function sortStudents(field) {
    const current = state.sort.student;
    if (current.field === field) {
        current.order = current.order === 'asc' ? 'desc' : 'asc';
    } else {
        current.field = field;
        current.order = 'asc';
    }
    renderStudentsTable();
}

function renderStudentsTable() {
    const tbody = document.getElementById('student-list');
    const countEl = document.getElementById('student-results-count');
    const emptyState = document.getElementById('student-empty-state');
    const tableEl = document.getElementById('students-table');
    if (!tbody) return;

    ['id', 'name', 'email', 'dob', 'date'].forEach(f => {
        const iconEl = document.getElementById(`sort-student-${f}`);
        if (iconEl) {
            if (state.sort.student.field === f) {
                iconEl.textContent = state.sort.student.order === 'asc' ? '▲' : '▼';
                iconEl.style.color = 'var(--primary-light)';
            } else {
                iconEl.textContent = '⇅';
                iconEl.style.color = '';
            }
        }
    });

    let filtered = state.students.filter(s => {
        if (!state.search.student) return true;
        const q = state.search.student;
        const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
        const email = (s.email || '').toLowerCase();
        const id = String(s.id || '');
        return fullName.includes(q) || email.includes(q) || id.includes(q);
    });

    const { field, order } = state.sort.student;
    filtered.sort((a, b) => {
        let valA, valB;
        if (field === 'id') { valA = Number(a.id); valB = Number(b.id); }
        else if (field === 'name') { valA = `${a.firstName} ${a.lastName}`.toLowerCase(); valB = `${b.firstName} ${b.lastName}`.toLowerCase(); }
        else if (field === 'email') { valA = (a.email || '').toLowerCase(); valB = (b.email || '').toLowerCase(); }
        else if (field === 'dob') { valA = a.dateOfBirth || ''; valB = b.dateOfBirth || ''; }
        else if (field === 'date') { valA = a.enrollmentDate || ''; valB = b.enrollmentDate || ''; }
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
    });

    if(countEl) countEl.textContent = `Showing ${filtered.length} of ${state.students.length} students`;

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        tableEl.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    tableEl.style.display = 'table';
    emptyState.style.display = 'none';

    tbody.innerHTML = filtered.map(student => {
        const initials = getInitials(`${student.firstName} ${student.lastName}`);
        const avatarBg = getAvatarGradient(student.id);
        const dobFormatted = student.dateOfBirth ? formatDate(student.dateOfBirth) : '<span style="color:var(--text-muted);">&mdash;</span>';
        const enrollDateFormatted = student.enrollmentDate ? formatDate(student.enrollmentDate) : 'Recently';

        return `
            <tr>
                <td><span class="badge badge-id">#${student.id}</span></td>
                <td>
                    <div class="student-cell">
                        <div class="student-avatar" style="background: ${avatarBg};">${initials}</div>
                        <div>
                            <div class="student-info-name">${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</div>
                            <div class="student-info-email">${escapeHtml(student.email)}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <a href="mailto:${escapeHtml(student.email)}" style="color: var(--primary-light); text-decoration: none;">
                        ${escapeHtml(student.email)}
                    </a>
                </td>
                <td><span class="badge badge-date">${dobFormatted}</span></td>
                <td><span class="badge badge-date">${enrollDateFormatted}</span></td>
                <td>
                    <div class="table-actions-cell" style="justify-content: flex-end;">
                        <button class="btn btn-edit btn-sm" onclick="openEditStudentModal(${student.id})" title="Edit Student">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Edit
                        </button>
                        <button class="btn btn-delete btn-sm" onclick="promptDeleteStudent(${student.id}, '${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}')" title="Delete Student">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function openStudentModal() {
    state.editingStudentId = null;
    document.getElementById('student-modal-title').textContent = 'Register New Student';
    document.getElementById('student-modal-subtitle').textContent = 'Fill in demographic details to record a new student';
    document.getElementById('student-btn-text').textContent = 'Save Student';
    document.getElementById('student-id-field').value = '';
    document.getElementById('student-form').reset();
    hideModalError('student-error-box');
    document.getElementById('student-modal').classList.add('active');
    setTimeout(() => document.getElementById('firstName').focus(), 100);
}

function openEditStudentModal(id) {
    const student = state.students.find(s => s.id === id);
    if (!student) return;

    state.editingStudentId = id;
    document.getElementById('student-modal-title').textContent = 'Edit Student Record';
    document.getElementById('student-modal-subtitle').textContent = `Updating student record #${student.id}`;
    document.getElementById('student-btn-text').textContent = 'Update Student';
    document.getElementById('student-id-field').value = student.id;

    document.getElementById('firstName').value = student.firstName || '';
    document.getElementById('lastName').value = student.lastName || '';
    document.getElementById('email').value = student.email || '';
    document.getElementById('dateOfBirth').value = student.dateOfBirth || '';

    hideModalError('student-error-box');
    document.getElementById('student-modal').classList.add('active');
}

function closeStudentModal() {
    document.getElementById('student-modal').classList.remove('active');
}

async function handleStudentFormSubmit(e) {
    e.preventDefault();
    const errorBox = document.getElementById('student-error-box');
    const submitBtn = document.getElementById('student-submit-btn');

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const dateOfBirth = document.getElementById('dateOfBirth').value || null;

    if (!firstName || !lastName || !email) {
        showModalError(errorBox, 'First name, last name, and email are required.');
        return;
    }

    const payload = { firstName, lastName, email, dateOfBirth };
    submitBtn.disabled = true;

    if (state.isLiveApi) {
        try {
            const isEdit = Boolean(state.editingStudentId);
            const url = isEdit ? `${API_URL}/${state.editingStudentId}` : API_URL;
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    ...getAuthHeaders() 
                },
                body: JSON.stringify(payload)
            });

            const text = await response.text();
            let data = {};
            try { data = text ? JSON.parse(text) : {}; } catch (e) {}

            if (response.ok) {
                closeStudentModal();
                showToast(isEdit ? 'Student Updated' : 'Student Registered', `${firstName} ${lastName} successfully saved.`, 'success');
                await loadStudents();
            } else {
                formatAndShowErrors(errorBox, data, response.status);
            }
        } catch (err) {
            console.error('Save error:', err);
            showModalError(errorBox, 'Could not connect to the backend server.');
        } finally {
            submitBtn.disabled = false;
        }
    }
}

function promptDeleteStudent(id, studentName) {
    showConfirmModal({
        title: 'Delete Student?',
        message: `Are you sure you want to delete ${studentName}? This will remove the student and any associated enrollments.`,
        confirmText: 'Delete Student',
        isDanger: true,
        onConfirm: async () => {
            await executeDeleteStudent(id);
        }
    });
}

async function executeDeleteStudent(id) {
    if (state.isLiveApi) {
        try {
            const res = await fetch(`${API_URL}/${id}`, { 
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                showToast('Student Removed', 'Student record deleted successfully.', 'success');
                await loadStudents();
                await loadEnrollments();
            } else {
                showToast('Failed to Delete', 'Server rejected delete request.', 'error');
            }
        } catch (err) {
            console.error('Delete error:', err);
            showToast('Error', 'Network error.', 'error');
        }
    }
}

// ==========================================================================
// 6. COURSES MANAGEMENT (CRUD & INTERACTION)
// ==========================================================================

function filterCourses() {
    const input = document.getElementById('course-search-input');
    const creditFilter = document.getElementById('course-credit-filter');
    const clearBtn = document.getElementById('course-clear-btn');

    state.search.course = input.value.trim().toLowerCase();
    state.filters.courseCredit = creditFilter.value;
    if (clearBtn) clearBtn.style.display = state.search.course ? 'block' : 'none';
    renderCourses();
}

function clearCourseSearch() {
    const input = document.getElementById('course-search-input');
    if (input) input.value = '';
    state.search.course = '';
    const clearBtn = document.getElementById('course-clear-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    renderCourses();
}

function setCourseView(viewType) {
    state.courseView = viewType;
    document.getElementById('course-view-table-btn').classList.toggle('active', viewType === 'table');
    document.getElementById('course-view-grid-btn').classList.toggle('active', viewType === 'grid');
    renderCourses();
}

function sortCourses(field) {
    const current = state.sort.course;
    if (current.field === field) {
        current.order = current.order === 'asc' ? 'desc' : 'asc';
    } else {
        current.field = field;
        current.order = 'asc';
    }
    renderCourses();
}

function renderCourses() {
    const tbody = document.getElementById('course-list');
    const gridContainer = document.getElementById('course-grid-wrapper');
    const tableContainer = document.getElementById('course-table-wrapper');
    const countEl = document.getElementById('course-results-count');
    const emptyState = document.getElementById('course-empty-state');
    if (!tbody || !gridContainer) return;

    ['id', 'code', 'title', 'credits'].forEach(f => {
        const iconEl = document.getElementById(`sort-course-${f}`);
        if (iconEl) {
            if (state.sort.course.field === f) {
                iconEl.textContent = state.sort.course.order === 'asc' ? '▲' : '▼';
                iconEl.style.color = 'var(--primary-light)';
            } else {
                iconEl.textContent = '⇅';
                iconEl.style.color = '';
            }
        }
    });

    let filtered = state.courses.filter(c => {
        if (state.search.course) {
            const q = state.search.course;
            if (!(c.code || '').toLowerCase().includes(q) && !(c.title || '').toLowerCase().includes(q)) return false;
        }
        if (state.filters.courseCredit !== 'all') {
            const reqCredit = Number(state.filters.courseCredit);
            const courseCredit = Number(c.credits);
            if (reqCredit === 4 && courseCredit < 4) return false;
            if (reqCredit < 4 && courseCredit !== reqCredit) return false;
        }
        return true;
    });

    const { field, order } = state.sort.course;
    filtered.sort((a, b) => {
        let valA, valB;
        if (field === 'id') { valA = Number(a.id); valB = Number(b.id); }
        else if (field === 'code') { valA = (a.code || '').toLowerCase(); valB = (b.code || '').toLowerCase(); }
        else if (field === 'title') { valA = (a.title || '').toLowerCase(); valB = (b.title || '').toLowerCase(); }
        else if (field === 'credits') { valA = Number(a.credits); valB = Number(b.credits); }
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
    });

    if(countEl) countEl.textContent = `Showing ${filtered.length} of ${state.courses.length} courses`;

    if (filtered.length === 0) {
        tableContainer.style.display = 'none';
        gridContainer.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    emptyState.style.display = 'none';

    if (state.courseView === 'table') {
        tableContainer.style.display = 'block';
        gridContainer.style.display = 'none';

        tbody.innerHTML = filtered.map(course => {
            const enrolledCount = state.enrollments.filter(e => e.courseCode === course.code || e.courseId === course.id).length;
            return `
                <tr>
                    <td><span class="badge badge-id">#${course.id}</span></td>
                    <td><span class="badge badge-code">${escapeHtml(course.code)}</span></td>
                    <td><strong>${escapeHtml(course.title)}</strong></td>
                    <td><span class="badge badge-credits">&#9733; ${course.credits} Credits</span></td>
                    <td><span style="font-weight: 600; color: ${enrolledCount > 0 ? 'var(--success)' : 'var(--text-muted)'};">${enrolledCount} enrolled</span></td>
                    <td>
                        <div class="table-actions-cell" style="justify-content: flex-end;">
                            <button class="btn btn-delete btn-sm" onclick="promptDeleteCourse(${course.id}, '${escapeHtml(course.code)} - ${escapeHtml(course.title)}')" title="Delete Course">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } else {
        tableContainer.style.display = 'none';
        gridContainer.style.display = 'grid';

        gridContainer.innerHTML = filtered.map(course => {
            const enrolledCount = state.enrollments.filter(e => e.courseCode === course.code || e.courseId === course.id).length;
            return `
                <div class="course-card">
                    <div>
                        <div class="course-card-top">
                            <span class="badge badge-code">${escapeHtml(course.code)}</span>
                            <span class="badge badge-credits">&#9733; ${course.credits} Credits</span>
                        </div>
                        <h4 class="course-card-title">${escapeHtml(course.title)}</h4>
                    </div>
                    <div>
                        <div class="course-card-stats">
                            <span><strong>${enrolledCount}</strong> Students Enrolled</span>
                            <span>&bull;</span>
                            <span>Course ID: #${course.id}</span>
                        </div>
                        <div class="course-card-footer">
                            <button class="btn btn-secondary btn-sm" onclick="quickEnrollInCourse(${course.id})">Quick Enroll</button>
                            <button class="btn btn-delete btn-sm" onclick="promptDeleteCourse(${course.id}, '${escapeHtml(course.code)} - ${escapeHtml(course.title)}')">Delete</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function openCourseModal() {
    document.getElementById('course-form').reset();
    hideModalError('course-error-box');
    document.getElementById('course-modal').classList.add('active');
    setTimeout(() => document.getElementById('courseCode').focus(), 100);
}

function closeCourseModal() {
    document.getElementById('course-modal').classList.remove('active');
}

async function handleCourseFormSubmit(e) {
    e.preventDefault();
    const errorBox = document.getElementById('course-error-box');
    const submitBtn = document.getElementById('course-submit-btn');

    const code = document.getElementById('courseCode').value.trim().toUpperCase();
    const title = document.getElementById('courseTitle').value.trim();
    const credits = parseInt(document.getElementById('courseCredits').value) || 0;

    if (!code || !title || credits < 1) {
        showModalError(errorBox, 'Please enter valid code, title, and credits (min 1).');
        return;
    }

    const payload = { code, title, credits };
    submitBtn.disabled = true;

    if (state.isLiveApi) {
        try {
            const response = await fetch(COURSE_API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify(payload)
            });

            const text = await response.text();
            let data = {};
            try { data = text ? JSON.parse(text) : {}; } catch (e) {}

            if (response.ok) {
                closeCourseModal();
                showToast('Course Added', `${code} - ${title} has been added.`, 'success');
                await loadCourses();
            } else {
                formatAndShowErrors(errorBox, data, response.status);
            }
        } catch (err) {
            showModalError(errorBox, 'Could not connect to server.');
        } finally {
            submitBtn.disabled = false;
        }
    }
}

function promptDeleteCourse(id, courseName) {
    showConfirmModal({
        title: 'Delete Course?',
        message: `Are you sure you want to delete ${courseName}? This action cannot be reversed.`,
        confirmText: 'Delete Course',
        isDanger: true,
        onConfirm: async () => {
            await executeDeleteCourse(id);
        }
    });
}

async function executeDeleteCourse(id) {
    if (state.isLiveApi) {
        try {
            const res = await fetch(`${COURSE_API_URL}/${id}`, { 
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                showToast('Course Deleted', 'Course successfully removed.', 'success');
                await loadCourses();
                await loadEnrollments();
            } else {
                showToast('Error', 'Unable to delete course.', 'error');
            }
        } catch (err) {
            showToast('Error', 'Network error.', 'error');
        }
    }
}

// ==========================================================================
// 7. ENROLLMENTS MANAGEMENT (CRUD & INTERACTION)
// ==========================================================================

function filterEnrollments() {
    const input = document.getElementById('enrollment-search-input');
    const courseFilter = document.getElementById('enrollment-course-filter');
    const clearBtn = document.getElementById('enrollment-clear-btn');

    state.search.enrollment = input.value.trim().toLowerCase();
    state.filters.enrollmentCourse = courseFilter.value;
    if (clearBtn) clearBtn.style.display = state.search.enrollment ? 'block' : 'none';
    renderEnrollmentsTable();
}

function clearEnrollmentSearch() {
    const input = document.getElementById('enrollment-search-input');
    if (input) input.value = '';
    state.search.enrollment = '';
    const clearBtn = document.getElementById('enrollment-clear-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    renderEnrollmentsTable();
}

function sortEnrollments(field) {
    const current = state.sort.enrollment;
    if (current.field === field) {
        current.order = current.order === 'asc' ? 'desc' : 'asc';
    } else {
        current.field = field;
        current.order = 'asc';
    }
    renderEnrollmentsTable();
}

function renderEnrollmentsTable() {
    const tbody = document.getElementById('enrollment-list');
    const countEl = document.getElementById('enrollment-results-count');
    const emptyState = document.getElementById('enrollment-empty-state');
    const tableEl = document.getElementById('enrollments-table');
    if (!tbody) return;

    ['id', 'student', 'course', 'date'].forEach(f => {
        const iconEl = document.getElementById(`sort-enroll-${f}`);
        if (iconEl) {
            if (state.sort.enrollment.field === f) {
                iconEl.textContent = state.sort.enrollment.order === 'asc' ? '▲' : '▼';
                iconEl.style.color = 'var(--primary-light)';
            } else {
                iconEl.textContent = '⇅';
                iconEl.style.color = '';
            }
        }
    });

    let filtered = state.enrollments.filter(e => {
        if (state.search.enrollment) {
            const q = state.search.enrollment;
            const sName = (e.studentName || '').toLowerCase();
            const cCode = (e.courseCode || '').toLowerCase();
            const cTitle = (e.courseTitle || '').toLowerCase();
            const id = String(e.id || '');
            if (!sName.includes(q) && !cCode.includes(q) && !cTitle.includes(q) && !id.includes(q)) return false;
        }
        if (state.filters.enrollmentCourse !== 'all') {
            if (String(e.courseId) !== state.filters.enrollmentCourse && e.courseCode !== state.filters.enrollmentCourse) return false;
        }
        return true;
    });

    const { field, order } = state.sort.enrollment;
    filtered.sort((a, b) => {
        let valA, valB;
        if (field === 'id') { valA = Number(a.id); valB = Number(b.id); }
        else if (field === 'student') { valA = (a.studentName || '').toLowerCase(); valB = (b.studentName || '').toLowerCase(); }
        else if (field === 'course') { valA = `${a.courseCode || ''} ${a.courseTitle || ''}`.toLowerCase(); valB = `${b.courseCode || ''} ${b.courseTitle || ''}`.toLowerCase(); }
        else if (field === 'date') { valA = a.enrolledAt || ''; valB = b.enrolledAt || ''; }
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
    });

    if(countEl) countEl.textContent = `Showing ${filtered.length} of ${state.enrollments.length} enrollments`;

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        tableEl.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    tableEl.style.display = 'table';
    emptyState.style.display = 'none';

    tbody.innerHTML = filtered.map(enroll => {
        const initials = getInitials(enroll.studentName || 'Student');
        const avatarBg = getAvatarGradient(enroll.studentId || enroll.id);
        const dateFormatted = enroll.enrolledAt ? formatDate(enroll.enrolledAt) : 'Recently';

        return `
            <tr>
                <td><span class="badge badge-id">#${enroll.id}</span></td>
                <td>
                    <div class="student-cell">
                        <div class="student-avatar" style="background: ${avatarBg};">${initials}</div>
                        <div class="student-info-name">${escapeHtml(enroll.studentName || 'Student')}</div>
                    </div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="badge badge-code">${escapeHtml(enroll.courseCode || 'COURSE')}</span>
                        <span>${escapeHtml(enroll.courseTitle || '')}</span>
                    </div>
                </td>
                <td><span class="badge badge-date">${dateFormatted}</span></td>
                <td>
                    <div class="table-actions-cell" style="justify-content: flex-end;">
                        <button class="btn btn-delete btn-sm" onclick="promptDeleteEnrollment(${enroll.id}, '${escapeHtml(enroll.studentName)} from ${escapeHtml(enroll.courseCode)}')" title="Remove Enrollment">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            Remove
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function populateEnrollmentDropdowns() {
    const studentSelect = document.getElementById('enrollStudent');
    const courseSelect = document.getElementById('enrollCourse');
    const filterSelect = document.getElementById('enrollment-course-filter');

    if (studentSelect) {
        studentSelect.innerHTML = '<option value="">-- Choose a Student --</option>';
        state.students.forEach(s => {
            studentSelect.innerHTML += `<option value="${s.id}">${escapeHtml(s.firstName)} ${escapeHtml(s.lastName)} (#${s.id})</option>`;
        });
    }

    if (courseSelect) {
        courseSelect.innerHTML = '<option value="">-- Choose a Course --</option>';
        state.courses.forEach(c => {
            courseSelect.innerHTML += `<option value="${c.id}" data-code="${c.code}" data-title="${c.title}" data-credits="${c.credits}">${escapeHtml(c.code)} - ${escapeHtml(c.title)} (${c.credits} Cr)</option>`;
        });
    }

    if (filterSelect) {
        const curVal = filterSelect.value;
        filterSelect.innerHTML = '<option value="all">All Courses</option>';
        state.courses.forEach(c => {
            filterSelect.innerHTML += `<option value="${c.id}">${escapeHtml(c.code)} - ${escapeHtml(c.title)}</option>`;
        });
        filterSelect.value = curVal || 'all';
    }
}

function updateEnrollPreview() {
    const select = document.getElementById('enrollCourse');
    const preview = document.getElementById('enroll-course-preview');
    const titleEl = document.getElementById('preview-course-title');
    const creditsEl = document.getElementById('preview-course-credits');

    if (!select || !select.value) {
        if (preview) preview.style.display = 'none';
        return;
    }

    const opt = select.options[select.selectedIndex];
    if (opt && opt.dataset.code) {
        preview.style.display = 'flex';
        titleEl.textContent = `${opt.dataset.code} - ${opt.dataset.title}`;
        creditsEl.textContent = `Academic Weight: ${opt.dataset.credits} Credit Units`;
    }
}

function openEnrollmentModal(preselectCourseId = null) {
    populateEnrollmentDropdowns();
    document.getElementById('enrollment-form').reset();
    hideModalError('enrollment-error-box');

    if (preselectCourseId) {
        const courseSelect = document.getElementById('enrollCourse');
        courseSelect.value = String(preselectCourseId);
        updateEnrollPreview();
    } else {
        document.getElementById('enroll-course-preview').style.display = 'none';
    }

    document.getElementById('enrollment-modal').classList.add('active');
}

function closeEnrollmentModal() {
    document.getElementById('enrollment-modal').classList.remove('active');
}

function quickEnrollInCourse(courseId) {
    openEnrollmentModal(courseId);
}

async function handleEnrollmentFormSubmit(e) {
    e.preventDefault();
    const errorBox = document.getElementById('enrollment-error-box');
    const submitBtn = document.getElementById('enrollment-submit-btn');

    const studentId = document.getElementById('enrollStudent').value;
    const courseId = document.getElementById('enrollCourse').value;

    if (!studentId || !courseId) {
        showModalError(errorBox, 'Please select both a student and a course.');
        return;
    }

    const payload = { studentId: parseInt(studentId), courseId: parseInt(courseId) };
    submitBtn.disabled = true;

    if (state.isLiveApi) {
        try {
            const response = await fetch(ENROLLMENT_API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify(payload)
            });

            const text = await response.text();
            let data = {};
            try { data = text ? JSON.parse(text) : {}; } catch (e) {}

            if (response.ok) {
                closeEnrollmentModal();
                showToast('Student Enrolled', 'Registration confirmed in live database.', 'success');
                await loadEnrollments();
            } else {
                formatAndShowErrors(errorBox, data, response.status);
            }
        } catch (err) {
            showModalError(errorBox, 'Could not connect to backend server.');
        } finally {
            submitBtn.disabled = false;
        }
    }
}

function promptDeleteEnrollment(id, details) {
    showConfirmModal({
        title: 'Cancel Enrollment?',
        message: `Are you sure you want to remove ${details}?`,
        confirmText: 'Remove Enrollment',
        isDanger: true,
        onConfirm: async () => {
            await executeDeleteEnrollment(id);
        }
    });
}

async function executeDeleteEnrollment(id) {
    if (state.isLiveApi) {
        try {
            const res = await fetch(`${ENROLLMENT_API_URL}/${id}`, { 
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                showToast('Enrollment Cancelled', 'Student removed from course roster.', 'success');
                await loadEnrollments();
            } else {
                showToast('Error', 'Failed to remove enrollment.', 'error');
            }
        } catch (err) {
            showToast('Error', 'Network failure.', 'error');
        }
    }
}

// ==========================================================================
// 8. DATA EXPORT TO CSV
// ==========================================================================

function exportStudentsToCSV() {
    if (state.students.length === 0) return showToast('Empty List', 'No students to export.', 'info');
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Date of Birth', 'Enrollment Date'];
    const rows = state.students.map(s => [s.id, `"${s.firstName}"`, `"${s.lastName}"`, `"${s.email}"`, s.dateOfBirth || '', s.enrollmentDate || '']);
    downloadCSV('students_export.csv', [headers.join(','), ...rows.map(r => r.join(','))].join('\n'));
    showToast('Export Complete', 'Downloaded students CSV.', 'success');
}

function exportCoursesToCSV() {
    if (state.courses.length === 0) return showToast('Empty List', 'No courses to export.', 'info');
    const headers = ['ID', 'Course Code', 'Course Title', 'Credits'];
    const rows = state.courses.map(c => [c.id, `"${c.code}"`, `"${c.title}"`, c.credits]);
    downloadCSV('courses_export.csv', [headers.join(','), ...rows.map(r => r.join(','))].join('\n'));
    showToast('Export Complete', 'Downloaded courses CSV.', 'success');
}

function exportEnrollmentsToCSV() {
    if (state.enrollments.length === 0) return showToast('Empty List', 'No enrollments to export.', 'info');
    const headers = ['ID', 'Student Name', 'Course Code', 'Course Title', 'Enrolled Date'];
    const rows = state.enrollments.map(e => [e.id, `"${e.studentName || ''}"`, `"${e.courseCode || ''}"`, `"${e.courseTitle || ''}"`, e.enrolledAt || '']);
    downloadCSV('enrollments_export.csv', [headers.join(','), ...rows.map(r => r.join(','))].join('\n'));
    showToast('Export Complete', 'Downloaded enrollments CSV.', 'success');
}

function downloadCSV(filename, content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==========================================================================
// 9. TOAST NOTIFICATION & CONFIRMATION MODAL SYSTEM
// ==========================================================================

function showToast(title, message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconSvg = '';
    if (type === 'success') iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    else if (type === 'error') iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    else iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

    toast.innerHTML = `
        <div class="toast-icon">${iconSvg}</div>
        <div class="toast-body">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        <div class="toast-progress" style="transition: width ${duration}ms linear; width: 100%;"></div>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => {
        const progress = toast.querySelector('.toast-progress');
        if (progress) progress.style.width = '0%';
    });

    const timeout = setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 350);
    }, duration);

    toast.querySelector('.toast-close').addEventListener('click', () => clearTimeout(timeout));
}

let activeConfirmCallback = null;

function showConfirmModal({ title, message, confirmText = 'Confirm', isDanger = false, onConfirm }) {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-message');
    const actionBtn = document.getElementById('confirm-action-btn');

    titleEl.textContent = title;
    msgEl.textContent = message;
    actionBtn.textContent = confirmText;
    actionBtn.className = isDanger ? 'btn btn-danger' : 'btn btn-primary';

    activeConfirmCallback = onConfirm;
    actionBtn.onclick = async () => {
        modal.classList.remove('active');
        if (activeConfirmCallback) {
            await activeConfirmCallback();
            activeConfirmCallback = null;
        }
    };
    modal.classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirm-modal').classList.remove('active');
    activeConfirmCallback = null;
}

function handleModalBackdropClick(event, modalId) {
    if (event.target.id === modalId) document.getElementById(modalId).classList.remove('active');
}

function showModalError(boxEl, message) {
    boxEl.style.display = 'block';
    boxEl.innerHTML = `<strong>Attention:</strong> ${escapeHtml(message)}`;
}

function hideModalError(boxId) {
    const box = document.getElementById(boxId);
    if (box) { box.style.display = 'none'; box.innerHTML = ''; }
}

function formatAndShowErrors(boxEl, data, statusCode) {
    let html = '<strong>Please fix the following:</strong><ul>';
    if (data.details && typeof data.details === 'object') {
        for (let field in data.details) html += `<li><strong>${escapeHtml(field)}:</strong> ${escapeHtml(data.details[field])}</li>`;
    } else if (data.error) {
        html += `<li>${escapeHtml(data.error)}</li>`;
    } else {
        html += `<li>Unexpected error (Status code: ${statusCode})</li>`;
    }
    html += '</ul>';
    boxEl.innerHTML = html;
    boxEl.style.display = 'block';
}

// ==========================================================================
// 10. THEME MANAGEMENT & KEYBOARD SHORTCUTS
// ==========================================================================

function initTheme() {
    const savedTheme = localStorage.getItem('edupulse-theme') || 'dark';
    setTheme(savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    setTheme(current === 'dark' ? 'light' : 'dark');
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('edupulse-theme', theme);

    const sunIcon = document.getElementById('theme-sun-icon');
    const moonIcon = document.getElementById('theme-moon-icon');

    if (theme === 'dark') {
        if (sunIcon) sunIcon.style.display = 'block';
        if (moonIcon) moonIcon.style.display = 'none';
    } else {
        if (sunIcon) sunIcon.style.display = 'none';
        if (moonIcon) moonIcon.style.display = 'block';
    }
}

function toggleMobileSidebar(forceState) {
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const isOpen = forceState !== undefined ? forceState : !sidebar.classList.contains('open');

    if (isOpen) { sidebar.classList.add('open'); overlay.classList.add('active'); }
    else { sidebar.classList.remove('open'); overlay.classList.remove('active'); }
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            e.preventDefault();
            const searchInput = document.getElementById('global-search-input');
            if (searchInput) searchInput.focus();
        }
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
            toggleMobileSidebar(false);
        }
    });
}

function handleGlobalSearch(value) {
    const q = value.trim().toLowerCase();
    if (!q) return;

    if (state.activeTab === 'students-page') {
        const studentSearch = document.getElementById('student-search-input');
        if (studentSearch) { studentSearch.value = value; filterStudents(); }
    } else if (state.activeTab === 'courses-page') {
        const courseSearch = document.getElementById('course-search-input');
        if (courseSearch) { courseSearch.value = value; filterCourses(); }
    } else if (state.activeTab === 'enrollments-page') {
        const enrollSearch = document.getElementById('enrollment-search-input');
        if (enrollSearch) { enrollSearch.value = value; filterEnrollments(); }
    }
}

// ==========================================================================
// 11. GENERAL UTILITIES
// ==========================================================================

function getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarGradient(id) {
    const gradients = [
        'linear-gradient(135deg, #6366f1, #8b5cf6)',
        'linear-gradient(135deg, #ec4899, #f43f5e)',
        'linear-gradient(135deg, #10b981, #06b6d4)',
        'linear-gradient(135deg, #f59e0b, #ea580c)',
        'linear-gradient(135deg, #3b82f6, #6366f1)',
        'linear-gradient(135deg, #8b5cf6, #d946ef)'
    ];
    return gradients[(Number(id) || 0) % gradients.length];
}

function formatDate(dateString) {
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return dateString;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}