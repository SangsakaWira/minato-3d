# Minato 3D

Game santai di diorama desa pesisir Jepang bergaya low-poly. Pancing ikan di dermaga, rawat kebun kecil, dan berteman dengan warga desa. Semua dibangun prosedural dengan Three.js, tanpa file model atau audio eksternal.

## Jalankan

Jalankan `python3 -m http.server 8080` dari folder ini, kemudian buka http://localhost:8080. Jangan buka index.html melalui file:// karena menggunakan modul JavaScript.

## Deploy Vercel

Upload folder ini ke repository GitHub, import repository di Vercel, pilih framework **Other**, kosongkan Build Command, dan gunakan `.` untuk Output Directory. Alternatif: jalankan `npx vercel` dari folder ini dan ikuti prompt Vercel. Tidak memerlukan backend atau environment variables.

## Cara main

- **Jalan**: WASD/panah, atau klik/ketuk tanah. Seret untuk memutar kamera, scroll/pinch untuk zoom.
- **Aksi**: `E`/Spasi atau tombol kanan bawah. Aksinya mengikuti konteks: bicara, cangkul, tanam, siram, panen, mancing, tidur.
- **Kebun**: 12 petak di sisi timur. Cangkul, lalu tanam benih (pilih dengan `1`–`3`), lalu siram. Tanaman yang disiram tumbuh satu tahap setiap pergantian hari. Saat hujan, kebun tersiram sendiri.
- **Mancing**: hadap ke laut dari tepi pantai, jalan papan, atau dermaga. Tekan aksi saat muncul `!`, lalu tahan Spasi/E (atau tekan layar) supaya area hijau tetap menutupi ikan.
- **Warga**: Hana (kafe), Pak Kenji (nelayan), Bu Sato (petani), dan Yuki. Masing-masing punya obrolan, dua permintaan berantai, kesukaan hadiah (satu per hari), dan toko jual/beli. Tanda `!` berarti ada permintaan baru, `★` berarti barangnya sudah siap diserahkan.
- **Hari**: satu hari berlangsung sekitar 9 menit nyata (06:00–24:00). Tidur di depan pintu rumahmu (rumah barat, dekat titik mulai) untuk lanjut ke pagi berikutnya.
- `I` tas · `Q` catatan (permintaan, keakraban, bantuan) · `M` suara.

Progres disimpan otomatis di `localStorage` browser setiap 20 detik dan setiap ganti hari.

## Struktur

- `main.js`: renderer, kamera, input, siklus hari/cuaca, loop utama
- `world.js`: desa, daratan, jalan papan, dermaga, serta query `groundHeight`/`blocked`
- `player.js`, `character.js`: karakter low-poly dan pergerakan
- `npcs.js`: data warga, dialog, permintaan, toko, hadiah
- `farm.js`, `fishing.js`: kebun dan minigame memancing
- `ui.js`, `audio.js`, `state.js`, `data.js`: HUD/dialog, efek suara sintetis, simpanan, data item

## Dependensi dan batasan

Three.js 0.170.0 dan OrbitControls dimuat dari jsDelivr dengan versi terkunci. Koneksi internet dan browser dengan WebGL diperlukan. Jika CDN diblokir, unduh dependensi ke hosting sendiri dan perbarui import map. Tambahkan `?debug` di URL untuk mengekspos state game di `window.__minato`.
