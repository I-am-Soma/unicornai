import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://agqzpygitmgfoxrqcptg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFncXpweWdpdG1nZm94cnFjcHRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MjcxMzIsImV4cCI6MjA1NjAwMzEzMn0.viDhdw0Ujc_rUXrTAluw_ZB8sfMAQEh3b61CtzorRnQ"; // Usa la clave correcta

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
