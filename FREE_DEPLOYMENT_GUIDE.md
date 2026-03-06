# Ziyo ERP Tizimi - 100% BEPUL Ishlab chiqarish (Cloud) Qo'llanmasi

Ushbu yo'riqnoma orqali Ziyo ERP tizimini har oyda 0 so'm sarflagan holda butun dunyo bo'ylab eng maksimal tezlikda ishlashini ta'minlaymiz!

## 🌐 1-Bosqich: Ma'lumotlar Bazasi (Neon.tech yoki Supabase)
PostgreSQL ma'lumotlar bazasini tekinga ochish usuli.

1. [Neon.tech](https://neon.tech/) saytiga kiring va Google orqali Sign Up qiling.
2. Yangi loyiha (Project) yarating. Mintaqa sifatida **Frankfurt** yoki **Europe** ni tanlang.
3. Loyiha yaratilgandan so'ng, sizga xuddi shunga o'xshash Connection String (Ulanish havolasi) beriladi:
   `postgresql://user:password@ep-cold-smoke-1234.eu-central-1.aws.neon.tech/neondb?sslmode=require`
4. Shu havoladan nusxa oling.

---

## ⚡ 2-Bosqich: Backend qismi (Render.com)
Express/Node.js backendimizni tekinga ishga tushirish yo'riqnomasi.

1. GitHub'ga kodlaringizni yuklang (Papka ichidagi `github_push.bat` ustiga 2 marta bosing).
2. [Render.com](https://render.com/) saytiga kirib ro'yxatdan o'ting.
3. **"New +" -> "Web Service"** ni bosib, o'zingizning GitHub dagi "Ziyo ERP" repozitoriysini tanlang.
4. **Deploy Sozlamalari:**
   - **Root Directory:** `backend` (chunki bizning serverimiz backend papkasida).
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start` yoki `node dist/server.js`
   - **Plan:** Free ($0)
5. **Environment Variables (Atrof-muhit o'zgaruvchilari):** "Advanced" bo'limida quyidagilarni kiriting:
   - `DATABASE_URL` = (Boya Neon.tech dan olgan manzilingizni qo'ying)
   - `JWT_SECRET` = `ziyo_erp_juda_maxfiy_kalit_2026_super`
   - `PORT` = `3000`
   - `FRONTEND_URL` = (Keyinroq Vercel dan oladigan domen manzilingizni kiritasiz)
6. **"Create Web Service"** tugmasini bosing va 5 daqiqa kuting. Render sizga bepul `https://ziyo-erp-api.onrender.com` kabi manzil beradi.

> 🛡️ **Muhim:** Render bepul tarifda 15 minut kirmasa uxlab qoladi. Buning oldini olish uchun [UptimeRobot.com](https://uptimerobot.com) saytiga kiring, tekin ro'yxatdan o'ting va yangi HTTPS monitor qo'shing. URL joyiga Render bergan manzilni va oxiriga `/health` qilib qo'shing. Misol: `https://ziyo-erp-api.onrender.com/health`. UptimeRobot har 15 minutda shunga kirib turadi va serveringiz umuman tozab qolmaydi!

---

## 🚀 3-Bosqich: Frontend qismi (Vercel.com)
Endi foydalanuvchilar kiradigan yuz qismini joylaymiz.

1. [Vercel.com](https://vercel.com/) saytiga kirib GitHub orqali ro'yxatdan o'ting.
2. **"Add New" -> "Project"** qilib, xuddi shu Ziyo ERP GitHub repozitoriyangizni Import qiling.
3. **Deploy Sozlamalari:**
   - **Root Directory:** Edit tugmasini bosib `frontend` jildiini tanlang.
   - **Framework:** U avtomat tarzda `Vite` deb o'zi topib oladi.
4. **Environment Variables:**
   - `VITE_API_URL` = (Render bergan manzil. M-n: `https://ziyo-erp-api.onrender.com/api`)
5. **"Deploy"** tugmasini bosing! 1 daqiqadan so'ng sizga bepul domen (`https://ziyo-erp.vercel.app`) beriladi.
*(Biz maxsus `vercel.json` faylini tayyorlab qo'yganimiz sababli, refresh qilganda xato bermaydi)*

---

## 🏆 Tabriklaymiz
Siz $0 budjet bilan butun dunyoga eng yaxshi CDN va AWS/Google kabi gigant serverlar yordamida Ziyo ERP'ni ishlatishingiz mumkin. Hamma kodlar GitHub da bo'ladi, qachon kodni o'zgartirib `.bat` orqali GitHub'ga push qilsangiz, Vercel va Render uni o'zi tortib avtomat saytni yangilaydi (CI/CD). Omadingizni bersin!
