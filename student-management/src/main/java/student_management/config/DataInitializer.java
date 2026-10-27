package student_management.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import student_management.model.Role;
import student_management.model.User;
import student_management.repository.UserRepository;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. Ensure Default ADMIN User (Full privileges to do EVERYTHING)
            userRepository.findByUsername("admin").ifPresentOrElse(
                    admin -> {
                        if (admin.getRole() != Role.ADMIN) {
                            admin.setRole(Role.ADMIN);
                            userRepository.save(admin);
                        }
                    },
                    () -> {
                        User admin = new User();
                        admin.setUsername("admin");
                        admin.setPassword(passwordEncoder.encode("admin123"));
                        admin.setRole(Role.ADMIN);
                        userRepository.save(admin);
                        System.out.println("==================================================");
                        System.out.println("✅ Default ADMIN created successfully!");
                        System.out.println("   Username: admin");
                        System.out.println("   Password: admin123");
                        System.out.println("   Role:     ADMIN (Full system access)");
                        System.out.println("==================================================");
                    }
            );

            // 2. Ensure Default Regular USER (Read-only / limited demo access)
            if (userRepository.findByUsername("user").isEmpty()) {
                User user = new User();
                user.setUsername("user");
                user.setPassword(passwordEncoder.encode("user123"));
                user.setRole(Role.USER);
                userRepository.save(user);
                System.out.println("ℹ️ Default Regular USER created (Username: user, Password: user123, Role: USER)");
            }
        };
    }
}