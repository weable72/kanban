'use strict';

// Supabase 프로젝트 URL / anon public key (SUPABASE.md 2단계에서 확보한 값)
// anon key는 RLS로 보호되므로 클라이언트 코드에 노출되어도 안전하도록 설계된 값이다.
const SUPABASE_URL = 'https://yhjnixvjteuwoyccrrsl.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inloam5peHZqdGV1d295Y2NycnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5OTI1NzUsImV4cCI6MjA5ODU2ODU3NX0.RFTXUPqorKk4i0LCx2-NfjlUloesy2wDD22iQNgOLuM';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
