package com.foodie.seller.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "sellers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seller {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String restaurantName;

    @Column(length = 120)
    private String ownerName;

    @Column(nullable = false, unique = true, length = 160)
    private String email;

    @Column(nullable = false, unique = true, length = 15)
    private String phone;

    @JsonIgnore
    @Column(nullable = false)
    private String passwordHash;

    /** Human-friendly store code shown in the header, e.g. FD-1001. */
    @Column(unique = true, length = 20)
    private String storeId;

    @Column(length = 255)
    private String address;

    @Column(length = 120)
    private String cuisine;

    /** HH:mm (24h) */
    @Column(length = 5)
    @Builder.Default
    private String openingTime = "10:00";

    /** HH:mm (24h) */
    @Column(length = 5)
    @Builder.Default
    private String closingTime = "23:00";

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal packagingCharge = BigDecimal.ZERO;

    @Column(name = "is_online", nullable = false)
    private boolean online;
}
