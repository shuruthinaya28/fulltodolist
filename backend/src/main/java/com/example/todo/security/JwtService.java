package com.example.todo.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;
import java.util.function.Function;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private static final String DEFAULT_SECRET = "daymark-jwt-secret-key-32-bytes-minimum-12345";

    private final SecretKey signingKey;
    private final long jwtExpirationMs;

    public JwtService(@Value("${app.jwt.secret:}") String secret,
                      @Value("${app.jwt.expiration-ms:86400000}") long jwtExpirationMs) {
        String resolvedSecret = (secret == null || secret.isBlank()) ? DEFAULT_SECRET : secret;
        this.signingKey = Keys.hmacShaKeyFor(prepareSigningKey(resolvedSecret));
        this.jwtExpirationMs = jwtExpirationMs;
    }

    public String generateToken(String subject) {
        Date now = new Date();
        return Jwts.builder()
                .subject(subject)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + jwtExpirationMs))
                .signWith(signingKey)
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public boolean isTokenValid(String token) {
        try {
            return !extractAllClaims(token).getExpiration().before(new Date());
        } catch (Exception ex) {
            return false;
        }
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private byte[] prepareSigningKey(String secret) {
        byte[] rawBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (rawBytes.length >= 32) {
            return rawBytes;
        }

        byte[] padded = new byte[32];
        System.arraycopy(rawBytes, 0, padded, 0, rawBytes.length);
        for (int i = rawBytes.length; i < padded.length; i++) {
            padded[i] = (byte) ('0' + (i % 10));
        }
        return padded;
    }
}
