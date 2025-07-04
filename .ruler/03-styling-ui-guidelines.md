# Styling and UI Guidelines

## Tailwind CSS Approach

- **Use utility classes primarily** - avoid custom CSS when possible
- **Follow mobile-first responsive design** using `sm:`, `md:`, `lg:`, `xl:` prefixes
- **Use semantic color names** over arbitrary values
- **Maintain consistent spacing scale**: 4, 6, 8, 12, 16, 24 (rem units)

## Color System

- **Primary**: `#0F1629` (dark blue)
- **Background**: Use `bg-background` (white in light, `#1f2937` in dark)
- **Text**: Use `text-foreground` and `text-muted-foreground`
- **Borders**: Use `border-border` for consistency across themes

## shadcn-vue Components

- Import components from `@/components/ui/`
- Use consistent button variants:
  - `default` for primary actions
  - `outline` for secondary actions  
  - `ghost` for minimal actions
  - `destructive` for dangerous actions

## Component Styling Patterns

```vue
<!-- Good: Semantic classes with responsive design -->
<div class="flex flex-col md:flex-row gap-4 p-6">
  <Button variant="outline" size="sm" class="w-full md:w-auto">
    Action
  </Button>
</div>

<!-- Avoid: Arbitrary values unless absolutely necessary -->
<div class="w-[237px] h-[45px]">
  <!-- avoid this pattern -->
</div>
```

## Dark Mode Implementation

- Use CSS variables defined in `src/assets/main.css`
- Test all components in both light and dark themes
- Ensure WCAG 2.1 AA color contrast compliance
- Use theme-aware patterns: `bg-background`, `text-foreground`

## Responsive Design

- **Mobile-first approach** - design for mobile then enhance for desktop
- **Floating action buttons** on mobile (bottom-right positioning)
- **Table to card transformation** for mobile screens
- **Touch-friendly interactions** with minimum 44px click targets
