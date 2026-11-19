package com.foodie.seller.controller;

import com.foodie.seller.dto.Dtos.*;
import com.foodie.seller.entity.MenuItem;
import com.foodie.seller.entity.OrderEntity;
import com.foodie.seller.entity.Seller;
import com.foodie.seller.exception.ApiException;
import com.foodie.seller.service.SellerPanelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Seller panel REST API. Called only by the Node.js gateway, which has already
 * verified the seller's JWT and that {sellerId} matches the token.
 */
@RestController
@RequestMapping("/api/seller")
@RequiredArgsConstructor
public class SellerPanelController {

    private final SellerPanelService service;

    @Value("${foodie.demo-endpoints:false}")
    private boolean demoEndpoints;

    // ---------- Auth ----------

    @PostMapping("/login")
    public SessionResponse login(@Valid @RequestBody LoginRequest req) {
        return service.login(req);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public SessionResponse register(@Valid @RequestBody RegisterRequest req) {
        return service.register(req);
    }

    // ---------- Dashboard KPIs ----------

    @GetMapping("/{sellerId}/summary")
    public SummaryResponse summary(@PathVariable Long sellerId) {
        return service.summary(sellerId);
    }

    // ---------- Orders ----------

    /** group = pending | active | queue | history | all (default: all) */
    @GetMapping("/{sellerId}/orders")
    public List<OrderEntity> orders(@PathVariable Long sellerId,
                                    @RequestParam(defaultValue = "all") String group) {
        return service.listOrders(sellerId, group);
    }

    /** PENDING -> ACCEPTED|REJECTED, ACCEPTED -> PREPARING, PREPARING -> READY_FOR_PICKUP, READY_FOR_PICKUP -> DELIVERED */
    @PutMapping("/{sellerId}/orders/{orderId}/status")
    public OrderEntity updateStatus(@PathVariable Long sellerId, @PathVariable Long orderId,
                                    @Valid @RequestBody StatusRequest req) {
        return service.updateOrderStatus(sellerId, orderId, req.status());
    }

    @PostMapping("/{sellerId}/orders/simulate")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderEntity simulateOrder(@PathVariable Long sellerId) {
        if (!demoEndpoints) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Not found");
        }
        return service.simulateOrder(sellerId);
    }

    // ---------- Menu ----------

    @GetMapping("/{sellerId}/menu")
    public List<MenuItem> menu(@PathVariable Long sellerId) {
        return service.menu(sellerId);
    }

    @PostMapping("/{sellerId}/menu")
    @ResponseStatus(HttpStatus.CREATED)
    public MenuItem addMenuItem(@PathVariable Long sellerId, @Valid @RequestBody MenuItemRequest req) {
        return service.addMenuItem(sellerId, req);
    }

    @PutMapping("/{sellerId}/menu/{itemId}")
    public MenuItem updateMenuItem(@PathVariable Long sellerId, @PathVariable Long itemId,
                                   @Valid @RequestBody MenuItemRequest req) {
        return service.updateMenuItem(sellerId, itemId, req);
    }

    @PatchMapping("/{sellerId}/menu/{itemId}/stock")
    public MenuItem setStock(@PathVariable Long sellerId, @PathVariable Long itemId,
                             @RequestBody StockRequest req) {
        return service.setStock(sellerId, itemId, req.inStock());
    }

    @DeleteMapping("/{sellerId}/menu/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMenuItem(@PathVariable Long sellerId, @PathVariable Long itemId) {
        service.deleteMenuItem(sellerId, itemId);
    }

    // ---------- Earnings & payouts ----------

    @GetMapping("/{sellerId}/earnings")
    public EarningsResponse earnings(@PathVariable Long sellerId) {
        return service.earnings(sellerId);
    }

    @PostMapping("/{sellerId}/payouts/request")
    public EarningsResponse requestPayout(@PathVariable Long sellerId) {
        return service.requestPayout(sellerId);
    }

    // ---------- Profile & store status ----------

    @GetMapping("/{sellerId}/profile")
    public Seller profile(@PathVariable Long sellerId) {
        return service.profile(sellerId);
    }

    @PutMapping("/{sellerId}/profile")
    public Seller updateProfile(@PathVariable Long sellerId, @Valid @RequestBody ProfileRequest req) {
        return service.updateProfile(sellerId, req);
    }

    @PatchMapping("/{sellerId}/online")
    public SessionResponse setOnline(@PathVariable Long sellerId, @RequestBody OnlineRequest req) {
        return service.setOnline(sellerId, req.online());
    }
}
