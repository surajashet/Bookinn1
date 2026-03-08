import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qljatynhclhdbxvkfgqj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsamF0eW5oY2xoZGJ4dmtmZ3FqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQwMDUxMywiZXhwIjoyMDg2OTc2NTEzfQ.sHZ9MdBP_mzsVIu_5uRxDn_inn4uDHCmbGM7sGX8jmk";

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;