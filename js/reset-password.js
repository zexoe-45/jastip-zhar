const form = document.getElementById("resetPasswordForm");
const message = document.getElementById("resetMessage");
const submitButton = document.getElementById("resetSubmit");

function showResetForm() {
  form.hidden = false;
  message.textContent = "Tautan valid. Silakan buat password baru.";
  message.classList.remove("error-text");
}

window.supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY" && session) showResetForm();
});

(async () => {
  const { data, error } = await window.supabaseClient.auth.getSession();
  if (error) {
    message.textContent = "Gagal memeriksa sesi: " + error.message;
    message.classList.add("error-text");
    return;
  }
  if (data.session) {
    showResetForm();
  } else {
    message.textContent = "Tautan reset tidak valid atau sudah kedaluwarsa. Kembali ke login dan minta tautan reset yang baru.";
    message.classList.add("error-text");
  }
})();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = document.getElementById("newPassword").value;
  const confirmation = document.getElementById("confirmPassword").value;

  if (password.length < 6) {
    message.textContent = "Password minimal 6 karakter.";
    message.classList.add("error-text");
    return;
  }
  if (password !== confirmation) {
    message.textContent = "Konfirmasi password tidak sama.";
    message.classList.add("error-text");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Menyimpan...";
  message.textContent = "";

  try {
    const { error } = await window.supabaseClient.auth.updateUser({ password });
    if (error) throw error;
    form.hidden = true;
    message.classList.remove("error-text");
    message.textContent = "Password berhasil diperbarui. Silakan kembali ke halaman login dan masuk menggunakan password baru.";
    await window.supabaseClient.auth.signOut();
  } catch (error) {
    message.textContent = error.message || "Password gagal diperbarui. Coba minta tautan reset baru.";
    message.classList.add("error-text");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Simpan Password Baru";
  }
});
