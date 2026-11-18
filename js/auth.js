// Shared Supabase Auth helpers for the plain HTML/CSS/JavaScript app.
async function requireSupabaseLogin() {
  const { data, error } = await window.supabaseClient.auth.getSession();
  if (error || !data.session) {
    location.replace("index.html");
    return false;
  }
  window.currentSupabaseUser = data.session.user;
  const { data: profileData, error: profileError } = await window.supabaseClient
    .from("profiles").select("role, full_name").eq("id", data.session.user.id).single();
  if (profileError || !profileData) {
    alert("Profil akun tidak dapat dimuat. Silakan hubungi administrator.");
    await window.supabaseClient.auth.signOut();
    location.replace("index.html");
    return false;
  }
  window.currentUserProfile = profileData;
  window.currentUserRole = profileData.role;
  if (typeof window.initializeJastaraData === "function") {
    const loaded = await window.initializeJastaraData();
    if (!loaded) return false;
  }
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
