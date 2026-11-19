package com.foodie.seller.repository;

import com.foodie.seller.entity.Payout;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PayoutRepository extends JpaRepository<Payout, Long> {
    List<Payout> findBySellerIdOrderByPaidAtDesc(Long sellerId);
}
