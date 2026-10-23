import { execSync } from 'node:child_process'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Runs a git command and returns its output, or '' when git isn't available
function git(command) {
  try {
    return execSync(`git ${command}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return ''
  }
}

// App version shown in the footer: just the number of commits, e.g. "11" → "v11". Worked out on every build,
// so each push that deploys gets a new number.
function appVersion() {
  // Hosts like Vercel clone only the last few commits — fetch the full history so the count is right
  if (git('rev-parse --is-shallow-repository') === 'true') git('fetch --unshallow --quiet')

  const count = git('rev-list --count HEAD')
  return {
    // VITE_APP_VERSION in the host's settings overrides the count
    version: process.env.VITE_APP_VERSION || count || 'dev',
    builtAt: new Date().toISOString(),
  }
}

const build = appVersion()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Read in the app as import.meta.env.VITE_APP_VERSION / VITE_APP_BUILT_AT
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(build.version),
    'import.meta.env.VITE_APP_BUILT_AT': JSON.stringify(build.builtAt),
  },
})
