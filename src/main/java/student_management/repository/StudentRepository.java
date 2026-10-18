package student_management.repository;

import student_management.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    
    // Spring Data JPA automatically translates this method name into:
    // SELECT COUNT(*) > 0 FROM students WHERE email = ?
    boolean existsByEmail(String email);
    
}