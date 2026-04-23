package com.insurance.center.dto;

import lombok.*;
import java.time.LocalDateTime;

import com.insurance.center.domain.InterfaceLog;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class InterfaceLogDto {
    private Long id;
    private Long interfaceId;
    private LocalDateTime executedAt;
    private String result;
    private String message;
    private Long durationMs;

    public static InterfaceLogDto from(InterfaceLog e) {
        return InterfaceLogDto.builder()
                .id(e.getId())
                .interfaceId(e.getInterfaceInfo().getId())
                .executedAt(e.getExecutedAt())
                .result(e.getResult().name())
                .message(e.getMessage())
                .durationMs(e.getDurationMs())
                .build();
    }
}