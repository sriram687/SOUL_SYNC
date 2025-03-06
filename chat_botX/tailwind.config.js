const { keyframes } = require('@emotion/react');

module.exports = {
  theme: {
    extend: {
      keyframes: {
        beat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
        },
        coldblue: {
          '0%, 100%': { backgroundColor: 'rgb(255, 255, 255)' },
          '50%': { backgroundColor: 'rgb(198, 23, 23)' },
        },
      },
      animation: {
        beat: 'beat 1s infinite',
        coldblue: 'coldblue 1s infinite',
      },
    },
  },
  plugins: [],
};