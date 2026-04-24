package com.insurance.center.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private static final String API_KEY = "AIzaSyC7ebBUs_fVopsHme5KBZSrQUGekh8gdD4";
    private static final String URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY;
    
    @PostMapping("/analyze")
    public ResponseEntity<String> analyze(@RequestBody Map<String, String> body) {
        String prompt = body.get("prompt");

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> request = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(
                    Map.of("text", prompt)
                ))
            )
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(URL, entity, Map.class);

        // 응답 파싱
        var candidates = (List<?>) response.getBody().get("candidates");
        var first      = (Map<?,?>) candidates.get(0);
        var content    = (Map<?,?>) first.get("content");
        var parts      = (List<?>) content.get("parts");
        var part       = (Map<?,?>) parts.get(0);
        String text    = (String) part.get("text");

        return ResponseEntity.ok(text);
    }
}