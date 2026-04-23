package com.insurance.center.controller;


import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.insurance.center.dto.InterfaceInfoDto;
import com.insurance.center.dto.InterfaceLogDto;
import com.insurance.center.service.InterfaceService;

import java.util.List;


@RestController
@RequestMapping("/api/interfaces")
@RequiredArgsConstructor
public class InterfaceController {

    private final InterfaceService service;

    @GetMapping()
    public List<InterfaceInfoDto> getAll() {
        return service.getAll();
    }

    @GetMapping("/logs/all")
    public List<InterfaceLogDto> getAllLogs() {
        return service.getAllLogs();
    }

    @PutMapping("/{id}/execute")
    public InterfaceInfoDto execute(@PathVariable("id") Long id) {
        return service.execute(id);
    }
    
    @GetMapping("/{id}")
    public InterfaceInfoDto getOne(@PathVariable("id")  Long id) {
        return service.getOne(id);
    }

    @PostMapping
    public InterfaceInfoDto create(@RequestBody InterfaceInfoDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}/retry")
    public InterfaceInfoDto retry(@PathVariable("id")  Long id) {
        return service.retry(id);
    }

    @GetMapping("/{id}/logs")
    public List<InterfaceLogDto> getLogs(@PathVariable("id")  Long id) {
        return service.getLogs(id);
    }
}