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
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
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

(async () => {
  const { data } = await window.supabaseClient.auth.getSession();
  if (data.session) location.replace("dashboard.html");
})();
