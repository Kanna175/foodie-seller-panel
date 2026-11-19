package com.foodie.seller.entity;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

/**
 * Order lifecycle:
 * PENDING -> ACCEPTED -> PREPARING -> READY_FOR_PICKUP -> DELIVERED
 * PENDING -> REJECTED, ACCEPTED -> CANCELLED
 */
public enum OrderStatus {
    PENDING,
    ACCEPTED,
    PREPARING,
    READY_FOR_PICKUP,
    DELIVERED,
    CANCELLED,
    REJECTED;

    /** Orders the kitchen is currently working on. */
    public static final Set<OrderStatus> ACTIVE =
            Collections.unmodifiableSet(EnumSet.of(ACCEPTED, PREPARING, READY_FOR_PICKUP));

    /** Finished orders shown in the history log. */
    public static final Set<OrderStatus> HISTORY =
            Collections.unmodifiableSet(EnumSet.of(DELIVERED, CANCELLED, REJECTED));
}
