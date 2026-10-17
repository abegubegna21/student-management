package student_management.service;

import student_management.dto.StudentRequest;
import student_management.dto.StudentResponse;
import student_management.model.Student;
import student_management.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class StudentService {
    private final StudentRepository repository;

    public StudentService(StudentRepository repository) {
        this.repository = repository;
    }

    public StudentResponse create(StudentRequest request) {
        if (repository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }
        Student student = new Student();
        student.setFirstName(request.getFirstName());
        student.setLastName(request.getLastName());
        student.setEmail(request.getEmail());
        student.setDateOfBirth(request.getDateOfBirth());
        student.setEnrollmentDate(LocalDate.now());
        
        return toResponse(repository.save(student));
    }

    public List<StudentResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    public StudentResponse findById(Long id) {
        Student student = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Student not found: " + id));
        return toResponse(student);
    }

    public StudentResponse update(Long id, StudentRequest request) {
        Student student = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Student not found: " + id));

        student.setFirstName(request.getFirstName());
        student.setLastName(request.getLastName());
        student.setEmail(request.getEmail());
        student.setDateOfBirth(request.getDateOfBirth());

        return toResponse(repository.save(student));
    }

    public void delete(Long id) {
        repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Student not found: " + id));
        repository.deleteById(id);
    }

    private StudentResponse toResponse(Student student) {
        StudentResponse res = new StudentResponse();
        res.setId(student.getId());
        res.setFirstName(student.getFirstName());
        res.setLastName(student.getLastName());
        res.setEmail(student.getEmail());
        res.setDateOfBirth(student.getDateOfBirth());
        res.setEnrollmentDate(student.getEnrollmentDate());
        return res;
    }
}