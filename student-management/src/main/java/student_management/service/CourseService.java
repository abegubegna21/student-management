package student_management.service;

import student_management.dto.CourseRequest;
import student_management.dto.CourseResponse;
import student_management.model.Course;
import student_management.repository.CourseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CourseService {
    private final CourseRepository repository;

    public CourseService(CourseRepository repository) {
        this.repository = repository;
    }

    public CourseResponse create(CourseRequest request) {
        if (repository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Course code already exists: " + request.getCode());
        }
        Course course = new Course();
        course.setCode(request.getCode());
        course.setTitle(request.getTitle());
        course.setCredits(request.getCredits());
        return toResponse(repository.save(course));
    }

    public List<CourseResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Course not found: " + id);
        }
        repository.deleteById(id);
    }

    private CourseResponse toResponse(Course course) {
        CourseResponse res = new CourseResponse();
        res.setId(course.getId());
        res.setCode(course.getCode());
        res.setTitle(course.getTitle());
        res.setCredits(course.getCredits());
        return res;
    }
}