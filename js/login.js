// If a recovery callback lands on the login page, never treat it as a normal login.
if (window.location.hash.includes("type=recovery")) {
  window.location.replace("reset-password.html" + window.location.hash);
}

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const errorBox = document.getElementById("loginError");
  const button = event.currentTarget.querySelector('button[type="submit"]');
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  errorBox.textContent = "";
  button.disabled = true;
  button.textContent = "Memproses...";

  try {
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session) throw new Error("Sesi login tidak berhasil dibuat.");
    location.href = "dashboard.html";
  } catch (error) {
    errorBox.textContent = error.message || "Email atau password salah.";
  } finally {
    button.disabled = false;
    button.textContent = "Masuk";
  }
});

document.getElementById("forgotPasswordLink").addEventListener("click", async (event) => {
  event.preventDefault();
  const errorBox = document.getElementById("loginError");
  const email = document.getElementById("email").value.trim();
  if (!email) {
    errorBox.textContent = "Masukkan email akun terlebih dahulu, lalu klik Lupa password.";
    document.getElementById("email").focus();
    return;
  }

  const link = event.currentTarget;
  link.textContent = "Mengirim...";
  link.style.pointerEvents = "none";
  errorBox.textContent = "";

  try {
    const redirectTo = new URL("reset-password.html", window.location.href).toString();
    const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    errorBox.textContent = "Jika email terdaftar, tautan reset password akan dikirim. Periksa Inbox dan Spam.";
    errorBox.classList.remove("error-text");
  } catch (error) {
    errorBox.textContent = error.message || "Permintaan reset password gagal.";
  } finally {
    link.textContent = "Lupa password?";
    link.style.pointerEvents = "";
  }
});

(async () => {
  // Recovery callbacks are handled on reset-password.html, not Dashboard.
  if (window.location.hash.includes("type=recovery")) return;
  const { data } = await window.supabaseClient.auth.getSession();
  if (data.session) location.replace("dashboard.html");
})();
