package com.foodie.seller.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "menu_items", indexes = @Index(name = "idx_menu_seller", columnList = "seller_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, length = 60)
    private String category;

    /** true = Veg, false = Non-Veg */
    @Column(nullable = false)
    private boolean veg;

    @Column(name = "in_stock", nullable = false)
    @Builder.Default
    private boolean inStock = true;

    /** Public URL served by the Node gateway (/uploads/...). */
    @Column(length = 500)
    private String imageUrl;
}
