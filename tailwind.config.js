/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            boxShadow: {
                // La sombra sólida típica de los juegos 8-bit
                'pixel': '4px 4px 0 0 rgba(0,0,0,1)',
                'pixel-hover': '2px 2px 0 0 rgba(0,0,0,1)',
            },
            fontFamily: {
                // Esta es la fuente que te va a dar el look RPG
                'pixel': ['"Press Start 2P"', 'cursive'],
            }
        },
    },
    plugins: [],
}