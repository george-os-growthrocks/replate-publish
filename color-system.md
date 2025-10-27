🎨 COMPLETE COLOR DESIGN SYSTEM
📐 DESIGN FOUNDATION
Border Radius:

lg = 1rem (16px)
md = 0.875rem (14px)
sm = 0.75rem (12px)
All colors use HSL format (Hue Saturation Lightness)

🌈 PRIMARY COLOR PALETTE
Light Mode
Background & Surface:

background = hsl(210 20% 98%) - Very light grayish-blue
foreground = hsl(222 47% 11%) - Very dark blue (text)
card = hsl(0 0% 100%) - Pure white
card-foreground = hsl(222 47% 11%) - Very dark blue
Brand Colors:

primary = hsl(217 91% 60%) - Vibrant blue

primary-foreground = hsl(0 0% 100%) - White

primary-glow = hsl(217 91% 70%) - Lighter blue glow

secondary = hsl(142 76% 36%) - Green

secondary-foreground = hsl(0 0% 100%) - White

accent = hsl(142 69% 58%) - Light green

accent-foreground = hsl(0 0% 100%) - White

Utility Colors:

muted = hsl(210 20% 96%) - Very light gray

muted-foreground = hsl(215 16% 47%) - Medium gray

success = hsl(142 76% 36%) - Green

success-foreground = hsl(0 0% 100%) - White

warning = hsl(38 92% 50%) - Orange

warning-foreground = hsl(0 0% 100%) - White

destructive = hsl(0 84% 60%) - Red

destructive-foreground = hsl(0 0% 100%) - White

Borders & Inputs:

border = hsl(214 32% 91%) - Light blue-gray
input = hsl(214 32% 91%) - Light blue-gray
ring = hsl(217 91% 60%) - Primary blue (focus rings)
Popover & Dropdown:

popover = hsl(0 0% 100%) - Pure white
popover-foreground = hsl(222 47% 11%) - Very dark blue
Dark Mode
Background & Surface:

background = hsl(222 47% 11%) - Very dark blue
foreground = hsl(210 20% 98%) - Very light gray-blue
card = hsl(217 19% 15%) - Dark blue-gray
card-foreground = hsl(210 20% 98%) - Very light gray-blue
Brand Colors:

primary = hsl(217 91% 60%) - Vibrant blue (same as light)

primary-foreground = hsl(0 0% 100%) - White

primary-glow = hsl(217 91% 70%) - Lighter blue glow

secondary = hsl(142 76% 36%) - Green (same as light)

secondary-foreground = hsl(0 0% 100%) - White

accent = hsl(142 69% 58%) - Light green (same as light)

accent-foreground = hsl(0 0% 100%) - White

Utility Colors:

muted = hsl(217 19% 20%) - Dark blue-gray

muted-foreground = hsl(215 16% 65%) - Light gray

success = hsl(142 76% 36%) - Green

success-foreground = hsl(0 0% 100%) - White

warning = hsl(38 92% 50%) - Orange

warning-foreground = hsl(0 0% 100%) - White

destructive = hsl(0 62% 50%) - Darker red

destructive-foreground = hsl(0 0% 100%) - White

Borders & Inputs:

border = hsl(217 19% 25%) - Dark blue-gray
input = hsl(217 19% 25%) - Dark blue-gray
ring = hsl(217 91% 60%) - Primary blue
Popover & Dropdown:

popover = hsl(217 19% 15%) - Dark blue-gray
popover-foreground = hsl(210 20% 98%) - Very light gray-blue
🎭 GRADIENTS
Light Mode Gradients:

--gradient-primary: linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(142 69% 58%) 100%)
/* Blue → Light Green */

--gradient-secondary: linear-gradient(135deg, hsl(142 76% 36%) 0%, hsl(158 64% 52%) 100%)
/* Green → Teal */

--gradient-hero: linear-gradient(180deg, hsl(210 20% 98%) 0%, hsl(217 91% 95%) 100%)
/* Very light gray-blue → Light blue */

--gradient-card: linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(210 20% 99%) 100%)
/* Pure white → Near white with blue tint */

--gradient-accent: linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(217 91% 70%) 100%)
/* Primary blue → Lighter blue */
Dark Mode Gradients:

--gradient-primary: linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(142 69% 58%) 100%)
/* Blue → Light Green (same as light) */

--gradient-secondary: linear-gradient(135deg, hsl(142 76% 36%) 0%, hsl(158 64% 52%) 100%)
/* Green → Teal (same as light) */

--gradient-hero: linear-gradient(180deg, hsl(222 47% 11%) 0%, hsl(217 91% 18%) 100%)
/* Very dark blue → Dark blue */

