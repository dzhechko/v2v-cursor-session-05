# Sales AI Trainer - Style Guide

## 🎨 Visual Design System

### Color Palette

#### Primary Colors
- **Blue Primary**: `#2563eb` (blue-600) - Main brand color
- **Blue Hover**: `#1d4ed8` (blue-700) - Interactive states  
- **Blue Light**: `#eff6ff` (blue-50) - Background accents

#### Accent Colors  
- **Indigo Primary**: `#4f46e5` (indigo-600) - Feature highlights
- **Indigo Light**: `#e0e7ff` (indigo-100) - Icon backgrounds
- **Purple Gradient**: `from-purple-500 to-pink-500` - Special UI elements

#### Neutral Colors
- **Text Primary**: `#111827` (gray-900) - Main text
- **Text Secondary**: `#4b5563` (gray-600) - Secondary text
- **Background**: `#f9fafb` (gray-50) - Card backgrounds
- **Border**: `#e5e7eb` (gray-200) - Dividers

#### Status Colors
- **Success**: `#10b981` (green-500) - Positive feedback
- **Warning**: `#f59e0b` (amber-500) - Warnings  
- **Error**: `#ef4444` (red-500) - Errors
- **Info**: `#3b82f6` (blue-500) - Information

### Typography

#### Font System
- **Primary**: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'`
- **Fallback**: `'Helvetica Neue', Arial, sans-serif`

#### Text Scales
- **Hero**: `text-4xl md:text-6xl` (36px/60px) - Hero sections
- **H1**: `text-3xl md:text-4xl` (30px/36px) - Page titles
- **H2**: `text-2xl` (24px) - Section headers
- **H3**: `text-xl` (20px) - Subsection headers
- **Body**: `text-base` (16px) - Regular text
- **Small**: `text-sm` (14px) - Captions, labels

#### Font Weights
- **Bold**: `font-bold` (700) - Headlines, emphasis
- **Semibold**: `font-semibold` (600) - Subheadings
- **Regular**: `font-normal` (400) - Body text

### Spacing System

#### Margin/Padding Scale (Tailwind)
- **xs**: `1` (4px) - Tight spacing
- **sm**: `2-3` (8-12px) - Small gaps  
- **md**: `4-6` (16-24px) - Medium spacing
- **lg**: `8-12` (32-48px) - Large sections
- **xl**: `16-20` (64-80px) - Major sections

#### Container Widths
- **Mobile**: `px-4` - Mobile margins
- **Tablet**: `px-6` - Tablet margins  
- **Desktop**: `max-w-4xl mx-auto px-8` - Desktop centering

### Component Patterns

#### Buttons
```jsx
// Primary Button
className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"

// Secondary Button  
className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
```

#### Cards
```jsx
// Standard Card
className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"

// Feature Card
className="bg-gray-50 p-6 rounded-xl"
```

#### Icons
```jsx
// Icon Container
className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center"

// Icon Size
className="w-6 h-6 text-indigo-600"
```

### Layout Patterns

#### Responsive Grid
- **Mobile**: `grid-cols-1` - Single column
- **Tablet**: `md:grid-cols-2` - Two columns  
- **Desktop**: `lg:grid-cols-3` - Three columns

#### Sections
- **Padding**: `py-16 md:py-20` - Vertical section spacing
- **Container**: `max-w-4xl mx-auto px-4 sm:px-6 lg:px-8`

### Animation System

#### Framer Motion Patterns
```jsx
// Fade In
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6 }}

// Stagger Children
transition={{ staggerChildren: 0.2 }}
```

#### CSS Transitions
- **Standard**: `transition-colors` (200ms)
- **Hover**: `hover:shadow-xl transition-shadow`
- **Transform**: `transform hover:scale-105 transition-transform`

### Accessibility Standards

#### Color Contrast
- Text on light backgrounds: minimum 4.5:1 ratio
- Text on dark backgrounds: minimum 4.5:1 ratio
- Focus indicators: 2px solid blue-500

#### Interactive Elements
- Minimum touch target: 44x44px
- Focus visible outlines
- Semantic HTML elements
- ARIA labels for icons

### Mobile-First Design

#### Breakpoints
- **sm**: `640px+` - Small tablets
- **md**: `768px+` - Tablets
- **lg**: `1024px+` - Desktop
- **xl**: `1280px+` - Large desktop

#### Mobile Patterns
- Bottom-sheet modals
- Large touch targets (48px minimum)
- Thumb-friendly navigation
- Collapsible content sections

## 🛠️ Implementation Guidelines

### React/Tailwind Best Practices
1. Use utility classes over custom CSS
2. Implement responsive design mobile-first
3. Leverage Tailwind's built-in design tokens
4. Use consistent spacing scale
5. Maintain semantic HTML structure

### Style Consistency
- All new components MUST follow this style guide  
- Use defined color palette exclusively
- Maintain consistent spacing patterns
- Follow established typography hierarchy
