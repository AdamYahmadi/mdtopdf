import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://dsfhpaopunfectnyhkyq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_xSYJGT8nHlwhrmegXnkIhg_xi6GSF-C";
window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
