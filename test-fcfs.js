import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs';

const startBooking = async () => {
    try {
        const payload1 = {
            seeker_id: '550e8400-e29b-41d4-a716-446655440001',
            warehouse_id: '004a9f58-7cb5-4ee0-8f06-54ffa5024047',
            blocks: [{ id: "A1" }, { id: "A2" }],
            start_date: '2026-04-01',
            end_date: '2026-05-01',
            total_amount: 1000,
            payment_method: 'card',
            goods_type: 'Electronics',
            customer_details: { name: 'Test User' }
        };

        const res1 = await fetch('http://localhost:8080/api/bookings/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload1)
        });

        console.log("FIRST BOOKING:", await res1.json());

        // Repeat the exact same booking immediately to see if FCFS catches it
        const res2 = await fetch('http://localhost:8080/api/bookings/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload1)
        });

        console.log("SECOND BOOKING:", await res2.json());

    } catch(err) {
        console.error("Test error:", err);
    }
}

startBooking();
