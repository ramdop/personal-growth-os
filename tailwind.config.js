export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./views/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Lora', 'serif'],
            },
            colors: {
                white: '#ffffff',
                primary: 'rgba(var(--text-base), <alpha-value>)',
                muted: 'rgba(var(--text-base), 0.6)',
                'glass-muted': 'rgba(var(--text-base), 0.6)',
                glass: {
                    border: 'var(--glass-border-color)',
                    surface: 'var(--glass-surface-color)',
                }
            },
            animation: {
                'blob': 'blob 25s infinite alternate',
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'subtle-zoom': 'subtleZoom 60s infinite alternate',
            },
            keyframes: {
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                subtleZoom: {
                    '0%': { transform: 'scale(1.0)' },
                    '100%': { transform: 'scale(1.15) translate(-1%, -1%)' },
                }
            }
        }
    },
    plugins: [],
}
