/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                heading: ['"Comic Neue"', 'cursive'],
                body: ['"Comic Neue"', 'cursive'],
                sans: ['"Comic Neue"', 'cursive'],
                professional: ['"Inter"', 'sans-serif'],
            },
            colors: {
                'quirky-green': '#22C55E',
                'quirky-dark-green': '#15803d',
                'quirky-pink': '#f472b6',
                'quirky-yellow': '#FACC15',
                'quirky-cream': '#F8FAFC',
                'quirky-blue': '#60a5fa',
                'quirky-black': '#1e293b',
                'quirky-purple': '#c084fc',
            },
            boxShadow: {
                hard: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                'hard-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                'hard-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                'hard-xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                soft: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
            },
            borderWidth: {
                3: '0px',
                4: '0px',
            },
            animation: {
                wiggle: 'wiggle 1s ease-in-out infinite',
                float: 'float 3s ease-in-out infinite',
            },
            keyframes: {
                wiggle: {
                    '0%, 100%': { transform: 'rotate(-3deg)' },
                    '50%': { transform: 'rotate(3deg)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
            },
        },
    },
    plugins: [],
};
