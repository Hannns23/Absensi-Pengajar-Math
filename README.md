# 🎓 Sistem Monitoring Absensi Pengajar RFID

Website monitoring kehadiran pengajar secara *real-time* menggunakan kartu **RFID (ESP32)**, **Google Sheets API (Apps Script)**, dan **Dashboard Web (React + TypeScript + Vite)** yang di-deploy di **Vercel**.

## Fitur Utama
- **Monitoring Publik:** Menampilkan daftar kehadiran pengajar hari ini (Masuk, Terlambat, Pulang, Belum Hadir) secara otomatis.
- **Panel Admin Terpisah:** Dilindungi PIN Admin untuk melihat seluruh log sheet `Data_Absensi`, mengelola nama pengajar pada `Master_Pengajar`, dan mengatur batas jam masuk.

## Setup Lokal & Deployment Vercel
1. Pastikan variabel lingkungan `VITE_APPS_SCRIPT_URL` diisi dengan URL Web App (`/exec`) dari Google Apps Script Anda.
2. Push repositori ini ke GitHub, lalu hubungkan ke Vercel untuk deployment otomatis.
