import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

function resendApiProxy(resendApiKey: string) {
  return {
    name: 'resend-api-proxy',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url?.startsWith('/api/send-verification-email') || req.method !== 'POST') {
          return next()
        }

        let body = ''
        req.on('data', (chunk: any) => {
          body += chunk
        })

        await new Promise((resolve) => req.on('end', resolve))

        try {
          const payload = JSON.parse(body || '{}')
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: 'onboarding@resend.dev',
              to: payload.email,
              subject: 'Your quiz verification code',
              html: `
                <div style="font-family:system-ui, sans-serif; color:#111; line-height:1.6;">
                  <h1 style="font-size:20px; margin-bottom:10px;">Quiz verification code</h1>
                  <p style="margin:0 0 16px;">Use the code below to verify your email and continue to the quiz:</p>
                  <div style="font-size:24px; font-weight:700; letter-spacing:0.2em; margin:0 0 24px;">${payload.otp}</div>
                  <p style="margin:0 0 16px;">Campaign: <strong>${payload.campaignId}</strong></p>
                  <p style="margin:0;">If you didn’t request this, you can safely ignore this email.</p>
                </div>
              `,
            }),
          })

          const data = await response.json().catch(() => null)
          res.statusCode = response.status
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify(
              response.ok
                ? data
                : { error: data?.error?.message || 'Failed to send verification email.' }
            )
          )
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to send verification email.',
            })
          )
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const resendApiKey = env.RESEND_API_KEY

  return {
    plugins: [
      figmaAssetResolver(),
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
      resendApiProxy(resendApiKey),
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})