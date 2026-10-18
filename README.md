# Minato 3D

Diorama desa pesisir Jepang modern, dibangun ulang secara prosedural dari referensi ilustrasi. Ini interpretasi bergaya low-poly, bukan rekonstruksi fotogrametri atau replika persis ilustrasi.

## Jalankan

Jalankan `python3 -m http.server 8080` dari folder ini, kemudian buka http://localhost:8080. Jangan buka index.html melalui file:// karena menggunakan modul JavaScript.

## Deploy Vercel

Upload folder ini ke repository GitHub, import repository di Vercel, pilih framework **Other**, kosongkan Build Command, dan gunakan `.` untuk Output Directory. Alternatif: jalankan `npx vercel` dari folder ini dan ikuti prompt Vercel. Tidak memerlukan backend atau environment variables.

## Kontrol

Drag untuk orbit, scroll/pinch untuk zoom, klik kanan atau dua jari untuk pan. Tombol menyediakan putar otomatis, peta atas, reset, dan unduh model GLB. GLB memuat geometri dan material desa; kontrol web dan animasi tidak termasuk di file GLB.

## Dependensi dan batasan

Three.js 0.170.0, OrbitControls, dan GLTFExporter dimuat dari jsDelivr dengan versi terkunci. Koneksi internet dan browser dengan WebGL diperlukan. Jika CDN diblokir, unduh dependensi ke hosting sendiri dan perbarui import map. Peta bersifat artistik dan tidak memiliki koordinat geografis atau skala survei.

Validasi dilakukan dengan pemeriksaan sintaks JavaScript dan file paket. Tampilan WebGL dan ekspor GLB belum diuji di browser pada lingkungan pembuatan ini.
