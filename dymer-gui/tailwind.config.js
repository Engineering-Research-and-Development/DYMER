module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}",
    "./projects/**/src/**/*.{html,ts,scss}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#3f51b5',
          600: '#3949ab',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      }
    }
  },
    future: {
    hoverOnlyWhenSupported: true
  },
  corePlugins: {
    preflight: true,
  }

}