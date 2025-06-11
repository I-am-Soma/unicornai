import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://agqzpygitmgfoxrqcptg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFncXpweWdpdG1nZm94cnFjcHRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MjcxMzIsImV4cCI6MjA1NjAwMzEzMn0.viDhdw0Ujc_rUXrTAluw_ZB8sfMAQEh3b61CtzorRnQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
