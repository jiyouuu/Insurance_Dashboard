package com.insurance.center.dto;

import lombok.*;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class DashboardSummaryDto {
    private long total;
    private long normal;
    private long error;
    private long pending;
    private long running;
}