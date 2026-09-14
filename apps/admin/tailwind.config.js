/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: must include every directory that uses Tailwind classes, not
  // just app/ — components/ (e.g. the campaign/newsletter email editor)
  // was missing here, which silently purged all of its classes (prose,
  // arbitrary color values, etc.) from the production CSS build.
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
};
