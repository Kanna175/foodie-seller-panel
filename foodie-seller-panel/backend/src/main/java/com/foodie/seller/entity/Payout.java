package com.foodie.seller.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** A settlement of delivered orders into the seller's bank account. */
@Entity
@Table(name = "payouts", indexes = @Index(name = "idx_payout_seller", columnList = "seller_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    private int orderCount;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(length = 40)
    private String reference;

    @Column(nullable = false)
    private LocalDateTime paidAt;
}
