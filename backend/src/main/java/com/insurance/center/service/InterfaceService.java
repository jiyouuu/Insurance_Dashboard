package com.insurance.center.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insurance.center.domain.InterfaceInfo;
import com.insurance.center.domain.InterfaceLog;
import com.insurance.center.dto.DashboardSummaryDto;
import com.insurance.center.dto.InterfaceInfoDto;
import com.insurance.center.dto.InterfaceLogDto;
import com.insurance.center.repository.InterfaceInfoRepository;
import com.insurance.center.repository.InterfaceLogRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class InterfaceService {

    private final InterfaceInfoRepository interfaceRepo;
    private final InterfaceLogRepository logRepo;

    public List<InterfaceInfoDto> getAll() {
        return interfaceRepo.findAll()
                .stream().map(InterfaceInfoDto::from).collect(Collectors.toList());
    }

    public InterfaceInfoDto getOne(Long id) {
        return InterfaceInfoDto.from(interfaceRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found: " + id)));
    }

    @Transactional
    public InterfaceInfoDto create(InterfaceInfoDto dto) {
        InterfaceInfo entity = InterfaceInfo.builder()
                .name(dto.getName())
                .institution(dto.getInstitution())
                .protocol(InterfaceInfo.Protocol.valueOf(dto.getProtocol()))
                .status(InterfaceInfo.InterfaceStatus.PENDING)
                .description(dto.getDescription())
                .url(dto.getUrl())
                .scheduleCron(dto.getScheduleCron())
                .build();
        return InterfaceInfoDto.from(interfaceRepo.save(entity));
    }

    @Transactional
    public InterfaceInfoDto retry(Long id) {
        InterfaceInfo entity = interfaceRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found: " + id));

        // 재처리: 상태를 RUNNING으로 변경 후 SUCCESS 처리 (시뮬레이션)
        entity.setStatus(InterfaceInfo.InterfaceStatus.RUNNING);
        entity.setLastExecutedAt(LocalDateTime.now());
        interfaceRepo.save(entity);

        // 로그 기록
        InterfaceLog log = InterfaceLog.builder()
                .interfaceInfo(entity)
                .executedAt(LocalDateTime.now())
                .result(InterfaceLog.LogResult.SUCCESS)
                .message("재처리 성공")
                .durationMs((long)(Math.random() * 500 + 100))
                .build();
        logRepo.save(log);

        entity.setStatus(InterfaceInfo.InterfaceStatus.NORMAL);
        return InterfaceInfoDto.from(interfaceRepo.save(entity));
    }

    public List<InterfaceLogDto> getLogs(Long id) {
        return logRepo.findByInterfaceInfoIdOrderByExecutedAtDesc(id)
                .stream().map(InterfaceLogDto::from).collect(Collectors.toList());
    }

    public DashboardSummaryDto getSummary() {
        List<InterfaceInfo> all = interfaceRepo.findAll();
        return DashboardSummaryDto.builder()
                .total(all.size())
                .normal(all.stream().filter(i -> i.getStatus() == InterfaceInfo.InterfaceStatus.NORMAL).count())
                .error(all.stream().filter(i -> i.getStatus() == InterfaceInfo.InterfaceStatus.ERROR).count())
                .pending(all.stream().filter(i -> i.getStatus() == InterfaceInfo.InterfaceStatus.PENDING).count())
                .running(all.stream().filter(i -> i.getStatus() == InterfaceInfo.InterfaceStatus.RUNNING).count())
                .build();
    }
}