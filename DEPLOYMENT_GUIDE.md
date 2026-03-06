# Ziyo ERP Tizimi - Ishlab chiqarish Muhitiga (Production) O'rnatish Qo'llanmasi

Ushbu qullanma **Ziyo ERP** tizimini mukammal, xavfsiz va eng tezkor ("WOW" darajasidagi) tarzda serverga (VPS) o'rnatish bo'yicha to'liq arxitektura sirlarini o'zida jamlagan.

---

## 🏗️ 1. Server Va Infratuzulma Tanlash

Katta hajmdagi o'quvchilar bilan ishlash uchun server (VPS) tanlovi juda muhim.
Bizning tavsiya:
- **Provayder 1:** Hetzner Cloud (Falkenstein, Germaniya) - O'zbekiston uchun ping juda past.
- **Provayder 2:** DigitalOcean (Frankfurt).
- **Minimal Xususiyatlar (10,000+ o'quvchi uchun):** 4 vCPU, 8 GB RAM, 80 GB NVMe SSD.
- **Operatsion Tizim:** Ubuntu 22.04 LTS yoko 24.04 LTS x64.

---

## 🔒 2. Domen va Cloudflare O'rnatish

Tizimingiz umuman qotib qolmasligi va xakerlik (DDoS) hujumlariga uchramasligi uchun uni to'g'ridan-to'g'ri internetga shundoq ochib qo'ymang.
1. O'zingizning domeningizni (masalan `ziyo-erp.uz`) **Cloudflare** tizimiga ula.
2. Cloudflare orqali domen DNS DNS yozuvlariga CNAME/A rekorderlarni VPS IP manzilingizga mo'ljallang.
3. Cloudflare sozlamalaridan `SSL/TLS -> Full (Strict)` rejimini yoqing.

*(Frontend `.js` va `.css` fayllarini Cloudflare avtomat keshlaydi (Cache), shunda foydalanuvchilarga sayt sekundiga yuklanadi!)*

---

## 🛠️ 3. Dasturiy Ta'minotlarni O'rnatish (Serverda)

Serverga SSH orqali kiring va kerakli muhitlarni o'rnating:

### Node.js va NPM (Backend va Frontend integratsiyasi)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### PM2 (Zero-Downtime va Clustering uchun)
Bu tizim Node.js ni avariyadan saqlaydi va har bir CPU core uchun alohida jarayon ochish orqali tezlikni oshiradi.
```bash
sudo npm install -g pm2
sudo pm2 install pm2-logrotate
```

### Nginx (Traffic Reverse Proxy)
Hamma trafikni qabul qilib oluvchi darvozabon (Gateway).
```bash
sudo apt update
sudo apt install -y nginx
```

### PostgreSQL (Ma'lumotlar Bazasi)
```bash
sudo apt install -y postgresql postgresql-contrib
```
*Tavsiya:* `/etc/postgresql/14/main/postgresql.conf` (yoki oxirgi versiya) ichida `shared_buffers = 2GB` qilib sozlang (8GB RAM li server uchun).

---

## 🚀 4. Kodni Joylash va Ishga Tushirish

Tizimi loyihasini `/var/www/ziyo-erp` ichiga git orqali yoki nusxalab joylang.

### 4.1. Ma'lumotlar Bazasini Sozlash
`backend/.env` fayliga ishlab chiqarish parollarini terib chiqing. Keyin bazani tayyorlang:
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 4.2. Backendni Cluster (Tezkor) Rejimda Yoqish
Biz `backend` jildining ichida tayyorlangan `ecosystem.config.js` dan foydalanamiz:
```bash
cd backend
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save
```
Endi Backend 3000-portda eng yuqori ehtimoliy tezlikda (CPU core larning barchasidan moshchniy foydalanib) ishlamoqda.

### 4.3. Frontendni Build Qilish
React ilovasini server uchun kompress qiling:
```bash
cd frontend
npm install
npm run build
```
Natijada barcha CSS va JS fayllar siqilib `dist` jildida tayyor bo'ladi.

---

## 🌐 5. Nginx Sozlamalarini Birlashtirish

Ushbu papkada siz uchun qilingan tayyor loyiha `deployment/nginx.conf` fayli bor. 
Ularni Ubuntu nginx tizimiga ulaymiz.

```bash
sudo cp deployment/nginx.conf /etc/nginx/sites-available/ziyo-erp
sudo ln -s /etc/nginx/sites-available/ziyo-erp /etc/nginx/sites-enabled/
# Avvalgi default confni o'chiramiz
sudo rm /etc/nginx/sites-enabled/default
```

Nginx xatolik bermasligini tekshiramiz va qayta ishga tushuramiz.
```bash
sudo nginx -t
sudo systemctl restart nginx
```
**Eslatma:** `nginx.conf` faylida domen nomingiz (`erp.example.com`) va ildiz (root `/var/www/...`) manzillarini aniq qilib yozishni unutmang.

---

## 🔄 6. Uzluksiz Avtomatlashtirish (Scripts)

Loyiha ichida tayyor qilingan `deployment/` papkasining mo'jizalari.

### 1-Avtomatlashtirish: Oson Yangilash (deploy.sh)
Har doim kod yangilanganda, serverga kirib bitta komanda bilan dasturni uzi avtomatik tarzda to'xtatmasdan (Zero Downtime) yangilash:
```bash
chmod +x deployment/deploy.sh
./deployment/deploy.sh
```

### 2-Avtomatlashtirish: Xavfsiz Bazalar (backup.sh)
Cron Job qo'shib PostgreSQL ma'lumotlar bazasini har kechqurun arxivlash.
```bash
chmod +x deployment/backup.sh
crontab -e
# Quyidagi qatorni qoshing (har kuni kechasi soat 3:00 da arxivlaydi)
# 0 3 * * * /var/www/ziyo-erp/deployment/backup.sh
```

---

🎉 **TABRIKLAYMIZ! ZIYO ERP TIZIMI UCHISHGA TAYYOR!**
Dizayn va Infratuzilma bir hil "WOW" mezoniga yetkazildi. Serveringiz 10 barobargacha ortiqcha yukni (Load) bemalol server kuchi hisobiga muvozanatlash hamda NGINX tarafidan berilgan Avtomatik Keshlash sababli tez javob bera oladi. Omad!
