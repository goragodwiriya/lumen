/**
 * Font choices for the Text panel. System fonts render immediately;
 * Google Fonts are fetched on demand by core/font-loader.js the first
 * time they're picked, so we don't pay for fonts nobody uses.
 */
export const SYSTEM_FONTS = ['Georgia', 'Times New Roman', 'Courier New', 'Arial', 'Verdana', 'Impact'];

export const GOOGLE_FONTS = [
  'Manrope', 'Bricolage Grotesque',
  'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Inter', 'Nunito', 'Work Sans', 'Raleway',
  'Playfair Display', 'Merriweather', 'Lora', 'PT Serif',
  'Bebas Neue', 'Pacifico', 'Caveat', 'Permanent Marker', 'Anton', 'Righteous', 'Abril Fatface',
  'JetBrains Mono', 'Roboto Mono'
];
