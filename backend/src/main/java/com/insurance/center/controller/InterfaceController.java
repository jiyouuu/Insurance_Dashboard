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

    @GetMapping
    public List<InterfaceInfoDto> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public InterfaceInfoDto getOne(@PathVariable Long id) {
        return service.getOne(id);
    }

    @PostMapping
    public InterfaceInfoDto create(@RequestBody InterfaceInfoDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}/retry")
    public InterfaceInfoDto retry(@PathVariable Long id) {
        return service.retry(id);
    }

    @GetMapping("/{id}/logs")
    public List<InterfaceLogDto> getLogs(@PathVariable Long id) {
        return service.getLogs(id);
    }
}