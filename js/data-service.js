// Jastara data bridge: local cache + Supabase-owned records.
(function () {
  const client = () => window.supabaseClient;
  const userId = () => window.currentSupabaseUser?.id;
  let ready = false;
  let syncing = Promise.resolve();
  let hydrating = false;

  const keys = {
    customers: STORAGE_KEYS.customers,
    batches: STORAGE_KEYS.batches,
    orders: STORAGE_KEYS.orders,
  };

  const orderToDb = (o) => ({
    user_id: userId(), legacy_id: o.id, order_code: o.id,
    customer_id: null, batch_id: null, order_date: o.orderDate,
    status: ({
      "Pesanan Masuk": "pending", "Diproses": "processed",
      "Barang Dibeli": "purchased", "Dalam Perjalanan": "shipping",
      "Barang Sampai": "arrived", "Selesai": "completed",
      "Dibatalkan": "cancelled"
    })[o.orderStatus] || "pending",
    payment_status: Number(o.paidAmount || 0) <= 0 ? "unpaid" :
      Number(o.paidAmount || 0) < orderTotal(o) ? "partial" : "paid",
    total_amount: orderTotal(o), jastip_fee: Number(o.fee || 0),
    shipping_cost: Number(o.shippingCost || 0), paid_amount: Number(o.paidAmount || 0),
    notes: o.note || null
  });

  function batchStatusToDb(status) {
    if (["Open", "Shopping", "Shipping"].includes(status)) return "active";
    if (["Closed", "Completed"].includes(status)) return "completed";
    if (status === "Upcoming") return "upcoming";
    return "cancelled";
  }
  function batchStatusFromDb(status) {
    return ({ upcoming: "Upcoming", active: "Open", completed: "Completed", cancelled: "Closed" })[status] || "Upcoming";
  }
  function orderStatusFromDb(status) {
    return ({ pending: "Pesanan Masuk", processed: "Diproses", purchased: "Barang Dibeli", shipping: "Dalam Perjalanan", arrived: "Barang Sampai", completed: "Selesai", cancelled: "Dibatalkan" })[status] || "Pesanan Masuk";
  }

  async function checked(query) {
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async function readRemote() {
    const db = client();
    const [customers, batches, orders, items] = await Promise.all([
      checked(db.from("customers").select("*").order("created_at")),
      checked(db.from("batches").select("*").order("created_at")),
      checked(db.from("orders").select("*").order("order_date")),
      checked(db.from("order_items").select("*").order("created_at"))
    ]);
    const itemsByOrder = new Map();
    items.forEach((item) => {
      if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, []);
      itemsByOrder.get(item.order_id).push({
        productName: item.product_name, productUrl: item.product_url || "",
        qty: Number(item.quantity), unitPrice: Number(item.unit_price), note: item.notes || ""
      });
    });
    return {
      customers: customers.map(c => ({ id: c.legacy_id || c.id, name: c.name, whatsapp: c.phone || "", address: c.address || "", city: c.city || "", note: c.notes || "" })),
      batches: batches.map(b => ({ id: b.legacy_id || b.id, name: b.name, location: b.destination || "", openDate: b.open_date || "", deadline: b.deadline || "", estimatedArrival: b.estimated_arrival || "", quota: b.quota, status: batchStatusFromDb(b.status) })),
      orders: orders.map(o => ({
        id: o.legacy_id || o.order_code || o.id,
        customerId: customers.find(c => c.id === o.customer_id)?.legacy_id || customers.find(c => c.id === o.customer_id)?.id || "",
        batchId: batches.find(b => b.id === o.batch_id)?.legacy_id || batches.find(b => b.id === o.batch_id)?.id || "",
        orderDate: o.order_date, items: itemsByOrder.get(o.id) || [],
        fee: Number(o.jastip_fee || 0), shippingCost: Number(o.shipping_cost || 0),
        paidAmount: Number(o.paid_amount || 0), orderStatus: orderStatusFromDb(o.status), note: o.notes || ""
      }))
    };
  }

  async function syncSnapshot() {
    if (!ready || hydrating || !userId()) return;
    const db = client(), uid = userId();
    const customers = Store.get(keys.customers, []);
    const batches = Store.get(keys.batches, []);
    const orders = Store.get(keys.orders, []);
    const customerRows = customers.map(c => ({
      user_id: uid, legacy_id: c.id, name: c.name,
      phone: c.whatsapp || null, address: c.address || null,
      city: c.city || null, notes: c.note || null
    }));
    const batchRows = batches.map(b => ({
      user_id: uid, legacy_id: b.id, name: b.name, destination: b.location || null,
      open_date: b.openDate || null, deadline: b.deadline || null,
      estimated_arrival: b.estimatedArrival || null, quota: Number(b.quota || 10),
      status: batchStatusToDb(b.status)
    }));
    if (customerRows.length) await checked(db.from("customers").upsert(customerRows, { onConflict: "user_id,legacy_id" }));
    if (batchRows.length) await checked(db.from("batches").upsert(batchRows, { onConflict: "user_id,legacy_id" }));

    const [remoteCustomers, remoteBatches] = await Promise.all([
      checked(db.from("customers").select("id,legacy_id")),
      checked(db.from("batches").select("id,legacy_id"))
    ]);
    const customerIds = new Map(remoteCustomers.map(x => [x.legacy_id, x.id]));
    const batchIds = new Map(remoteBatches.map(x => [x.legacy_id, x.id]));
    const orderRows = orders.map(o => ({
      ...orderToDb(o), customer_id: customerIds.get(o.customerId) || null,
      batch_id: batchIds.get(o.batchId) || null
    }));
    if (orderRows.length) await checked(db.from("orders").upsert(orderRows, { onConflict: "user_id,legacy_id" }));

    const remoteOrders = await checked(db.from("orders").select("id,legacy_id"));
    const orderIds = new Map(remoteOrders.map(x => [x.legacy_id, x.id]));

    // Keep payment records in sync with the app's cumulative paidAmount field.
    const paymentRows = await checked(db.from("payments").select("order_id,amount,status"));
    for (const o of orders) {
      const orderId = orderIds.get(o.id);
      if (!orderId) continue;
      const alreadyRecorded = paymentRows
        .filter(p => p.order_id === orderId && p.status === "success")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const targetPaid = Number(o.paidAmount || 0);
      const missingPayment = Math.round((targetPaid - alreadyRecorded) * 100) / 100;
      if (missingPayment > 0) {
        await checked(db.from("payments").upsert({
          user_id: uid, order_id: orderId, amount: missingPayment,
          payment_method: "Dicatat dari Jastara", status: "success",
          legacy_id: `AUTO-${o.id}-${targetPaid}`,
          notes: "Sinkronisasi pembayaran dari total pembayaran order"
        }, { onConflict: "user_id,legacy_id" }));
      }
    }

    for (const o of orders) {
      const orderId = orderIds.get(o.id);
      if (!orderId) continue;
      await checked(db.from("order_items").delete().eq("order_id", orderId));
      const itemRows = (o.items || []).map(item => ({
        user_id: uid, order_id: orderId, product_name: item.productName,
        product_url: item.productUrl || null, quantity: Number(item.qty),
        unit_price: Number(item.unitPrice), subtotal: Number(item.qty) * Number(item.unitPrice),
        notes: item.note || null
      }));
      if (itemRows.length) await checked(db.from("order_items").insert(itemRows));
    }
  }

  window.queueSupabaseSync = function () {
    if (!ready || hydrating) return syncing;
    syncing = syncing.then(syncSnapshot).catch(error => {
      console.error("Jastara sync error:", error);
      window.dispatchEvent(new CustomEvent("jastara:sync-error", { detail: error }));
      throw error;
    });
    return syncing;
  };
  window.flushSupabaseSync = function () {
    return window.queueSupabaseSync();
  };

  window.initializeJastaraData = async function () {
    if (ready) return true;
    if (!userId()) return false;
    hydrating = true;
    try {
      const db = client();
      const remote = await readRemote();
      const local = {
        customers: Store.get(keys.customers, []),
        batches: Store.get(keys.batches, []),
        orders: Store.get(keys.orders, [])
      };
      // Merge per table so that an existing customer row cannot cause still-local
      // batches or orders to be discarded when those remote tables are empty.
      const mergeById = (remoteRows, localRows) => {
        const merged = new Map((localRows || []).map(row => [String(row.id), row]));
        (remoteRows || []).forEach(row => merged.set(String(row.id), row));
        return [...merged.values()];
      };
      const merged = {
        customers: mergeById(remote.customers, local.customers),
        batches: mergeById(remote.batches, local.batches),
        orders: mergeById(remote.orders, local.orders)
      };
      Store.set(keys.customers, merged.customers);
      Store.set(keys.batches, merged.batches);
      Store.set(keys.orders, merged.orders);
      ready = true;
      hydrating = false;
      if (merged.customers.length || merged.batches.length || merged.orders.length) {
        await syncSnapshot();
        console.info("Jastara: data lokal dan Supabase berhasil diselaraskan.");
      }
      return true;
    } catch (error) {
      hydrating = false;
      console.error("Jastara gagal memuat data Supabase:", error);
      alert("Data dari Supabase belum dapat dimuat. Periksa koneksi internet dan izin database, lalu muat ulang. Detail: " + error.message);
      return false;
    }
  };
})();
