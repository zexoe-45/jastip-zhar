document.getElementById("signupForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const errorBox = document.getElementById("signupError");
  const button = event.currentTarget.querySelector('button[type="submit"]');
  errorBox.textContent = "";
  button.disabled = true;
  button.textContent = "Memproses...";

  const fullName = document.getElementById("fullname").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (password.length < 6) {
    errorBox.textContent = "Password minimal 6 karakter.";
    button.disabled = false;
    button.textContent = "Daftar Sekarang";
    return;
  }

  try {
    const { data, error } = await window.supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;

    if (data.session) {
      location.href = "dashboard.html";
    } else {
      errorBox.textContent = "Pendaftaran berhasil. Silakan cek email untuk verifikasi, lalu masuk.";
      errorBox.classList.remove("error-text");
    }
  } catch (error) {
    errorBox.textContent = error.message || "Pendaftaran gagal.";
  } finally {
    button.disabled = false;
    button.textContent = "Daftar Sekarang";
  }
});
