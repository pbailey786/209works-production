/**
 * Extract dominant color from an image URL
 * This is a client-side utility that uses canvas to analyze image colors
 */

export async function extractColorFromLogo(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = function() {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('#1a202c'); // Default dark color
          return;
        }

        // Scale down for performance
        const scaleFactor = 50 / Math.max(img.width, img.height);
        canvas.width = img.width * scaleFactor;
        canvas.height = img.height * scaleFactor;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Color buckets for dominant color detection
        const colorMap: Record<string, number> = {};
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          // Skip transparent/white pixels
          if (a < 128 || (r > 240 && g > 240 && b > 240)) continue;
          
          // Create color bucket (reduce precision for grouping)
          const bucketR = Math.floor(r / 32) * 32;
          const bucketG = Math.floor(g / 32) * 32;
          const bucketB = Math.floor(b / 32) * 32;
          
          const color = `rgb(${bucketR},${bucketG},${bucketB})`;
          colorMap[color] = (colorMap[color] || 0) + 1;
        }
        
        // Find dominant color
        let dominantColor = '#1a202c'; // Default
        let maxCount = 0;
        
        for (const [color, count] of Object.entries(colorMap)) {
          if (count > maxCount) {
            maxCount = count;
            dominantColor = color;
          }
        }
        
        // Convert to hex
        const rgbMatch = dominantColor.match(/\d+/g);
        if (rgbMatch) {
          const hex = '#' + rgbMatch.map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          }).join('');
          
          // Ensure color is dark enough for white text
          const brightness = (parseInt(rgbMatch[0]) * 299 + 
                            parseInt(rgbMatch[1]) * 587 + 
                            parseInt(rgbMatch[2]) * 114) / 1000;
          
          if (brightness > 128) {
            // Color is too light, darken it
            resolve(darkenColor(hex, 0.5));
          } else {
            resolve(hex);
          }
        } else {
          resolve(dominantColor);
        }
      } catch (error) {
        console.error('Error extracting color:', error);
        resolve('#1a202c');
      }
    };
    
    img.onerror = function() {
      resolve('#1a202c'); // Default color on error
    };
    
    img.src = imageUrl;
  });
}

function darkenColor(color: string, factor: number): string {
  const hex = color.replace('#', '');
  const r = Math.floor(parseInt(hex.substring(0, 2), 16) * factor);
  const g = Math.floor(parseInt(hex.substring(2, 4), 16) * factor);
  const b = Math.floor(parseInt(hex.substring(4, 6), 16) * factor);
  
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}