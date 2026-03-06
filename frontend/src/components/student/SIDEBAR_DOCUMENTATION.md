# Student Dashboard Sidebar - Dokumentatsiya

## 📋 Umumiy Ma'lumot

Modern glassmorphism design bilan yaratilgan zamonaviy Student Dashboard Sidebar komponentl. Framer Motion animation va Tailwind CSS styling yordamida qurilgan.

## 🎯 Asosiy Xususiyatlar

### 1. **Glassmorphism Hover Effects**
- Har bir menyu elementi ustiga borganda yumshoq frosted glass effekti paydo bo'ladi
- Backdrop blur va transparent gradient lari bilan zamonaviy ko'rinish
- Smooth transition animatsiyalari (300ms)

### 2. **Active State Indication**
- Tanlangan menyu alohida rang bilan ajralib turadi
- Chap tomonda neon rang chiziq (green-to-cyan gradient) belgilanadi
- Cyan rengi icon fon bilan ko'rinishi aniqroq bo'ladi

### 3. **Collapsible Sidebar**
- O'ng burchakdagi toggle tugmasi bilan sidebar kichrayishi mumkin
- Kichik holida faqat ikonkalar ko'rinadi
- Hover qilganda tooltip bilan menyu nomi ko'rsatiladi
- Width smooth transition bilan o'zgaradi (500ms)

### 4. **Micro-interactions (Framer Motion)**
- Component yuklanganda slide-in animation (500ms)
- Menyu elementlari queue'da animatsiya qiladi (50ms delay)
- Button hover va tap animatsiyalari scale effekti bilan
- Icon rotation effekti hover qilganda (10°)

### 5. **Beta Badge with Glow**
- Yangi xususiyatlarni "Beta" yoki "NEW" badge bilan belgilaydi
- Beta badge'da purple gradient va glow shadow effekti
- Animation bilan scale up bo'lib paydo bo'ladi (spring animation)

## 🚀 Foydalanish Usuli

### Sidebar Komponentini Qo'shish

```tsx
import { StudentDashboardSidebar } from '@/components/student/StudentDashboardSidebar';

export default function YourPage() {
  return (
    <div className="flex">
      <StudentDashboardSidebar />
      {/* Your content here */}
    </div>
  );
}
```

### Layout Komponentini Qo'shish

```tsx
import { StudentDashboardLayout } from '@/components/student/StudentDashboardLayout';

export default function StudentPage() {
  return (
    <StudentDashboardLayout 
      title="Bosh sahifa" 
      subtitle="Sizning o'qish jurnali"
    >
      {/* Your page content */}
    </StudentDashboardLayout>
  );
}
```

## 🎨 Styling va Color Palette

```
Primary Colors:
- Cyan: #06B6D4 (rgb(6, 182, 212))
- Blue: #3B82F6 (rgb(59, 130, 246))
- Green: #22C55E (rgb(34, 197, 94))

Accent Colors:
- Purple: #A855F7 (Beta badge)
- Pink: #EC4899 (Beta badge)

Background:
- Sidebar: gradient-to-b from-slate-900/95 to-slate-900/80
- Glass Effect: rgba(15, 25, 50, 0.8) with backdrop blur
```

## 📱 Responsive Design

- Desktop: Full width sidebar (w-72)
- Collapsed: Icon-only mode (w-24)
- Mobile: Ko'rsatilishi mumkin, lekin collapsible o'lsa juda yaxshi

## 🔧 Sozlash

### Menyu Elementlarini O'zgartirish

[StudentDashboardSidebar.tsx](src/components/student/StudentDashboardSidebar.tsx) faylida `menuItems` arrayini o'zgartiring:

```tsx
const menuItems: MenuItem[] = [
  {
    id: 'unique-id',
    label: 'Menyu nomi',
    icon: <YourIcon size={22} />,
    path: '/your-path',
    badge?: 'Beta', // Ixtiyoriy
    emoji?: '🎯', // Ixtiyoriy
  },
  // ...
];
```

### Ranglarni O'zgartirish

Tailwind CSS classes'larini o'zgartiring:
- `text-cyan-400` → Boshqa rang
- `bg-gradient-to-r from-blue-500 to-cyan-400` → Boshqa gradient
- `from-green-400 to-cyan-400` → Neon line rangini o'zgartirish

### Animation Vaqtini O'zgartirish

```tsx
// Sidebar slide-in animation
<motion.aside
  transition={{ duration: 0.5, ease: 'easeOut' }}
  // ...
/>

// Menu item animation
transition={{
  duration: 0.3,
  delay: index * 0.05,
  ease: 'easeOut',
}}
```

## 📦 Dependencies

- React 18.3.1
- Framer Motion 11.0.3
- Tailwind CSS 3.4.17
- Lucide React 0.468.0
- React Router DOM 6.28.1
- Clsx 2.1.1

## 🎬 Animation Vaqtlari

| Component | Vaqt | Effect |
|-----------|------|--------|
| Sidebar Entry | 500ms | Slide-in from left |
| Menu Items | 300ms (staggered) | Fade + slide from left |
| Hover Effects | 300ms | Glass effect appear |
| Badge Appear | 200ms | Spring scale animation |
| Collapse/Expand | 500ms | Width smooth transition |

## 🌟 Performance Tips

1. Sidebar'ni parent component'da memoize qiling:
```tsx
export const StudentDashboardSidebar = React.memo(() => {
  // ...
});
```

2. Menyu elementlari soni 8-10 ta bo'lsa ideal responsive ishlaydi

3. Large screens'da w-72 sidebar mos keladi, kichik screens'da collapsible ishlasa yaxshi

## ❓ Technical Details

- **Animation Library**: Framer Motion with layout animations
- **Styling**: Tailwind CSS dengan glassmorphism patterns
- **Icons**: Lucide React (22px size)
- **Navigation**: React Router Location hook
- **State Management**: React useState for collapse state

## 📝 Menyu Itemlari

1. **🏠 Bosh sahifa** - Dashboard
2. **💳 To'lovlarim** - Payments
3. **👥 Guruhlarim** - Groups
4. **📊 Ko'rsatkichlarim** - Analytics
5. **⭐ Reyting** - Rating
6. **🛍️ Do'kon** - Store/Gamification (with NEW badge)
7. **📚 Qo'shimcha darslar** - Extra Lessons (with Beta badge & glow)
8. **⚙️ Sozlamalar** - Settings

## 🚨 Known Limitations

1. Sidebar'ni scroll qilganda scrollbar thin ko'rinadi (custom styled)
2. Badge'lar faqat collapsed bo'lmagan holda ko'rinadi
3. Mobile screens'da tooltip'lar viewport'dan tashqarida chiqishi mumkin

## 🔗 Fayl Joylashuvlari

- Sidebar Component: `src/components/student/StudentDashboardSidebar.tsx`
- Layout Component: `src/components/student/StudentDashboardLayout.tsx`
- Demo Page: `src/pages/student/SidebarDemoPage.tsx`

## 📚 Qo'shimcha Resurslar

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Production Ready ✅
