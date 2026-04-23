package com.insurance.center.repository;


import org.springframework.data.jpa.repository.JpaRepository;

import com.insurance.center.domain.InterfaceInfo;

import java.util.List;
public interface InterfaceInfoRepository extends JpaRepository<InterfaceInfo, Long> {
    List<InterfaceInfo> findByStatus(InterfaceInfo.InterfaceStatus status);
    List<InterfaceInfo> findByProtocol(InterfaceInfo.Protocol protocol);
}