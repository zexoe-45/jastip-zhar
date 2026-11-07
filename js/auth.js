// Shared Supabase Auth helpers for the plain HTML/CSS/JavaScript app.
async function requireSupabaseLogin() {
  const { data, error } = await window.supabaseClient.auth.getSession();
  if (error || !data.session) {
    location.replace("index.html");
    return false;
  }
  window.currentSupabaseUser = data.session.user;
  return true;
}

async function supabaseLogout() {
  const { error } = await window.supabaseClient.auth.signOut();
  if (error) {
    alert("Gagal keluar: " + error.message);
    return;
  }
  location.replace("index.html");
}
