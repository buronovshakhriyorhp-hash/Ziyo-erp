import { StudentDashboardLayout } from '@/components/student/StudentDashboardLayout';
import { useLocation } from 'react-router-dom';

const SidebarDemoPage: React.FC = () => {
  const location = useLocation();

  const getPageContent = () => {
    const path = location.pathname;

    const contentMap: Record<string, { title: string; subtitle: string; description: string }> = {
      '/student/dashboard': {
        title: 'Bosh sahifa',
        subtitle: 'Sizning o\'qish jurnali va asosiy ma\'lumotlar',
        description: 'Salom! Bu sizning o\'quv portali. Bu yerda siz o\'z jurnalini ko\'rish, to\'lovlarni tekshirish va har xil bo\'limlarni o\'zlashtira olasiz.',
      },
      '/student/payments': {
        title: "To'lovlarim",
        subtitle: 'Sizning barcha to\'lovlarni boshqarish va tarixni ko\'rish',
        description: 'Bu bo\'limda siz tulov status, cheksizlik muddati va to\'lov tarixi bilan tanishishingiz mumkin.',
      },
      '/student/groups': {
        title: 'Guruhlarim',
        subtitle: 'Sizga tegishli barcha dars guruhlari va vaqt jadvallari',
        description: 'Siz qaysi guruhlarda o\'qiyotganingizni ko\'rishingiz va dars jadvali bilan tanishishingiz mumkin.',
      },
      '/student/analytics': {
        title: "Ko'rsatkichlarim",
        subtitle: 'O\'qish ko\'rsatkichlari va statistika',
        description: 'Grafiklar va diagrammalar orqali o\'z o\'qish natijalaringizni kuzating.',
      },
      '/student/rating': {
        title: 'Reyting',
        subtitle: 'Sizning akademik reytingingiz va taqqoslash',
        description: 'Sinfdagi boshqa o\'quvchilar bilan o\'zingizni taqqoslab ko\'ring.',
      },
      '/student/gamification': {
        title: "Do'kon",
        subtitle: 'Ballarni hadyalarga almashtirish',
        description: 'O\'qish orqali yig\'igan ballarni foydali hadyalarni sotib olish uchun ishlatting.',
      },
      '/student/extra-lessons': {
        title: "Qo'shimcha darslar",
        subtitle: 'Qo\'shimcha darslar va online dars sessiyalari',
        description: 'O\'zingizni yanada yaxshi tayyorlash uchun qo\'shimcha darslarni ro\'yxatdan o\'ting.',
      },
      '/student/settings': {
        title: 'Sozlamalar',
        subtitle: 'Akkount sozlamalarini o\'zgartirish',
        description: 'Profil ma\'lumotlari, parol, notifikatsiyalar va hokazolni boshqaring.',
      },
    };

    return contentMap[path] || {
      title: 'Student Portal',
      subtitle: 'Welcome to your learning dashboard',
      description: 'Select a menu item from the sidebar to get started.',
    };
  };

  const content = getPageContent();

  return (
    <StudentDashboardLayout>
      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 mt-6 animate-in slide-in-from-bottom-4 fade-in duration-500 fill-mode-both delay-100">
        {[
          {
            icon: '✨',
            title: 'Glassmorphism Design',
            description: 'Modern frosted glass effect bilan zamonaviy design',
          },
          {
            icon: ' 🎨',
            title: 'Smooth Animations',
            description: 'Tailwind CSS yordamida tezkor tranzitsiyalar',
          },
          {
            icon: '⚡',
            title: 'Responsive Layout',
            description: 'Barcha qurilmalarda to\'q ishlash uchun optimizlangan',
          },
          {
            icon: '🎯',
            title: 'Active State',
            description: 'Neon chiziq va rang belgilari bilan faol menyu',
          },
          {
            icon: '📱',
            title: 'Collapsible',
            description: 'Sidebarni ikonka-faqatgina rezhimga kichraytirish',
          },
          {
            icon: '🌟',
            title: 'Beta Badges',
            description: 'Glow effekti bilan yangi xususiyatlarni belgilang',
          },
        ].map((feature, index) => (
          <div
            key={index}
            className="group relative p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-transparent to-white/5 hover:border-cyan-500/30 transition-all duration-300 backdrop-blur-xl hover:-translate-y-1 block"
          >
            {/* Glow Background */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="relative">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Section */}
      <div className="relative p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-500 fill-mode-both delay-200">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-transparent to-cyan-500/0 pointer-events-none" />

        <div className="relative">
          <h2 className="text-2xl font-bold text-white mb-4">
            👋 Xush kelibsiz!
          </h2>
          <p className="text-white/80 leading-relaxed mb-6">
            {content.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {[
              {
                label: 'Sidebarni kichraytirish',
                description: 'O\'ng burchakdagi tugmachasini bosing',
              },
              {
                label: 'Menyuni tanlash',
                description: 'Istalgan menyu elementi ustiga bosing',
              },
              {
                label: 'Hover effektlari',
                description: 'Menyu ustiga o\'tkazganda glassmorphism effekti',
              },
              {
                label: 'Beta badges',
                description: 'Yangi xususiyatlarni glow effekti bilan ko\'rish',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex gap-3 p-4 rounded-lg bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-colors"
              >
                <div className="text-cyan-400 font-bold flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white/10">
                  {index + 1}
                </div>
                <div>
                  <h4 className="text-white font-semibold">{item.label}</h4>
                  <p className="text-white/60 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-white/50 text-sm animate-in fade-in duration-500 delay-300">
        <p>Ziyo Chashmasi Student Portal © 2024</p>
      </div>
    </StudentDashboardLayout>
  );
};

export default SidebarDemoPage;
