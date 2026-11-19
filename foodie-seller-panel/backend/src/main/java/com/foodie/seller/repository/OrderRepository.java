package com.foodie.seller.repository;

import com.foodie.seller.entity.OrderEntity;
import com.foodie.seller.entity.OrderStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {

    Optional<OrderEntity> findByIdAndSellerId(Long id, Long sellerId);

    List<OrderEntity> findBySellerIdAndStatusIn(Long sellerId, Collection<OrderStatus> statuses, Pageable pageable);

    List<OrderEntity> findBySellerIdAndStatusAndSettled(Long sellerId, OrderStatus status, boolean settled);

    long countBySellerIdAndStatus(Long sellerId, OrderStatus status);

    long countBySellerIdAndStatusIn(Long sellerId, Collection<OrderStatus> statuses);

    /** Returns null when there are no matching rows; the service converts that to zero. */
    @Query("select sum(o.total) from OrderEntity o " +
            "where o.sellerId = :sellerId and o.status = :status and o.settled = :settled")
    BigDecimal sumTotal(@Param("sellerId") Long sellerId,
                        @Param("status") OrderStatus status,
                        @Param("settled") boolean settled);
}
