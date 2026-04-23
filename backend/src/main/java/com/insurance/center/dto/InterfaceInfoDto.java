package com.insurance.center.dto;

import lombok.*;
import java.time.LocalDateTime;

import com.insurance.center.domain.InterfaceInfo;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class InterfaceInfoDto {
    private Long id;
    private String name;
    private String institution;
    private String protocol;
    private String status;
    private String description;
    private String url;
    private String scheduleCron;
    private LocalDateTime lastExecutedAt;
    private LocalDateTime createdAt;

    public static InterfaceInfoDto from(InterfaceInfo e) {
        return InterfaceInfoDto.builder()
                .id(e.getId())
                .name(e.getName())
                .institution(e.getInstitution())
                .protocol(e.getProtocol().name())
                .status(e.getStatus().name())
                .description(e.getDescription())
                .url(e.getUrl())
                .scheduleCron(e.getScheduleCron())
                .lastExecutedAt(e.getLastExecutedAt())
                .createdAt(e.getCreatedAt())
                .build();
    }
}