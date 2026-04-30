import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ryzedmdauxudjxokgxrf.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5emVkbWRhdXh1ZGp4b2tneHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMDI1MDksImV4cCI6MjA5Mjg3ODUwOX0.WpiGieStvzAdFZga0Cbt48UReUo9wAFrOL07sxXx1CE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
