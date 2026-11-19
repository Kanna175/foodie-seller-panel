package com.foodie.seller.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Customer order. Named OrderEntity because ORDER is a reserved SQL word; table is "orders". */
@Entity
@Table(name = "orders", indexes = @Index(name = "idx_orders_seller_status", columnList = "seller_id, status"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Display number, e.g. FD10001 (assigned right after insert). */
    @Column(length = 20)
    private String orderNumber;

    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @Column(nullable = false, length = 120)
    private String customerName;

    @Column(length = 20)
    private String paymentMode;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_items", joinColumns = @JoinColumn(name = "order_id"))
    @Builder.Default
    private List<OrderLine> items = new ArrayList<>();

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal itemTotal;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal packagingCharge;

    /** itemTotal + packagingCharge: the amount the seller earns for this order. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status;

    /** true once a delivered order has been included in a payout. */
    @Column(nullable = false)
    private boolean settled;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
