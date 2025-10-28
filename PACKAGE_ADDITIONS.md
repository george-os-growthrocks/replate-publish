# 📦 Package.json Additions

## Install These Dependencies

Run this command to install all required packages:

```bash
npm install jspdf html2canvas date-fns papaparse
npm install -D @types/papaparse
```

## Individual Installations

If you prefer to install one by one:

```bash
# PDF Export
npm install jspdf html2canvas

# Date Formatting
npm install date-fns

# CSV Export
npm install papaparse
npm install -D @types/papaparse
```

## Verify Installation

Check your package.json should include:

```json
{
  "dependencies": {
    "jspdf": "^2.5.1",
    "html2canvas": "^1.4.1",
    "date-fns": "^2.30.0",
    "papaparse": "^5.4.1"
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.7"
  }
}
```

## What Each Package Does

- **jspdf**: Generate PDF documents
- **html2canvas**: Convert HTML to canvas for PDF export
- **date-fns**: Format dates in Activity Feed & Analytics
- **papaparse**: Parse and generate CSV files

## After Installation

1. Restart dev server: `npm run dev`
2. Type errors should disappear
3. PDF/CSV export will work
4. Activity feed dates will format correctly

## Optional Enhancements

```bash
# For advanced charts (if needed later)
npm install recharts

# For drag-drop functionality
npm install react-dropzone

# For image cropping (avatar enhancement)
npm install react-image-crop

# For keyboard shortcuts
npm install react-hotkeys-hook

# For advanced animations
npm install framer-motion
```
