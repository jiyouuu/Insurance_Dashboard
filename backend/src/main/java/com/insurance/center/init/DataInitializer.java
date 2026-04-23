package com.insurance.center.init;


import com.insurance.center.domain.InterfaceInfo;
import com.insurance.center.domain.InterfaceLog;
import com.insurance.center.repository.InterfaceInfoRepository;
import com.insurance.center.repository.InterfaceLogRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final InterfaceInfoRepository interfaceRepo;
    private final InterfaceLogRepository logRepo;

    @Override
    public void run(String... args) {
        List<InterfaceInfo> interfaces = List.of(
            build("금감원 보고 API",     "금융감독원",   InterfaceInfo.Protocol.REST,  InterfaceInfo.InterfaceStatus.NORMAL,  "https://api.fss.or.kr/report",     "매일 09:00"),
            build("제휴병원 청구 수신",  "을지병원",     InterfaceInfo.Protocol.SFTP,  InterfaceInfo.InterfaceStatus.ERROR,   "sftp://hospital.euljimed.co.kr",   "매시 30분"),
            build("보험료 납입 처리",    "국민은행",     InterfaceInfo.Protocol.REST,  InterfaceInfo.InterfaceStatus.NORMAL,  "https://api.kbbank.com/payment",   "실시간"),
            build("세금 데이터 전송",    "국세청",       InterfaceInfo.Protocol.SOAP,  InterfaceInfo.InterfaceStatus.NORMAL,  "https://hts.nts.go.kr/soap",       "매일 18:00"),
            build("신용정보 조회",       "신용정보원",   InterfaceInfo.Protocol.REST,  InterfaceInfo.InterfaceStatus.RUNNING, "https://api.kcb.co.kr/credit",     "실시간"),
            build("정산 배치 처리",      "내부시스템",   InterfaceInfo.Protocol.BATCH, InterfaceInfo.InterfaceStatus.NORMAL,  "내부배치서버",                      "매일 00:00"),
            build("재보험 데이터 교환",  "Swiss Re",    InterfaceInfo.Protocol.MQ,    InterfaceInfo.InterfaceStatus.ERROR,   "mq://swissre.broker:1414",         "실시간"),
            build("계약 파일 수신",      "GA채널",       InterfaceInfo.Protocol.FTP,   InterfaceInfo.InterfaceStatus.PENDING, "ftp://ga.channel.co.kr",           "매일 08:00"),
            build("감독원 통계 전송",    "금융감독원",   InterfaceInfo.Protocol.SOAP,  InterfaceInfo.InterfaceStatus.NORMAL,  "https://api.fss.or.kr/stats",      "매주 월요일"),
            build("손해사정 결과 수신",  "한국손해사정", InterfaceInfo.Protocol.REST,  InterfaceInfo.InterfaceStatus.NORMAL,  "https://api.kadi.or.kr/result",    "실시간")
        );

        List<InterfaceInfo> saved = interfaceRepo.saveAll(interfaces);

        // 각 인터페이스에 로그 3~5개씩 추가
        for (InterfaceInfo iface : saved) {
            for (int i = 0; i < 4; i++) {
                boolean isSuccess = Math.random() > 0.3;
                logRepo.save(InterfaceLog.builder()
                        .interfaceInfo(iface)
                        .executedAt(LocalDateTime.now().minusHours(i * 3L))
                        .result(isSuccess ? InterfaceLog.LogResult.SUCCESS : InterfaceLog.LogResult.FAILURE)
                        .message(isSuccess ? "정상 처리 완료" : "연결 타임아웃 (30s 초과)")
                        .durationMs((long)(Math.random() * 800 + 50))
                        .build());
            }
        }
    }

    private InterfaceInfo build(String name, String institution,
                                 InterfaceInfo.Protocol protocol,
                                 InterfaceInfo.InterfaceStatus status,
                                 String url, String cron) {
        return InterfaceInfo.builder()
                .name(name)
                .institution(institution)
                .protocol(protocol)
                .status(status)
                .url(url)
                .scheduleCron(cron)
                .lastExecutedAt(LocalDateTime.now().minusMinutes((long)(Math.random() * 120)))
                .build();
    }
}