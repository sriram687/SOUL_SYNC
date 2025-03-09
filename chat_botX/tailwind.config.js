const { keyframes } = require('@emotion/react');

module.exports = {
  theme: {
    extend: {
      animation: {
        'gradient': 'gradient 8s linear infinite',
      },
      keyframes: {
        'gradient': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
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