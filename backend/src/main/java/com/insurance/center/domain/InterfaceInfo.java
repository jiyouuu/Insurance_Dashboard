package com.insurance.center.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "interface_info")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class InterfaceInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;           // 인터페이스명
    private String institution;    // 기관명

    @Enumerated(EnumType.STRING)
    private Protocol protocol;     // REST, SOAP, MQ, BATCH, SFTP, FTP

    @Enumerated(EnumType.STRING)
    private InterfaceStatus status; // NORMAL, ERROR, PENDING, RUNNING

    private String description;
    private String url;
    private String scheduleCron;

    private LocalDateTime lastExecutedAt;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum Protocol {
        REST, SOAP, MQ, BATCH, SFTP, FTP
    }

    public enum InterfaceStatus {
        NORMAL, ERROR, PENDING, RUNNING
    }
}