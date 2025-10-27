// Fonction pour générer des variations de couleur
export function generateColorVariations(baseColor: string): Record<string, string> {
  // Vérifier si la couleur est au format hexadécimal
  const hexToRgb = (hex: string) => {
    // Supprimer le # si présent
    hex = hex.replace(/^#/, '');
    
    // Convertir en format 3 ou 6 caractères
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    } else if (hex.length !== 6) {
      throw new Error('Format de couleur invalide. Utilisez le format #RGB ou #RRGGBB');
    }
    
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    
    return { r, g, b };
  };

  // Convertir RGB en HSL
  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    let l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }
    
    return { h, s, l };
  };
  
  // Convertir HSL en RGB
  const hslToRgb = (h: number, s: number, l: number) => {
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l; // Niveaux de gris
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  };
  
  // Convertir RGB en hexadécimal
  const rgbToHex = (r: number, g: number, b: number) => {
    const toHex = (c: number) => {
      const hex = c.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };
  
  try {
    // Convertir la couleur de base en RGB puis en HSL
    const rgb = hexToRgb(baseColor);
    const { h, s } = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    // Définir les variations de luminosité
    const variations: Record<string, number> = {
      50: 0.95,
      100: 0.9,
      200: 0.8,
      300: 0.7,
      400: 0.6,
      500: 0.5,
      600: 0.4,
      700: 0.3,
      800: 0.2,
      900: 0.1
    };
    
    // Générer les variations de couleur
    const result: Record<string, string> = {};
    
    for (const [key, lightness] of Object.entries(variations)) {
      const { r, g, b } = hslToRgb(h, s, lightness);
      result[key] = rgbToHex(r, g, b);
    }
    
    return result;
  } catch (e) {
    console.error('Erreur lors de la génération des variations de couleurs :', e);
    // Retourner une palette par défaut en cas d'erreur
    return {
      '50': '#f5f3ff',
      '100': '#ede9fe',
      '200': '#ddd6fe',
      '300': '#c4b5fd',
      '400': '#a78bfa',
      '500': baseColor,
      '600': '#7c3aed',
      '700': '#6d28d9',
      '800': '#5b21b6',
      '900': '#4c1d95'
    };
  }
}
