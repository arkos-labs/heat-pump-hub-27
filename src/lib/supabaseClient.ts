
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kcrfubblydhfmyozouez.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7cUHMQ_E1Y4iGzS3dMOLIg_Xa6xNg1N';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
