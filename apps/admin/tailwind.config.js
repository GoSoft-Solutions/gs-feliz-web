/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: must include every directory that uses Tailwind classes, not
  // just app/ — components/ (e.g. the campaign/newsletter email editor)
  // was missing here, which silently purged all of its classes (prose,
  // arbitrary color values, etc.) from the production CSS build.
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // The site's actual brand palette (apps/landing/css/styles.css
      // :root) — black + ivory + orange as the one accent — as named
      // tokens, so admin UI (buttons, the sidebar, focus rings) uses the
      // exact same colors as the email templates and the public site,
      // not an approximation like Tailwind's default gray-900.
      colors: {
        ink: { DEFAULT: '#0A0A0A', soft: '#171717' },
        ivory: '#F0EDE6',
        orange: { DEFAULT: '#F4711A', hover: '#FF8C35' },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        display: ['var(--font-bebas)', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
