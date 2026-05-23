import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    // Security headers for development server
    headers: {
      // Prevent clickjacking attacks
      'X-Frame-Options': 'DENY',
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      // Enable browser XSS filter
      'X-XSS-Protection': '1; mode=block',
      // Control referrer info
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      // Permissions policy — disable unnecessary browser APIs
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      // Content Security Policy
      // Allows: same origin, privy.io (auth), wagmi/wallet infra, monad RPC, fxtwitter (profile pics), fonts
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://auth.privy.io",         // Privy requires inline scripts
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https: http:",                                         // Wallet & Twitter avatars
        "connect-src 'self' https: wss:",                                                  // RPC, Privy, wagmi WebSockets
        "frame-src https://auth.privy.io https://verify.walletconnect.com",               // Privy & WalletConnect iframes
        "worker-src 'self' blob:",
        "object-src 'none'",                                                               // Block Flash/plugins
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
    },
  },

  build: {
    // Production build: don't expose source maps (hides implementation details)
    sourcemap: false,
    // Chunk size warning threshold
    chunkSizeWarningLimit: 1000,
  },
})
