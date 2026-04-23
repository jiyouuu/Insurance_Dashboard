package com.insurance.center.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import com.insurance.center.dto.DashboardSummaryDto;
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
}