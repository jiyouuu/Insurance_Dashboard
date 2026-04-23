package com.insurance.center.service;

import lombok.RequiredArgsConstructor;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insurance.center.domain.InterfaceInfo;
import com.insurance.center.domain.InterfaceLog;
import com.insurance.center.dto.DashboardSummaryDto;
import com.insurance.center.dto.HourlyStatDto;
import com.insurance.center.dto.InterfaceInfoDto;
import com.insurance.center.dto.InterfaceLogDto;
import com.insurance.center.repository.InterfaceInfoRepository;
import com.insurance.center.repository.InterfaceLogRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
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
        
        boolean success = Math.random() > 0.3; // 70% 성공률
        // 로그 기록
        InterfaceLog log = InterfaceLog.builder()
                .interfaceInfo(entity)
                .executedAt(LocalDateTime.now())
                .result(success ? InterfaceLog.LogResult.SUCCESS : InterfaceLog.LogResult.FAILURE)
                .message(success ? "재처리 성공" : "재처리 실패 - 연결 오류 지속")
                .durationMs((long)(Math.random() * 500 + 100))
                .build();
        logRepo.save(log);

        entity.setStatus(success
                ? InterfaceInfo.InterfaceStatus.NORMAL
                : InterfaceInfo.InterfaceStatus.ERROR);
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


	
	public List<InterfaceLogDto> getAllLogs() {
	    return logRepo.findAll(
	        org.springframework.data.domain.Sort.by(
	            org.springframework.data.domain.Sort.Direction.DESC, "executedAt"))
	        .stream().map(InterfaceLogDto::from).collect(Collectors.toList());
	}

	@Transactional
	public InterfaceInfoDto execute(Long id) {
	    InterfaceInfo entity = interfaceRepo.findById(id)
	            .orElseThrow(() -> new RuntimeException("Not found: " + id));
	    entity.setStatus(InterfaceInfo.InterfaceStatus.RUNNING);
	    entity.setLastExecutedAt(LocalDateTime.now());
	    interfaceRepo.save(entity);
	    boolean success = Math.random() > 0.2;
	    InterfaceLog log = InterfaceLog.builder()
	            .interfaceInfo(entity)
	            .executedAt(LocalDateTime.now())
	            .result(success ? InterfaceLog.LogResult.SUCCESS : InterfaceLog.LogResult.FAILURE)
	            .message(success ? "수동 실행 완료" : "수동 실행 실패 - 연결 오류")
	            .durationMs((long)(Math.random() * 600 + 80))
	            .build();
	    logRepo.save(log);
	    entity.setStatus(success ? InterfaceInfo.InterfaceStatus.NORMAL : InterfaceInfo.InterfaceStatus.ERROR);
	    return InterfaceInfoDto.from(interfaceRepo.save(entity));
	}
	
	
	public List<HourlyStatDto> getHourlyStats() {
	    List<InterfaceLog> allLogs = logRepo.findAll();

	    // 0~23시 초기화
	    Map<Integer, List<InterfaceLog>> byHour = new java.util.TreeMap<>();
	    for (int i = 0; i < 24; i++) byHour.put(i, new java.util.ArrayList<>());

	    // 시간대별 분류
	    for (InterfaceLog log : allLogs) {
	        int hour = log.getExecutedAt().getHour();
	        byHour.get(hour).add(log);
	    }

	    return byHour.entrySet().stream().map(e -> {
	        int hour = e.getKey();
	        List<InterfaceLog> logs = e.getValue();
	        long total   = logs.size();
	        long success = logs.stream().filter(l -> l.getResult() == InterfaceLog.LogResult.SUCCESS).count();
	        long failure = total - success;

	        // 약간의 랜덤 변화 (실시간 느낌)
	        long randomOffset = (long)(Math.random() * 10 - 5);
	        total   = Math.max(0, total + randomOffset);
	        success = Math.min(total, Math.max(0, success + randomOffset));
	        failure = total - success;

	        double errorRate = total > 0 ? Math.round(failure * 1000.0 / total) / 10.0 : 0.0;
	        long avgMs = total > 0
	            ? (long)(logs.stream().mapToLong(InterfaceLog::getDurationMs).average().orElse(0)
	                + Math.random() * 40 - 20)  // ±20ms 변동
	            : 0;

	        return HourlyStatDto.builder()
	                .hour(hour).total(total).success(success)
	                .failure(failure).errorRate(errorRate).avgMs(Math.max(0, avgMs))
	                .build();
	    }).collect(Collectors.toList());
	}
	
	
	public List<Map<String, String>> getAlerts() {
	    List<Map<String, String>> alerts = new java.util.ArrayList<>();
	    List<InterfaceInfo> all = interfaceRepo.findAll();
	    List<InterfaceLog> allLogs = logRepo.findAll();

	    for (InterfaceInfo iface : all) {
	        // 🔴 ERROR 상태
	        if (iface.getStatus() == InterfaceInfo.InterfaceStatus.ERROR) {
	            long failCount = allLogs.stream()
	                .filter(l -> l.getInterfaceInfo().getId().equals(iface.getId()))
	                .filter(l -> l.getResult() == InterfaceLog.LogResult.FAILURE)
	                .count();
	            Map<String, String> alert = new java.util.HashMap<>();
	            alert.put("type", "error");
	            alert.put("title", iface.getName() + " - 연결 오류");
	            alert.put("desc", iface.getProtocol() + " 연결 실패. 누적 오류 " + failCount + "건. 즉시 확인 필요.");
	            alert.put("iface", iface.getName());
	            alerts.add(alert);
	        }

	        // 응답시간 경고 (평균 500ms 초과)
	        List<InterfaceLog> ifaceLogs = allLogs.stream()
	            .filter(l -> l.getInterfaceInfo().getId().equals(iface.getId()))
	            .collect(java.util.stream.Collectors.toList());

	        if (!ifaceLogs.isEmpty()) {
	            long avgMs = (long) ifaceLogs.stream()
	                .mapToLong(InterfaceLog::getDurationMs)
	                .average().orElse(0);
	            if (avgMs > 500) {
	                Map<String, String> alert = new java.util.HashMap<>();
	                alert.put("type", "warn");
	                alert.put("title", iface.getName() + " - 응답시간 경고");
	                alert.put("desc", "평균 응답시간 " + avgMs + "ms. 임계값(300ms) 초과.");
	                alert.put("iface", iface.getName());
	                alerts.add(alert);
	            }
	        }
	    }

	    // 최근 배치 성공 알림
	    allLogs.stream()
	        .filter(l -> l.getInterfaceInfo().getProtocol() == InterfaceInfo.Protocol.BATCH)
	        .filter(l -> l.getResult() == InterfaceLog.LogResult.SUCCESS)
	        .sorted((a, b) -> b.getExecutedAt().compareTo(a.getExecutedAt()))
	        .limit(2)
	        .forEach(l -> {
	            Map<String, String> alert = new java.util.HashMap<>();
	            alert.put("type", "info");
	            alert.put("title", l.getInterfaceInfo().getName() + " 배치 완료");
	            alert.put("desc", "배치 정상 완료. 응답시간 " + l.getDurationMs() + "ms.");
	            alert.put("iface", l.getInterfaceInfo().getName());
	            alerts.add(alert);
	        });

	    // 최대 8개만
	    return alerts.stream().limit(8).collect(java.util.stream.Collectors.toList());
	}
	
	
	private String randomPick(String[] arr) {
	    return arr[(int)(Math.random() * arr.length)];
	}
	
	@Scheduled(fixedRate = 10000) // 10초마다 (테스트용)
	@Transactional
	public void autoGenerateLogs() {
		System.out.println("=== 자동 로그 생성 실행: " + LocalDateTime.now() + " ===");
	    List<InterfaceInfo> all = interfaceRepo.findAll();
	    if (all.isEmpty()) return;

	    // 랜덤으로 5~10개 인터페이스 선택
	    java.util.Collections.shuffle(all);
	    int count = (int)(Math.random() * 6 + 5);
	    List<InterfaceInfo> selected = all.subList(0, Math.min(count, all.size()));

	    for (InterfaceInfo iface : selected) {
	    	boolean success = Math.random() > 0.30; // 수정 30% 실패

	        InterfaceLog.LogResult result;
	        String message;
	        double r = Math.random();
	        if (success) {
	            if (r < 0.5)      { result = InterfaceLog.LogResult.SUCCESS; message = randomPick(new String[]{"정상 처리 완료", "데이터 전송 성공", "응답 수신 완료", "배치 처리 완료"}); }
	            else if (r < 0.75){ result = InterfaceLog.LogResult.INFO;    message = randomPick(new String[]{"스케줄 실행 시작", "헬스체크 정상", "연결 풀 갱신", "설정 재적용"}); }
	            else               { result = InterfaceLog.LogResult.WARN;    message = randomPick(new String[]{"응답시간 임계값 초과", "재시도 후 성공", "부분 데이터 누락 감지", "큐 적체 경고"}); }
	        } else {
	            result = InterfaceLog.LogResult.FAILURE;
	            message = randomPick(new String[]{"연결 타임아웃 (30s 초과)", "인증 실패 - 토큰 만료", "서버 응답 없음 (503)", "API 호출 한도 초과"});

	            // 실패 시 ERROR 상태로 변경
	            iface.setStatus(InterfaceInfo.InterfaceStatus.ERROR);
	            interfaceRepo.save(iface);
	        }

	        logRepo.save(InterfaceLog.builder()
	                .interfaceInfo(iface)
	                .executedAt(LocalDateTime.now())
	                .result(result)
	                .message(message)
	                .durationMs((long)(Math.random() * 700 + 80))
	                .build());
	    }
	}
}