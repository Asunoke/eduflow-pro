import sys

def hex_to_hsl(hex_val):
    if not hex_val.startswith('#'): return hex_val
    hex_val = hex_val.lstrip('#')
    if len(hex_val) == 3:
        hex_val = ''.join([c*2 for c in hex_val])
    r, g, b = tuple(int(hex_val[i:i+2], 16)/255.0 for i in (0, 2, 4))
    cmax = max(r, g, b)
    cmin = min(r, g, b)
    delta = cmax - cmin
    
    l = (cmax + cmin) / 2
    if delta == 0:
        h = 0
        s = 0
    else:
        if cmax == r: h = ((g - b) / delta) % 6
        elif cmax == g: h = (b - r) / delta + 2
        else: h = (r - g) / delta + 4
        h = round(h * 60)
        s = delta / (1 - abs(2*l - 1))
    
    if h < 0: h += 360
    return f"{h} {round(s*100, 1)}% {round(l*100, 1)}%"

light = {
    "--background": "#f8f7fa",
    "--foreground": "#3d3c4f",
    "--card": "#ffffff",
    "--card-foreground": "#3d3c4f",
    "--popover": "#ffffff",
    "--popover-foreground": "#3d3c4f",
    "--primary": "#8a79ab",
    "--primary-foreground": "#f8f7fa",
    "--secondary": "#dfd9ec",
    "--secondary-foreground": "#3d3c4f",
    "--muted": "#dcd9e3",
    "--muted-foreground": "#6b6880",
    "--accent": "#e6a5b8",
    "--accent-foreground": "#4b2e36",
    "--destructive": "#d95c5c",
    "--destructive-foreground": "#f8f7fa",
    "--border": "#cec9d9",
    "--input": "#eae7f0",
    "--ring": "#8a79ab",
    "--chart-1": "#8a79ab",
    "--chart-2": "#e6a5b8",
    "--chart-3": "#77b8a1",
    "--chart-4": "#f0c88d",
    "--chart-5": "#a0bbe3",
    "--sidebar-background": "#f1eff5",
    "--sidebar-foreground": "#3d3c4f",
    "--sidebar-primary": "#8a79ab",
    "--sidebar-primary-foreground": "#f8f7fa",
    "--sidebar-accent": "#e6a5b8",
    "--sidebar-accent-foreground": "#4b2e36",
    "--sidebar-border": "#d7d2e0",
    "--sidebar-ring": "#8a79ab",
    "--radius": "0.5rem"
}

dark = {
    "--background": "#1a1823",
    "--foreground": "#e0ddef",
    "--card": "#232030",
    "--card-foreground": "#e0ddef",
    "--popover": "#232030",
    "--popover-foreground": "#e0ddef",
    "--primary": "#a995c9",
    "--primary-foreground": "#1a1823",
    "--secondary": "#5a5370",
    "--secondary-foreground": "#e0ddef",
    "--muted": "#242031",
    "--muted-foreground": "#a09aad",
    "--accent": "#372e3f",
    "--accent-foreground": "#f2b8c6",
    "--destructive": "#e57373",
    "--destructive-foreground": "#1a1823",
    "--border": "#302c40",
    "--input": "#2a273a",
    "--ring": "#a995c9",
    "--chart-1": "#a995c9",
    "--chart-2": "#f2b8c6",
    "--chart-3": "#77b8a1",
    "--chart-4": "#f0c88d",
    "--chart-5": "#a0bbe3",
    "--sidebar-background": "#16141e",
    "--sidebar-foreground": "#e0ddef",
    "--sidebar-primary": "#a995c9",
    "--sidebar-primary-foreground": "#1a1823",
    "--sidebar-accent": "#372e3f",
    "--sidebar-accent-foreground": "#f2b8c6",
    "--sidebar-border": "#2a273a",
    "--sidebar-ring": "#a995c9",
    "--radius": "0.5rem"
}

with open("theme_block.css", "w", encoding="utf-8") as f:
    f.write("@layer base {\n")
    f.write("  :root {\n")
    for k, v in light.items():
        f.write(f"    {k}: {hex_to_hsl(v)};\n")
    f.write("    --primary-hover: 260 22.9% 50%;\n")
    f.write("    --primary-light: 260 22.9% 95%;\n")
    f.write("    --accent-light: 342 56.5% 95%;\n")
    f.write("    --success: 142 76% 36%;\n")
    f.write("    --success-foreground: 0 0% 100%;\n")
    f.write("    --success-light: 142 76% 94%;\n")
    f.write("    --warning: 38 92% 50%;\n")
    f.write("    --warning-foreground: 0 0% 100%;\n")
    f.write("    --warning-light: 38 92% 95%;\n")
    f.write("    --destructive-light: 0 84% 95%;\n")
    f.write("    --info: 199 89% 48%;\n")
    f.write("    --info-foreground: 0 0% 100%;\n")
    f.write("    --info-light: 199 89% 95%;\n")
    f.write("    --sidebar-muted: 220 14% 50%;\n")
    f.write("    --gradient-primary: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-hover)) 100%);\n")
    f.write("    --gradient-accent: linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--accent-foreground)) 100%);\n")
    f.write("    --gradient-success: linear-gradient(135deg, hsl(var(--success)) 0%, hsl(var(--success-foreground)) 100%);\n")
    f.write("    --gradient-card: linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%);\n")
    f.write("    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);\n")
    f.write("    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);\n")
    f.write("    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);\n")
    f.write("    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);\n")
    f.write("    --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08);\n")
    f.write("    --shadow-card-hover: 0 4px 12px 0 rgb(0 0 0 / 0.12), 0 2px 4px -1px rgb(0 0 0 / 0.08);\n")
    f.write("  }\n\n")
    f.write("  .dark {\n")
    for k, v in dark.items():
        f.write(f"    {k}: {hex_to_hsl(v)};\n")
    f.write("    --primary-hover: 263 32.5% 60%;\n")
    f.write("    --primary-light: 263 32.5% 15%;\n")
    f.write("    --accent-light: 272 15.6% 12%;\n")
    f.write("    --success: 142 70% 45%;\n")
    f.write("    --success-light: 142 70% 12%;\n")
    f.write("    --warning: 38 90% 55%;\n")
    f.write("    --warning-light: 38 90% 12%;\n")
    f.write("    --destructive-light: 0 72% 12%;\n")
    f.write("    --info: 199 85% 55%;\n")
    f.write("    --info-light: 199 85% 12%;\n")
    f.write("    --sidebar-border: 249 19.6% 19%;\n")
    f.write("    --gradient-primary: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-hover)) 100%);\n")
    f.write("    --gradient-card: linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%);\n")
    f.write("    --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3);\n")
    f.write("    --shadow-card-hover: 0 4px 12px 0 rgb(0 0 0 / 0.4), 0 2px 4px -1px rgb(0 0 0 / 0.3);\n")
    f.write("  }\n")
    f.write("}\n")

