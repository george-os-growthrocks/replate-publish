# 🎨 AnotherSEOGuru Brand Colors - Quick Reference

## ✨ Brand Colors

### Primary (Vibrant Blue)
- `bg-primary` - Blue background
- `text-primary` - Blue text
- `text-primary-glow` - Lighter blue for glows
- `border-primary` - Blue borders
- **HSL**: `217 91% 60%`

### Secondary (Green)
- `bg-secondary` - Green background
- `text-secondary` - Green text
- `border-secondary` - Green borders
- **HSL**: `142 76% 36%`

### Accent (Light Green)
- `bg-accent` - Light green background
- `text-accent` - Light green text
- `border-accent` - Light green borders
- **HSL**: `142 69% 58%`

### Utility Colors
- `bg-success` / `text-success` - Green (same as secondary)
- `bg-warning` / `text-warning` - Orange
- `bg-destructive` / `text-destructive` - Red
- `bg-muted` / `text-muted-foreground` - Dark gray

## 🌈 Gradients

Use as classes or in Tailwind:

```tsx
// As utility class
<div className="gradient-primary">...</div>

// As Tailwind background
<div className="bg-gradient-primary">...</div>
```

### Available Gradients:
- `.gradient-primary` or `bg-gradient-primary` - Blue → Green
- `.gradient-secondary` or `bg-gradient-secondary` - Green → Teal
- `.gradient-hero` or `bg-gradient-hero` - Dark blue → Blue
- `.gradient-card` or `bg-gradient-card` - Dark gray → Lighter gray
- `.gradient-accent` or `bg-gradient-accent` - Blue → Lighter blue

## 🎯 Shadows

- `shadow-soft` - Subtle shadow
- `shadow-medium` - Medium shadow
- `shadow-strong` - Strong shadow
- `shadow-glow` - Blue glow effect
- `shadow-xl` - Extra large shadow

## ⚡ Transitions

- `.transition-smooth` - Smooth 0.3s transition
- `.transition-bounce` - Bouncy 0.5s transition
- `.transition-fast` - Fast 0.15s transition

## 🎭 Pre-built Components

### Glassmorphism Cards
```tsx
<div className="glass-card">
  {/* Rounded, bordered, semi-transparent with backdrop blur */}
</div>
```

### KPI Cards
```tsx
<div className="kpi-card">
  {/* Perfect for stats/metrics */}
</div>
```

### Chips/Badges
```tsx
<span className="chip">
  {/* Small rounded badge */}
</span>
```

## 🌐 Platform Colors

Use for social media integrations:

- `text-linkedin` / `bg-linkedin` - LinkedIn blue
- `text-twitter` / `bg-twitter` - Twitter/X light blue
- `text-instagram` / `bg-instagram` - Instagram pink
- `text-reddit` / `bg-reddit` - Reddit orange
- `text-medium` / `bg-medium` - Medium gray
- `text-quora` / `bg-quora` - Quora red
- `text-youtube` / `bg-youtube` - YouTube red
- `text-tiktok` / `bg-tiktok` - TikTok pink-red

## 📊 Chart Colors

For data visualization (Recharts):

- `var(--chart-1)` - Primary blue (hsl(217 91% 60%))
- `var(--chart-2)` - Accent green (hsl(142 69% 58%))
- `var(--chart-3)` - Secondary green (hsl(142 76% 36%))
- `var(--chart-4)` - Warning orange (hsl(38 92% 50%))
- `var(--chart-5)` - Destructive red (hsl(0 62% 50%))

## 🎨 Example Usage

### Beautiful Gradient Header
```tsx
<div className="gradient-primary p-6 rounded-lg shadow-glow">
  <h1 className="text-white font-bold">AnotherSEOGuru</h1>
</div>
```

### Stats Card with Accent
```tsx
<div className="glass-card">
  <div className="text-accent text-3xl font-bold">1,234</div>
  <div className="text-muted-foreground">Total Keywords</div>
</div>
```

### Button with Primary Color
```tsx
<button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg shadow-medium transition-smooth">
  Click Me
</button>
```

### Platform Badge
```tsx
<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-linkedin/10 border border-linkedin/20">
  <LinkedInIcon className="text-linkedin" />
  <span>Share on LinkedIn</span>
</span>
```

## 🎯 Best Practices

1. **Use semantic colors**: `bg-primary` instead of `bg-blue-500`
2. **Leverage gradients**: Make headers and CTAs pop with `.gradient-primary`
3. **Add shadows**: Use `shadow-glow` for important elements
4. **Smooth transitions**: Always add `.transition-smooth` for hover effects
5. **Platform colors**: Use `text-{platform}` for social media elements

---

**Your brand is now fully integrated!** 🚀  
All colors are consistent, accessible, and ready to use across the entire app.

