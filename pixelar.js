import fs from 'fs';
import sharp from 'sharp';

const inputFolder = './public/img/originales/';
const outputFolder = './public/img/fondos-pixelados/';

if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
}

// ⚙️ PARÁMETROS DEL PIXEL ART
const ANCHO_BASE = 80; // Resolución base (menor = más "bloques" grandes)
const CANTIDAD_COLORES = 16; // EL SECRETO: Limita los colores para matar el ruido
const ANCHO_FINAL = 800; // Tamaño de exportación

console.log('👾 Forjando Pixel Art de verdad...');

fs.readdirSync(inputFolder).forEach(file => {
    if (file.match(/\.(png|jpg|jpeg)$/i)) {
        const inputPath = `${inputFolder}${file}`;

        // Todas salen como PNG para que la compresión JPG no arruine los bordes
        const outputFile = file.replace(/\.(jpg|jpeg)$/i, '.png');
        const outputPath = `${outputFolder}${outputFile}`;

        // PASO 1: Achicar y destruir la paleta de colores (Posterización)
        sharp(inputPath)
            .resize(ANCHO_BASE, null, { kernel: sharp.kernel.nearest })
            .png({ palette: true, colors: CANTIDAD_COLORES }) // 👈 Esto mata el ruido
            .toBuffer()
            .then(bufferPixelado => {
                // PASO 2: Agrandar manteniendo los bloques perfectos
                return sharp(bufferPixelado)
                    .resize(ANCHO_FINAL, null, { kernel: sharp.kernel.nearest })
                    .toFile(outputPath);
            })
            .then(() => console.log(`✅ ${file} transformado en 8-bit.`))
            .catch(err => console.error(`❌ Error con ${file}:`, err));
    }
});