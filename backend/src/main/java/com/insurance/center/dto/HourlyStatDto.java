package com.insurance.center.dto;

import lombok.*;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class HourlyStatDto {
    private int    hour;
    private long   total;
    private long   success;
    private long   failure;
    private double errorRate;
    private long   avgMs;
}