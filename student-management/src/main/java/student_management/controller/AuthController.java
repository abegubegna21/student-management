package student_management.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import student_management.model.Role;
import student_management.model.User;
import student_management.repository.UserRepository;
import student_management.security.JwtUtil;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");

        if (username == null || password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Username and password are required"));
        }

        User user = userRepository.findByUsername(username.trim()).orElse(null);

        if (user != null && passwordEncoder.matches(password, user.getPassword())) {
            String roleName = user.getRole().name();
            String token = jwtUtil.generateToken(user.getUsername(), roleName);
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "username", user.getUsername(),
                    "role", roleName,
                    "message", "Login successful as " + roleName
            ));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid username or password"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            String username = auth.getName();
            User user = userRepository.findByUsername(username).orElse(null);
            String role = user != null ? user.getRole().name() : "ADMIN";
            return ResponseEntity.ok(Map.of(
                    "authenticated", true,
                    "username", username,
                    "role", role
            ));
        }
        return ResponseEntity.ok(Map.of("authenticated", false, "role", "GUEST"));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        String requestedRole = request.getOrDefault("role", "USER");

        if (username == null || username.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Username and password must not be empty"));
        }

        if (userRepository.findByUsername(username.trim()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Username already exists"));
        }

        Role role = "ADMIN".equalsIgnoreCase(requestedRole) ? Role.ADMIN : Role.USER;
        User newUser = new User(username.trim(), passwordEncoder.encode(password), role);
        userRepository.save(newUser);

        String token = jwtUtil.generateToken(newUser.getUsername(), role.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "token", token,
                "username", newUser.getUsername(),
                "role", role.name(),
                "message", "User registered successfully"
        ));
    }
}