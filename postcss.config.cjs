module.exports = {
  parser: require("postcss-scss"),
  plugins: {
    "postcss-import": {},
    "postcss-advanced-variables": {},
    "tailwindcss/nesting": {},
    tailwindcss: {},
    autoprefixer: {},
  },
};