package com.foodie.seller.repository;

import com.foodie.seller.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findBySellerIdOrderByCategoryAscNameAsc(Long sellerId);

    Optional<MenuItem> findByIdAndSellerId(Long id, Long sellerId);
}
