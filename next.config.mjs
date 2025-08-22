const nextConfig = {
  output: 'standalone',
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  env: {
    // Provide fallback values for build time when env vars might not be available
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihbibcrwwpizsrfpznuz.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloYmliY3J3d3BpenNyZnB6bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODA2MTcsImV4cCI6MjA3MTM1NjYxN30.G5iiOeiXbDSN0Dojjl0PFVi98aEkq_NqzbRNndSKn14',eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloYmliY3J3d3BpenNyZnB6bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODA2MTcsImV4cCI6MjA3MTM1NjYxN30.G5iiOeiXbDSN0Dojjl0PFVi98aEkq_NqzbRNndSKn14
  },
};

export default nextConfig;
