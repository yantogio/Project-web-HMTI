## 1. Header & Tombol Kembali (AdminPageLayout.vue)

- [x] 1.1 Perbaiki tata letak header agar tidak tumpang tindih di mobile: sesuaikan `gap` (mis. `gap-2 sm:gap-4`), beri `min-w-0`/`truncate` pada area logo+subtitle, dan `shrink-0` pada tombol tema & keluar
- [x] 1.2 Pastikan blok identitas user tetap tersembunyi di mobile (`hidden md:block`) dan tombol "KELUAR" tidak terdorong keluar layar pada viewport 320–430px
- [x] 1.3 Redesign tombol kembali menjadi ikon panah kiri (arrow/chevron-left) yang jelas, dibungkus wadah tombol bertema (mengikuti pola tombol tema) untuk mode terang & gelap
- [x] 1.4 Verifikasi tombol kembali tetap memanggil `goBackToMenu()` dan tampil konsisten di desktop & mobile, terang & gelap

## 2. Halaman Keuangan (FinanceView.vue)

- [x] 2.1 Jadikan seluruh baris entri bukti transaksi sebagai target tap (anchor block penuh, tinggi minimum nyaman di mobile), bukan hanya area ikon
- [x] 2.2 Reproduksi bug tombol "+ Buat Tagihan Bulan Ini" (tidak bisa diklik ulang setelah modal ditutup tanpa scroll)
- [x] 2.3 Perbaiki bug tersebut: pastikan penutupan modal tidak meninggalkan overlay yang menangkap pointer / state `scroll-reveal` yang menghalangi, sehingga tombol langsung responsif setelah modal ditutup
- [x] 2.4 Verifikasi alur buka → tutup → buka lagi modal generate tanpa perlu scroll, di mobile & desktop

## 3. Halaman Anggota (Anggota.vue)

- [x] 3.1 Naikkan z-index modal tambah & edit anggota agar berada di lapisan paling atas (di atas banner notifikasi tagihan `z-30`), samakan konvensi dengan modal lain (`z-[100]`)
- [x] 3.2 Buat modal tambah/edit dapat di-scroll penuh di mobile (root `overflow-y-auto` dan/atau kartu `max-h-[90vh] overflow-y-auto`) sampai tombol submit terjangkau
- [x] 3.3 Pastikan ada cara menutup modal di mobile (tombol tutup ✕ terlihat dan/atau tap area overlay)
- [x] 3.4 Buat tabel anggota responsif di mobile: bungkus `overflow-x-auto` yang jelas dan/atau sembunyikan kolom non-esensial (`hidden sm:table-cell`), pastikan kolom Aksi tetap tampil
- [x] 3.5 Verifikasi modal & tabel anggota di mobile (scroll, submit, tutup, akses aksi) dan pastikan desktop tidak berubah

## 4. Halaman Dokumentasi (DocsView.vue)

- [x] 4.1 Sesuaikan tab (Arsip Surat / Media Event / Branding Kit) agar muat di mobile tanpa scroll samping: kurangi padding/teks di mobile dan/atau gunakan `grid grid-cols-3`/`flex-wrap`
- [x] 4.2 Perbaiki tampilan mobile tabel arsip surat agar menampilkan data memadai dan aksi baris tetap tersedia (inline pada baris/kartu)
- [x] 4.3 Verifikasi ketiga tab langsung terlihat & dapat dipilih, serta arsip surat menampilkan data + aksi di mobile

## 5. Verifikasi Akhir Lintas Halaman

- [x] 5.1 Uji seluruh halaman terdampak pada viewport mobile (≤430px) & desktop, mode terang & gelap
- [x] 5.2 Pastikan tidak ada regresi pada tampilan desktop yang sudah dianggap sempurna
- [x] 5.3 Konfirmasi interaksi modal bersama FAB & SpeedDialNav tidak menimbulkan konflik stacking/pointer
