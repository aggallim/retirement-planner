// Account system settings (intent 045). Accounts are only for Advanced mode;
// Simple mode never needs one. While supabaseUrl is empty, no account UI is
// shown anywhere and the app keeps its "no account" privacy wording.
//
// supabaseAnonKey is a public Supabase key: the publishable key
// (sb_publishable_..., used here) or the legacy "anon" key. Either is designed
// to be public (row-level security protects the data), so it is safe to
// commit. Never put a secret key (sb_secret_...) or the service_role key here
// or in any file the site serves.
//
// advancedRequiresAccount: false = Advanced is an open beta preview for
// everyone. true = Advanced needs a signed-in account whose profile has
// advanced_access (the friends-and-family beta, roadmap #23).
window.ACCOUNT_CONFIG = {
  supabaseUrl: 'https://jkoruktwyfbszshnekaj.supabase.co',
  supabaseAnonKey: 'sb_publishable_jmZKw39MI9PVYmBofXXNgQ_V4aLRNgQ',
  // true since intent 058: the friends-and-family beta (roadmap #23).
  advancedRequiresAccount: true
};
