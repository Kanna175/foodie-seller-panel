package com.foodie.seller.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/** One line of an order (stored in the order_items table). */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderLine {

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
}
