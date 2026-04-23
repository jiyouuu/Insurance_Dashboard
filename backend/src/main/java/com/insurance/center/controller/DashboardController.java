package com.insurance.center.controller;

import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.*;

import com.insurance.center.dto.DashboardSummaryDto;
import com.insurance.center.dto.HourlyStatDto;
import com.insurance.center.service.InterfaceService;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final InterfaceService service;

    @GetMapping("/summary")
    public DashboardSummaryDto getSummary() {
        return service.getSummary();
    }
    
    @GetMapping("/hourly-stats")
    public List<HourlyStatDto> getHourlyStats() {
        return service.getHourlyStats();
    }
    
    @GetMapping("/alerts")
    public List<Map<String, String>> getAlerts() {
        return service.getAlerts();
    }
}