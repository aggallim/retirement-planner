// Account system settings (intent 045). Accounts are only for Advanced mode;
// Simple mode never needs one. While supabaseUrl is empty, no account UI is
// shown anywhere and the app keeps its "no account" privacy wording.
//
// supabaseAnonKey is Supabase's public "anon" key. It is designed to be
// public (row-level security protects the data), so it is safe to commit.
// Never put the service_role key here or in any file the site serves.
//
// advancedRequiresAccount: false = Advanced is an open beta preview for
// everyone. true = Advanced needs a signed-in account whose profile has
// advanced_access (the friends-and-family beta, roadmap #23).
window.ACCOUNT_CONFIG = {
  supabaseUrl: 'https://jkoruktwyfbszshnekaj.supabase.co',
  // Supabase's publishable key (sb_publishable_...), the recommended
  // replacement for the legacy anon key. Public by design (intent 057).
  supabaseAnonKey: 'sb_publishable_jmZKw39MI9PVYmBofXXNgQ_V4aLRNgQ',
  advancedRequiresAccount: false
};
