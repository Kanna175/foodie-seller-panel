package com.foodie.seller.config;

import com.foodie.seller.entity.*;
import com.foodie.seller.repository.MenuItemRepository;
import com.foodie.seller.repository.PayoutRepository;
import com.foodie.seller.repository.SellerRepository;
import com.foodie.seller.service.SellerPanelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Seeds an empty database with a demo seller so the panel works right after first start.
 * Login: demo@foodie.in (or 9876543210) / demo123
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final SellerRepository sellers;
    private final MenuItemRepository menu;
    private final PayoutRepository payouts;
    private final SellerPanelService service;
    private final PasswordEncoder encoder;

    @Value("${foodie.seed-demo-data:true}")
    private boolean enabled;

    @Override
    public void run(String... args) {
        if (!enabled || sellers.count() > 0) return;

        Seller seller = sellers.save(Seller.builder()
                .restaurantName("Spice Garden Kitchen")
                .ownerName("Kumar")
                .email("demo@foodie.in")
                .phone("9876543210")
                .passwordHash(encoder.encode("demo123"))
                .address("Beach Road, Visakhapatnam, Andhra Pradesh")
                .cuisine("North Indian, Biryani, Chinese")
                .openingTime("10:00")
                .closingTime("23:00")
                .packagingCharge(new BigDecimal("12.00"))
                .online(true)
                .build());
        seller.setStoreId("FD-" + (1000 + seller.getId()));
        seller = sellers.save(seller);
        Long sid = seller.getId();

        // ---------- Menu ----------
        Map<String, MenuItem> m = new LinkedHashMap<>();
        add(m, sid, "Paneer Tikka", "Smoky tandoori cottage cheese cubes", "249", "Starters", true, true);
        add(m, sid, "Chicken 65", "Spicy deep-fried chicken bites", "279", "Starters", false, true);
        add(m, sid, "Veg Manchurian", "Crispy veg balls in tangy sauce", "199", "Starters", true, true);
        add(m, sid, "Paneer Butter Masala", "Creamy tomato gravy with paneer", "289", "Main Course", true, true);
        add(m, sid, "Butter Chicken", "Tandoori chicken in rich makhani gravy", "329", "Main Course", false, true);
        add(m, sid, "Dal Tadka", "Yellow lentils tempered with ghee and garlic", "189", "Main Course", true, false);
        add(m, sid, "Hyderabadi Chicken Biryani", "Dum biryani with raita and mirchi ka salan", "349", "Biryani", false, true);
        add(m, sid, "Veg Dum Biryani", "Fragrant basmati with seasonal vegetables", "259", "Biryani", true, true);
        add(m, sid, "Butter Naan", "Soft tandoor-baked bread with butter", "55", "Breads", true, true);
        add(m, sid, "Garlic Naan", "Naan topped with garlic and coriander", "65", "Breads", true, true);
        add(m, sid, "Gulab Jamun (2 pcs)", "Warm milk dumplings in sugar syrup", "89", "Desserts", true, true);
        add(m, sid, "Fresh Lime Soda", "Sweet or salted", "69", "Beverages", true, true);

        // ---------- Live queue: 2 pending + 3 active ----------
        LocalDateTime now = LocalDateTime.now();
        service.placeOrder(sid, "Ananya Rao", "UPI", lines(m, "Paneer Butter Masala", 1, "Butter Naan", 2),
                OrderStatus.PENDING, false, now.minusMinutes(2));
        service.placeOrder(sid, "Rohit Verma", "COD", lines(m, "Hyderabadi Chicken Biryani", 1, "Chicken 65", 1),
                OrderStatus.PENDING, false, now.minusMinutes(7));
        service.placeOrder(sid, "Meera Nair", "CARD", lines(m, "Veg Dum Biryani", 2),
                OrderStatus.ACCEPTED, false, now.minusMinutes(14));
        service.placeOrder(sid, "Karthik Reddy", "UPI", lines(m, "Butter Chicken", 1, "Garlic Naan", 2),
                OrderStatus.PREPARING, false, now.minusMinutes(22));
        service.placeOrder(sid, "Sneha Iyer", "UPI", lines(m, "Paneer Tikka", 1, "Fresh Lime Soda", 2),
                OrderStatus.READY_FOR_PICKUP, false, now.minusMinutes(31));

        // ---------- Delivered & settled (older) ----------
        String[] customers = {"Arjun Mehta", "Divya Sharma", "Imran Khan", "Ananya Rao", "Rohit Verma",
                "Meera Nair", "Karthik Reddy", "Sneha Iyer", "Arjun Mehta"};
        String[][] picks = {
                {"Hyderabadi Chicken Biryani", "Gulab Jamun (2 pcs)"}, {"Paneer Butter Masala", "Butter Naan"},
                {"Butter Chicken", "Garlic Naan"}, {"Veg Dum Biryani", "Fresh Lime Soda"},
                {"Chicken 65", "Hyderabadi Chicken Biryani"}, {"Paneer Tikka", "Veg Manchurian"},
                {"Butter Chicken", "Butter Naan"}, {"Veg Dum Biryani", "Gulab Jamun (2 pcs)"},
                {"Hyderabadi Chicken Biryani", "Fresh Lime Soda"}};
        List<OrderEntity> settled = new ArrayList<>();
        for (int i = 0; i < customers.length; i++) {
            settled.add(service.placeOrder(sid, customers[i], i % 2 == 0 ? "UPI" : "CARD",
                    lines(m, picks[i][0], 1, picks[i][1], 1),
                    OrderStatus.DELIVERED, true, now.minusDays(3 + i * 2L).minusHours(i)));
        }

        // ---------- Delivered, awaiting payout ----------
        service.placeOrder(sid, "Divya Sharma", "UPI", lines(m, "Butter Chicken", 1, "Butter Naan", 2),
                OrderStatus.DELIVERED, false, now.minusHours(20));
        service.placeOrder(sid, "Imran Khan", "COD", lines(m, "Hyderabadi Chicken Biryani", 2),
                OrderStatus.DELIVERED, false, now.minusHours(9));
        service.placeOrder(sid, "Ananya Rao", "CARD", lines(m, "Paneer Tikka", 1, "Veg Dum Biryani", 1),
                OrderStatus.DELIVERED, false, now.minusHours(4));

        // ---------- Cancelled / rejected ----------
        service.placeOrder(sid, "Rohit Verma", "UPI", lines(m, "Dal Tadka", 1),
                OrderStatus.CANCELLED, false, now.minusDays(1).minusHours(3));
        service.placeOrder(sid, "Meera Nair", "COD", lines(m, "Veg Manchurian", 2),
                OrderStatus.REJECTED, false, now.minusDays(2));

        // ---------- Payout history (3 batches that add up to the settled total) ----------
        for (int batch = 0; batch < 3; batch++) {
            List<OrderEntity> chunk = settled.subList(batch * 3, batch * 3 + 3);
            BigDecimal amount = chunk.stream().map(OrderEntity::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
            payouts.save(Payout.builder()
                    .sellerId(sid)
                    .amount(amount)
                    .orderCount(chunk.size())
                    .status("PROCESSED")
                    .reference("PO" + (240100 + batch))
                    .paidAt(now.minusDays(21L - batch * 7L))
                    .build());
        }
        log.info("Seeded demo seller: demo@foodie.in / demo123 (storeId {})", seller.getStoreId());
    }

    private void add(Map<String, MenuItem> map, Long sid, String name, String desc, String price,
                     String category, boolean veg, boolean inStock) {
        map.put(name, menu.save(MenuItem.builder()
                .sellerId(sid).name(name).description(desc).price(new BigDecimal(price))
                .category(category).veg(veg).inStock(inStock).build()));
    }

    /** lines(menu, "Dish A", qty, "Dish B", qty, ...) */
    private List<OrderLine> lines(Map<String, MenuItem> m, Object... nameQty) {
        List<OrderLine> out = new ArrayList<>();
        for (int i = 0; i < nameQty.length; i += 2) {
            // allow lines(m, "Dish") shorthand with default qty handled by callers passing pairs
            String name = (String) nameQty[i];
            int qty = i + 1 < nameQty.length && nameQty[i + 1] instanceof Integer q ? q : 1;
            MenuItem item = m.get(name);
            out.add(new OrderLine(item.getName(), qty, item.getPrice()));
        }
        return out;
    }

    private List<OrderLine> lines(Map<String, MenuItem> m, String name, int qty) {
        return lines(m, new Object[]{name, qty});
    }
}
