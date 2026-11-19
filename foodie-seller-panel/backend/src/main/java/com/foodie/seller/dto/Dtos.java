package com.foodie.seller.dto;

import com.foodie.seller.entity.OrderStatus;
import com.foodie.seller.entity.Payout;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

/** Request/response payloads for the seller panel API. */
public final class Dtos {

    private Dtos() {
    }

    // ---------- Auth ----------
    public record LoginRequest(
            @NotBlank(message = "Mobile or email is required") String identifier,
            @NotBlank(message = "Password is required") String password) {
    }

    public record RegisterRequest(
            @NotBlank(message = "Restaurant name is required") @Size(max = 120) String restaurantName,
            @NotBlank(message = "Owner name is required") @Size(max = 120) String ownerName,
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") String email,
            @NotBlank(message = "Mobile number is required")
            @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit mobile number") String phone,
            @NotBlank(message = "Password is required")
            @Size(min = 6, max = 72, message = "Password must be 6-72 characters") String password) {
    }

    public record SessionResponse(Long sellerId, String restaurantName, String storeId, boolean online) {
    }

    // ---------- Dashboard ----------
    public record SummaryResponse(BigDecimal totalAmount, BigDecimal pendingAmount,
                                  long activeOrders, long pendingOrders) {
    }

    // ---------- Orders ----------
    public record StatusRequest(@NotNull(message = "status is required") OrderStatus status) {
    }

    // ---------- Menu ----------
    public record MenuItemRequest(
            @NotBlank(message = "Dish name is required") @Size(max = 120) String name,
            @Size(max = 500) String description,
            @NotNull(message = "Price is required")
            @DecimalMin(value = "0.0", message = "Price cannot be negative")
            @Digits(integer = 8, fraction = 2) BigDecimal price,
            @NotBlank(message = "Category is required") @Size(max = 60) String category,
            boolean veg,
            Boolean inStock,
            @Size(max = 500) String imageUrl) {
    }

    public record StockRequest(boolean inStock) {
    }

    // ---------- Profile ----------
    public record ProfileRequest(
            @NotBlank(message = "Restaurant name is required") @Size(max = 120) String restaurantName,
            @Size(max = 120) String ownerName,
            @Size(max = 255) String address,
            @Size(max = 120) String cuisine,
            @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Opening time must be HH:mm") String openingTime,
            @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Closing time must be HH:mm") String closingTime,
            @DecimalMin(value = "0.0", message = "Packaging charge cannot be negative") BigDecimal packagingCharge) {
    }

    public record OnlineRequest(boolean online) {
    }

    // ---------- Earnings ----------
    public record EarningsResponse(BigDecimal totalAmount, BigDecimal pendingAmount, List<Payout> payouts) {
    }
}
