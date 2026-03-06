@echo off
echo ========================================================
echo Ziyo ERP - GitHub'ga Yuklash (Avtomatik Bajaruvchi)
echo ========================================================

echo 1. O'zgarishlar saqlanmoqda...
git add .

echo 2. Yangi versiya tasdiqlanmoqda...
git commit -m "Deploy: 100% Free Serverless Architecture (Vercel + Render) sozlamalari qo'shildi"

echo 3. GitHub'ga yuklanmoqda...
git push

echo ========================================================
echo Muvaffaqiyatli yakunlandi! Endi GitHub'ingizga kiring.
echo ========================================================
pause
