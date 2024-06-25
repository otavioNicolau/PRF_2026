import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qyqcgxgxcbvlatlwzbuy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cWNneGd4Y2J2bGF0bHd6YnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg5NzE4MTEsImV4cCI6MjAzNDU0NzgxMX0.SsFiwHvmTQgu4DvwpdR7WwHwBoH25Gdb0EzzWTe9g4Y';


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

