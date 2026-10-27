package student_management.service;

import student_management.dto.EnrollmentRequest;
import student_management.dto.EnrollmentResponse;
import student_management.model.Course;
import student_management.model.Enrollment;
import student_management.model.Student;
import student_management.repository.CourseRepository;
import student_management.repository.EnrollmentRepository;
import student_management.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class EnrollmentService {
    private final EnrollmentRepository repository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;

    public EnrollmentService(EnrollmentRepository repository, StudentRepository studentRepository, CourseRepository courseRepository) {
        this.repository = repository;
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
    }

    public EnrollmentResponse enroll(EnrollmentRequest request) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        Enrollment enrollment = new Enrollment(student, course, LocalDate.now());
        return toResponse(repository.save(enrollment));
    }

    public List<EnrollmentResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Enrollment not found");
        }
        repository.deleteById(id);
    }

    private EnrollmentResponse toResponse(Enrollment enrollment) {
        EnrollmentResponse res = new EnrollmentResponse();
        res.setId(enrollment.getId());
        res.setStudentName(enrollment.getStudent().getFirstName() + " " + enrollment.getStudent().getLastName());
        res.setCourseCode(enrollment.getCourse().getCode());
        res.setCourseTitle(enrollment.getCourse().getTitle());
        res.setEnrolledAt(enrollment.getEnrolledAt());
        return res;
    }
}