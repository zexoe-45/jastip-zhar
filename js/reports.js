function renderReports(){
 const orders=orderData(),customers=customerData();
 const customerOptions=customers.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");
 const content=`<div class="page-head"><div><h1>Laporan Pemesan</h1><p>Ringkasan pesanan, nilai transaksi, dan pembayaran setiap pelanggan.</p></div><div class="report-actions"><button class="btn btn-primary" onclick="exportReportPDF()">Unduh PDF</button></div></div>
 <div class="card"><div class="report-filters">
 <label>Dari tanggal<input type="date" id="reportFrom"></label><label>Sampai tanggal<input type="date" id="reportTo"></label>
 <label>Nama pemesan<select id="reportCustomer"><option value="">Semua pemesan</option>${customerOptions}</select></label>
 <label>Status pesanan<select id="reportStatus"><option value="">Semua status</option><option>Pesanan Masuk</option><option>Barang Dibeli</option><option>Dalam Perjalanan</option><option>Barang Sampai</option><option>Selesai</option><option>Dibatalkan</option></select></label>
 <label>Status pembayaran<select id="reportPayment"><option value="">Semua pembayaran</option><option>Belum Lunas</option><option>DP</option><option>Lunas</option></select></label>
 <div class="report-actions"><button class="btn btn-primary" onclick="applyReportFilters()">Terapkan</button> <button class="btn btn-secondary" onclick="resetReportFilters()">Reset</button></div>
 </div></div><div id="reportResults"></div>`;
 document.getElementById("app").innerHTML=shell("Laporan",content); applyReportFilters();
}
function filteredReportOrders(){
 const from=document.getElementById("reportFrom")?.value||"",to=document.getElementById("reportTo")?.value||"",customer=document.getElementById("reportCustomer")?.value||"",status=document.getElementById("reportStatus")?.value||"",payment=document.getElementById("reportPayment")?.value||"";
 return orderData().filter(o=>(!from||o.orderDate>=from)&&(!to||o.orderDate<=to)&&(!customer||o.customerId===customer)&&(!status||o.orderStatus===status)&&(!payment||paymentStatus(o)===payment));
}
function applyReportFilters(){
 const rows=filteredReportOrders(),total=rows.reduce((s,o)=>s+orderTotal(o),0),paid=rows.reduce((s,o)=>s+Number(o.paidAmount||0),0),fee=rows.reduce((s,o)=>s+Number(o.fee||0),0);
 const body=rows.sort((a,b)=>b.orderDate.localeCompare(a.orderDate)).map(o=>`<tr><td>${esc(o.id)}</td><td>${dateId(o.orderDate)}</td><td>${esc(customerName(o.customerId))}</td><td>${esc(o.orderStatus)}</td><td>${esc(paymentStatus(o))}</td><td>${money(orderTotal(o))}</td><td>${money(o.paidAmount||0)}</td><td>${money(Math.max(0,orderTotal(o)-(o.paidAmount||0)))}</td></tr>`).join("");
 document.getElementById("reportResults").innerHTML=`<div class="report-summary"><div class="report-metric"><span>Total pesanan</span><strong>${rows.length}</strong></div><div class="report-metric"><span>Total transaksi</span><strong>${money(total)}</strong></div><div class="report-metric"><span>Total pembayaran masuk</span><strong>${money(paid)}</strong></div></div><div class="card"><div class="card-head"><h3>Rincian pemesan</h3><span class="muted">${rows.length} data</span></div><div class="table-wrap"><table><thead><tr><th>No. Order</th><th>Tanggal</th><th>Pemesan</th><th>Status Order</th><th>Pembayaran</th><th>Total</th><th>Dibayar</th><th>Sisa</th></tr></thead><tbody>${body||'<tr><td colspan="8"><div class="empty-state"><h3>Tidak ada data</h3><p>Ubah filter untuk melihat laporan.</p></div></td></tr>'}</tbody></table></div><div class="report-actions" style="padding:16px"><span class="muted">Estimasi fee jastip: <b>${money(fee)}</b></span></div></div>`;
}
function resetReportFilters(){["reportFrom","reportTo","reportCustomer","reportStatus","reportPayment"].forEach(id=>{const el=document.getElementById(id);if(el)el.value=""});applyReportFilters()}
function exportReportPDF(){window.print()}
