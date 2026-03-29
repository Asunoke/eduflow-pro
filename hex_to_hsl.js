import fs from 'fs';

const lightThemeStr = `  --card: #ffffff;
  --ring: #8a79ab;
  --input: #eae7f0;
  --muted: #dcd9e3;
  --accent: #e6a5b8;
  --border: #cec9d9;
  --radius: 0.5rem;
  --chart-1: #8a79ab;
  --chart-2: #e6a5b8;
  --chart-3: #77b8a1;
  --chart-4: #f0c88d;
  --chart-5: #a0bbe3;
  --popover: #ffffff;
  --primary: #8a79ab;
  --sidebar: #f1eff5;
  --spacing: 0.25rem;
  --font-mono: "Fira Code", "Courier New", monospace;
  --font-sans: Geist, sans-serif;
  --secondary: #dfd9ec;
  --background: #f8f7fa;
  --font-serif: "Lora", Georgia, serif;
  --foreground: #3d3c4f;
  --destructive: #d95c5c;
  --shadow-blur: 5px;
  --shadow-color: hsl(0 0% 0%);
  --sidebar-ring: #8a79ab;
  --shadow-spread: 1px;
  --letter-spacing: 0em;
  --shadow-opacity: 0.06;
  --sidebar-accent: #e6a5b8;
  --sidebar-border: #d7d2e0;
  --card-foreground: #3d3c4f;
  --shadow-offset-x: 1px;
  --shadow-offset-y: 2px;
  --sidebar-primary: #8a79ab;
  --muted-foreground: #6b6880;
  --accent-foreground: #4b2e36;
  --popover-foreground: #3d3c4f;
  --primary-foreground: #f8f7fa;
  --sidebar-foreground: #3d3c4f;
  --secondary-foreground: #3d3c4f;
  --destructive-foreground: #f8f7fa;
  --sidebar-accent-foreground: #4b2e36;
  --sidebar-primary-foreground: #f8f7fa;`;

const darkThemeStr = `  --card: #232030;
  --ring: #a995c9;
  --input: #2a273a;
  --muted: #242031;
  --accent: #372e3f;
  --border: #302c40;
  --chart-1: #a995c9;
  --chart-2: #f2b8c6;
  --chart-3: #77b8a1;
  --chart-4: #f0c88d;
  --chart-5: #a0bbe3;
  --popover: #232030;
  --primary: #a995c9;
  --sidebar: #16141e;
  --secondary: #5a5370;
  --background: #1a1823;
  --foreground: #e0ddef;
  --destructive: #e57373;
  --sidebar-ring: #a995c9;
  --sidebar-accent: #372e3f;
  --sidebar-border: #2a273a;
  --card-foreground: #e0ddef;
  --sidebar-primary: #a995c9;
  --muted-foreground: #a09aad;
  --accent-foreground: #f2b8c6;
  --popover-foreground: #e0ddef;
  --primary-foreground: #1a1823;
  --sidebar-foreground: #e0ddef;
  --secondary-foreground: #e0ddef;
  --destructive-foreground: #1a1823;
  --sidebar-accent-foreground: #f2b8c6;
  --sidebar-primary-foreground: #1a1823;`;

function hexToHSL(hex) {
  if (!hex || hex.indexOf('#') !== 0) return hex;
  // Convert hex to RGB first
  let r = 0, g = 0, b = 0;
  if (hex.length == 4) {
    r = "0x" + hex[1] + hex[1];
    g = "0x" + hex[2] + hex[2];
    b = "0x" + hex[3] + hex[3];
  } else if (hex.length == 7) {
    r = "0x" + hex[1] + hex[2];
    g = "0x" + hex[3] + hex[4];
    b = "0x" + hex[5] + hex[6];
  }
  // Then to HSL
  r /= 255;
  g /= 255;
  b /= 255;
  let cmin = Math.min(r,g,b),
      cmax = Math.max(r,g,b),
      delta = cmax - cmin,
      h = 0,
      s = 0,
      l = 0;

  if (delta == 0) h = 0;
  else if (cmax == r) h = ((g - b) / delta) % 6;
  else if (cmax == g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `${h} ${s}% ${l}%`;
}

function process(str) {
  return str.split('\n').map(line => {
    let [key, val] = line.split(': ');
    if (val && val.includes('#')) {
      let v = val.replace(';', '').trim();
      return key + ': ' + hexToHSL(v) + ';';
    }
    return line;
  }).join('\n');
}

console.log(":root {");
console.log(process(lightThemeStr));
console.log("}");

console.log(".dark {");
console.log(process(darkThemeStr));
console.log("}");
