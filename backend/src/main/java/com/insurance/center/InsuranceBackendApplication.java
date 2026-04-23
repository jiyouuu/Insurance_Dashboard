package com.insurance.center;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class InsuranceBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(InsuranceBackendApplication.class, args);
	}

}
