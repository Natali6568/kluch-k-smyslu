export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const supabaseUrl = process.env.SUPABASE_URL || 'https://nfnnulrdrnvqkmwubfku.supabase.co';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_lvHE0iDbrntwsqqH8tpi5w_D_txjTEr';
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Supabase is not configured' });
  }
  return res.status(200).json({ supabaseUrl, supabaseAnonKey });
}