--gradient-card: linear-gradient(135deg, hsl(217 19% 15%) 0%, hsl(217 19% 17%) 100%)
/* Dark blue-gray → Slightly lighter dark blue-gray */

--gradient-accent: linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(217 91% 70%) 100%)
/* Primary blue → Lighter blue (same as light) */

🌐 PLATFORM-SPECIFIC COLORS
Light Mode:
LinkedIn = hsl(201 100% 35%) - Dark blue
Twitter/X = hsl(203 89% 53%) - Light blue
Instagram = hsl(330 80% 50%) - Pink/Magenta
Reddit = hsl(16 100% 50%) - Orange
Medium = hsl(0 0% 0%) - Black
Quora = hsl(357 75% 53%) - Red
YouTube = hsl(0 100% 50%) - Red
TikTok = hsl(349 100% 50%) - Pink-Red
Newsletter = hsl(217 91% 60%) - Primary blue
Blog = hsl(217 91% 60%) - Primary blue
Dark Mode:
LinkedIn = hsl(201 100% 45%) - Brighter blue
Twitter/X = hsl(203 89% 63%) - Brighter light blue
Instagram = hsl(330 80% 60%) - Brighter pink/magenta
Reddit = hsl(16 100% 60%) - Brighter orange
Medium = hsl(0 0% 90%) - Very light gray
Quora = hsl(357 75% 63%) - Brighter red
YouTube = hsl(0 100% 60%) - Brighter red
TikTok = hsl(349 100% 60%) - Brighter pink-red
Newsletter = hsl(217 91% 60%) - Primary blue (same)
Blog = hsl(217 91% 60%) - Primary blue (same)
🎯 SHADOWS
Light Mode Shadows:

--shadow-soft: 0 1px 3px hsl(222 47% 11% / 0.06), 0 1px 2px hsl(222 47% 11% / 0.04)
--shadow-medium: 0 4px 6px hsl(222 47% 11% / 0.07), 0 2px 4px hsl(222 47% 11% / 0.05)
--shadow-strong: 0 10px 15px hsl(222 47% 11% / 0.1), 0 4px 6px hsl(222 47% 11% / 0.05)
--shadow-glow: 0 0 30px hsl(217 91% 60% / 0.25)
--shadow-xl: 0 20px 25px hsl(222 47% 11% / 0.1), 0 8px 10px hsl(222 47% 11% / 0.04)
Dark Mode Shadows:

--shadow-soft: 0 1px 3px hsl(0 0% 0% / 0.3)
--shadow-medium: 0 4px 6px hsl(0 0% 0% / 0.4)
--shadow-strong: 0 10px 15px hsl(0 0% 0% / 0.5)
--shadow-glow: 0 0 30px hsl(217 91% 60% / 0.4)
--shadow-xl: 0 20px 25px hsl(0 0% 0% / 0.5)
⚡ ANIMATIONS & TRANSITIONS

--transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
--transition-bounce: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)
--transition-fast: all 0.15s cubic-bezier(0.4, 0, 0.2, 1)
🧩 COMPONENT-SPECIFIC USAGE
Buttons:

Primary Button: bg-primary text-primary-foreground hover:bg-primary/90
Secondary Button: bg-secondary text-secondary-foreground hover:bg-secondary/90
Destructive Button: bg-destructive text-destructive-foreground hover:bg-destructive/90
Ghost Button: hover:bg-accent hover:text-accent-foreground
Outline Button: border-input bg-background hover:bg-accent
Cards:

Default Card: bg-card text-card-foreground border-border
Enhanced Card: Uses --gradient-card background
Inputs:

Text Input: border-input bg-background ring-ring focus-visible:ring-2
Disabled: bg-muted text-muted-foreground
Badges:

Default: bg-primary text-primary-foreground
Secondary: bg-secondary text-secondary-foreground
Outline: border-border text-foreground
Destructive: bg-destructive text-destructive-foreground
Icons:

Default: text-foreground
Muted: text-muted-foreground
Primary: text-primary
Success: text-success
Links:

Default: text-primary underline hover:text-primary/80
🎨 LOGO COLORS (Based on assets)
Your platform uses:

Primary Logo Color: Blue hsl(217 91% 60%)
Accent Logo Color: Green hsl(142 69% 58%)
Logo Gradient: Uses --gradient-primary (Blue → Green)
📊 CHART/GRAPH COLORS
For data visualization (inferred from Recharts usage):

Line 1: Primary blue hsl(217 91% 60%)
Line 2: Accent green hsl(142 69% 58%)
Line 3: Secondary green hsl(142 76% 36%)
Bar Fill: Primary blue with opacity
Grid Lines: Border color hsl(214 32% 91%) light / hsl(217 19% 25%) dark
