package com.insurance.center.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.insurance.center.domain.InterfaceLog;

import java.util.List;

public interface InterfaceLogRepository extends JpaRepository<InterfaceLog, Long> {
    List<InterfaceLog> findByInterfaceInfoIdOrderByExecutedAtDesc(Long interfaceId);
}