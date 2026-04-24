package com.insurance.center.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private static final String API_KEY = 
    private static final String URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5:generateContent?key=" + API_KEY;
    
   
    
    
    @PostMapping("/analyze")
    public ResponseEntity<String> analyze(@RequestBody Map<String, String> body) {
        String prompt = body.get("prompt");

        for (int attempt = 0; attempt < 3; attempt++) {
            try {
                RestTemplate restTemplate = new RestTemplate();
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                Map<String, Object> request = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
                );

                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
                ResponseEntity<Map> response = restTemplate.postForEntity(URL, entity, Map.class);

                var candidates = (List<?>) response.getBody().get("candidates");
                var first      = (Map<?,?>) candidates.get(0);
                var content    = (Map<?,?>) first.get("content");
                var parts      = (List<?>) content.get("parts");
                String text    = (String) ((Map<?,?>) parts.get(0)).get("text");
                return ResponseEntity.ok(text);

            } catch (Exception e) {
                System.out.println("Gemini 재시도 " + (attempt+1) + "회: " + e.getMessage());
                if (attempt == 2) return ResponseEntity.status(503).body("Gemini 서버 과부하. 잠시 후 다시 시도해주세요.");
                try { Thread.sleep(3000); } catch (InterruptedException ie) {}
            }
        }
        return ResponseEntity.status(503).body("분석 실패");
    }
}