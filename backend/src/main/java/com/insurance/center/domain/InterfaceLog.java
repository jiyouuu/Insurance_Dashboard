package com.insurance.center.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "interface_log")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class InterfaceLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interface_id")
    private InterfaceInfo interfaceInfo;

    private LocalDateTime executedAt;

    @Enumerated(EnumType.STRING)
    private LogResult result;   

    private String message;
    private Long durationMs;    // 실행 소요시간 (ms)

    public enum LogResult {
    	SUCCESS, FAILURE, INFO, WARN
    }
}