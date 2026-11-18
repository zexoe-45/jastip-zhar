const DEMO_DATA = {
  customers: [
    { id: "CUST-001", name: "Siti Rahmawati", whatsapp: "081234567890", address: "Jl. Raya Darmo No. 45", city: "Surabaya", note: "Pelanggan tetap, prefer COD" },
    { id: "CUST-002", name: "Andi Pratama", whatsapp: "081298765432", address: "Jl. Diponegoro No. 18", city: "Surabaya", note: "" },
    { id: "CUST-003", name: "Rina Maharani", whatsapp: "082112223333", address: "Jl. Gatot Subroto No. 7", city: "Jakarta", note: "Suka produk skincare" },
    { id: "CUST-004", name: "Dimas Saputra", whatsapp: "085612345678", address: "Jl. Ahmad Yani No. 22", city: "Malang", note: "" },
    { id: "CUST-005", name: "Nadia Putri", whatsapp: "081377788899", address: "Jl. Soekarno Hatta No. 10", city: "Bandung", note: "" },
    { id: "CUST-006", name: "Fajar Hidayat", whatsapp: "083812345678", address: "Jl. Pemuda No. 4", city: "Semarang", note: "" },
    { id: "CUST-007", name: "Maya Lestari", whatsapp: "081900112233", address: "Jl. Kaliurang No. 8", city: "Yogyakarta", note: "" },
    { id: "CUST-008", name: "Bagas Wicaksono", whatsapp: "089512345678", address: "Jl. Veteran No. 16", city: "Surabaya", note: "" }
  ],
  batches: [
    { id: "BATCH-001", name: "Jastip Bangkok — Oktober 2026", location: "Bangkok, Thailand", openDate: "2026-10-01", deadline: "2026-10-20", estimatedArrival: "2026-11-05", quota: 30, status: "Open" },
    { id: "BATCH-002", name: "Jastip Jepang — September 2026", location: "Tokyo, Jepang", openDate: "2026-09-01", deadline: "2026-09-18", estimatedArrival: "2026-10-01", quota: 12, status: "Shipping" },
    { id: "BATCH-003", name: "Jastip Singapore — Oktober 2026", location: "Singapore", openDate: "2026-10-03", deadline: "2026-10-15", estimatedArrival: "2026-10-25", quota: 5, status: "Closed" },
    { id: "BATCH-004", name: "Jastip Korea — November 2026", location: "Seoul, Korea Selatan", openDate: "2026-11-01", deadline: "2026-11-20", estimatedArrival: "2026-12-05", quota: 8, status: "Upcoming" }
  ],
  orders: []
};

// Demo fixtures remain available for explicit development/testing only.
// Never seed demo customers, batches, or orders into a real user's account.
function seedDemoData(force = false) {
  if (!force) return;
  Store.set(STORAGE_KEYS.customers, DEMO_DATA.customers);
  Store.set(STORAGE_KEYS.batches, DEMO_DATA.batches);
  Store.set(STORAGE_KEYS.orders, DEMO_DATA.orders);
  Store.set(STORAGE_KEYS.settings, { darkMode: false });
}

// Intentionally no automatic seedDemoData() call.
