// Environment configuration for switching between dev and production
export type Environment = 'development' | 'production';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Development (current Lovable setup)
const DEVELOPMENT_CONFIG: SupabaseConfig = {
  url: "https://oimhwdymghkwxznjarkv.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbWh3ZHltZ2hrd3h6bmphcmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTMxMjEsImV4cCI6MjA3MDA4OTEyMX0.97FbtgxM3nYtzTQWf8TpKqvxJ7h_pvhpBOd0SYRd05k"
};

// Production (replace with your new project credentials)
const PRODUCTION_CONFIG: SupabaseConfig = {
  url: "https://YOUR_PROD_PROJECT.supabase.co", // Replace with actual URL
  anonKey: "YOUR_PROD_ANON_KEY" // Replace with actual key
};

// Environment detection
export const getCurrentEnvironment = (): Environment => {
  // Check if running in Lovable preview
  if (window.location.hostname.includes('lovable.app')) {
    return 'development';
  }
  
  // Check for production domain
  if (window.location.hostname === 'yourgame.com') { // Replace with your domain
    return 'production';
  }
  
  // Default to development
  return 'development';
};

export const getSupabaseConfig = (): SupabaseConfig => {
  const env = getCurrentEnvironment();
  
  switch (env) {
    case 'production':
      return PRODUCTION_CONFIG;
    case 'development':
    default:
      return DEVELOPMENT_CONFIG;
  }
};

export const isDevelopment = () => getCurrentEnvironment() === 'development';
export const isProduction = () => getCurrentEnvironment() === 'production';