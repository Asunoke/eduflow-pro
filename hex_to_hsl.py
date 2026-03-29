import sys

def hex_to_hsl(hex_val):
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

with open("theme.css", "w", encoding="utf-8") as f:
    f.write(":root {\n")
    for k, v in light.items():
        if v.startswith("#"):
            f.write(f"    {k}: {hex_to_hsl(v)};\n")
        else:
            f.write(f"    {k}: {v};\n")
    f.write("}\n\n.dark {\n")
    for k, v in dark.items():
        if v.startswith("#"):
            f.write(f"    {k}: {hex_to_hsl(v)};\n")
        else:
            f.write(f"    {k}: {v};\n")
    f.write("}\n")
