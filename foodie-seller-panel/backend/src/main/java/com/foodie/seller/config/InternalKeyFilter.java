package com.foodie.seller.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Only the Node.js gateway (which holds the shared key) may call this service.
 * The browser never talks to port 8080 directly; JWT verification happens in the gateway.
 */
@Component
public class InternalKeyFilter extends OncePerRequestFilter {

    private final byte[] expected;

    public InternalKeyFilter(@Value("${foodie.internal-key}") String key) {
        this.expected = key.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        if (req.getRequestURI().startsWith("/api/")) {
            String provided = req.getHeader("X-Internal-Key");
            boolean ok = provided != null
                    && MessageDigest.isEqual(expected, provided.getBytes(StandardCharsets.UTF_8));
            if (!ok) {
                res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                res.setContentType("application/json");
                res.getWriter().write("{\"message\":\"Unauthorized: requests must come through the gateway\"}");
                return;
            }
        }
        chain.doFilter(req, res);
    }
}
