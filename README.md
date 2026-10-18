# 🎓 Student Management System

🔗 **Live Demo:** [Click here to view the live app](https://YOUR-LIVE-URL-HERE.up.railway.app)

A full-stack web application designed to manage students, courses, and enrollments. This project demonstrates a complete enterprise architecture, from the database to the user interface.

## 🚀 Features
- **Student Management:** Complete CRUD (Create, Read, Update, Delete) operations for students.
- **Course Management:** Create and manage available courses.
- **Enrollment System:** Enroll students into courses using relational database mapping.
- **Modern UI:** A clean, responsive dashboard built with Vanilla JavaScript.
- **Cloud Hosted:** Deployed live on Railway with a cloud MySQL database.

## 🛠️ Tech Stack
- **Backend:** Java 21, Spring Boot 3, Spring Data JPA, Hibernate
- **Database:** MySQL 8
- **Frontend:** HTML5, CSS3, Vanilla JavaScript (Fetch API)
- **Deployment:** Railway (App & Database)

## 💻 How to Run Locally
1. Clone the repository: `git clone https://github.com/abegubegna21/student-management.git`
2. Create a MySQL database named `student_db`.
3. Update `src/main/resources/application.properties` with your local database credentials.
4. Run the application: `./mvnw spring-boot:run`
5. Open `http://localhost:8080` in your browser.