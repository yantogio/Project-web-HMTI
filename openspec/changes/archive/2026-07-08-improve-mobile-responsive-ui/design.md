## Context

Frontend HMTI adalah aplikasi Vue 3 (Composition API, `<script setup>`) dengan Tailwind CSS dan tema terang/gelap yang dikelola via `useThemeStore`. Layout admin dibungkus `AdminPageLayout.vue` yang menyediakan header sticky, banner notifikasi tagihan (khusus bendahara), dan `SpeedDialNav`. Halaman yang tersentuh: `FinanceView.vue`, `Anggota.vue`, `DocsView.vue`.

Temuan penting dari kode saat ini:
- **Header** (`AdminPageLayout.vue`): satu baris flex `justify-between`; sisi kanan berisi tombol tema, blok identitas user (`hidden md:block`), dan tombol "KELUAR" dengan `gap-4`. Pada layar sempit elemen mudah berdesakan. Tombol kembali memakai ikon SVG kompleks (path menyerupai "logout/box"), kurang dikenali sebagai aksi "kembali".
- **Banner tagihan** dirender di `z-30`; modal di halaman menggunakan z-index bervariasi (`Anggota.vue` modal `z-50`, `FinanceView.vue` modal `z-[100]`). Modal anggota `z-50` bisa kalah/berdekatan dengan banner `z-30` secara stacking context bila ada layer lain — perlu dipastikan modal selalu di atas.
- **FinanceView bukti transaksi**: baris sudah dibungkus `<a>`, namun perlu dipastikan seluruh area (bukan hanya ikon) benar-benar target tap dan cukup besar di mobile.
- **FinanceView tombol generate**: `generateDues()` hanya menyetel `isGenerateModalOpen=true`; modal `v-if` tanpa `<Transition>`. Bug "harus scroll dulu agar tombol bisa diklik lagi" mengindikasikan overlay/stale layer atau kebutuhan repaint setelah modal ditutup.
- **Anggota modal**: `fixed inset-0 z-50` dengan kartu `max-w-2xl`; tidak ada batas tinggi + scroll internal, sehingga di mobile isi form bisa melebihi viewport dan tombol submit tak terjangkau.
- **DocsView tab**: kontainer tab `flex gap-4 overflow-x-auto` dengan tombol `px-6 py-3 whitespace-nowrap` → di mobile memaksa scroll horizontal. Tabel arsip surat memakai `<table>` biasa tanpa adaptasi mobile.

## Goals / Non-Goals

**Goals:**
- Menghilangkan tumpang tindih header di mobile dan menjaga konsistensi tinggi header.
- Redesign tombol kembali agar jelas sebagai aksi "kembali", selaras di 4 kombinasi (terang/gelap × desktop/mobile).
- Memastikan modal tambah/edit anggota berada di lapisan teratas, bisa di-scroll penuh, dan bisa ditutup di mobile.
- Memperluas target tap bukti transaksi ke seluruh baris dan memperbaiki bug tombol generate tagihan.
- Membuat tabel anggota & arsip surat serta tab dokumentasi adaptif untuk mobile.

**Non-Goals:**
- Tidak mengubah backend, API, skema data, atau logika bisnis.
- Tidak mengubah tampilan/tata letak desktop yang sudah dianggap sempurna (hanya menambah penyesuaian responsif pada breakpoint kecil).
- Tidak memperkenalkan library/dependency baru.

## Decisions

**1. Header responsif dengan penyesuaian breakpoint, bukan rombak struktur.**
Pertahankan struktur flex yang ada; kecilkan `gap` di mobile (`gap-2 sm:gap-4`), pastikan blok identitas user tetap `hidden md:block`, beri `min-w-0`/`truncate` pada logo/subtitle, dan `shrink-0` pada tombol aksi. Alternatif (hamburger/menu ringkas) ditolak karena over-engineering untuk jumlah aksi yang sedikit.

**2. Tombol kembali: ikon panah kiri (chevron/arrow-left) dalam wadah tombol bertema.**
Ganti path SVG kompleks dengan ikon panah kiri standar yang universal dikenali, dibungkus tombol dengan latar lembut mengikuti aksen tema (mirip tombol tema: `rounded-full`/`rounded-lg`, `bg-*/10` gelap, `bg-amber-100` terang). Menyelaraskan dengan pola tombol tema yang sudah ada menjaga konsistensi. Alternatif (menambah label teks "Kembali") opsional untuk desktop tapi ikon panah cukup dan hemat ruang di mobile.

**3. Z-index modal dinaikkan & distandarkan.**
Naikkan modal tambah/edit anggota ke tier di atas banner (mis. `z-[100]` seperti FinanceView) dan pastikan overlay + kartu berada dalam stacking context yang benar (root `fixed inset-0`). Ini menyeragamkan konvensi lintas halaman (lihat kapabilitas `mobile-responsive-ui`).

**4. Pola modal mobile: overlay scrollable + kartu `max-h` + tombol tutup.**
Terapkan pola: root `fixed inset-0 overflow-y-auto`, kartu dengan `max-h-[90vh] overflow-y-auto` (atau area body form yang `overflow-y-auto`), padding aman untuk `safe-area`, dan pastikan ada tombol tutup (✕) yang terlihat + klik overlay untuk menutup. Ini memenuhi requirement scroll-penuh & closable pada `member-management` dan pola umum `mobile-responsive-ui`.

**5. Bukti transaksi: jadikan `<a>` block penuh sebagai target tap.**
Pastikan anchor berperilaku sebagai blok selebar penuh dengan tinggi minimum nyaman (mis. `min-h-11`), area kosong baris ikut men-trigger buka. Tidak perlu handler JS tambahan.

**6. Bug tombol generate tagihan: hilangkan stale overlay / paksa state bersih.**
Investigasi saat implementasi; perbaikan yang diutamakan: pastikan penutupan modal tidak meninggalkan overlay `fixed` yang menangkap pointer, dan tombol tidak berada dalam elemen `scroll-reveal` yang state visibility-nya terpengaruh. Bila perlu, bungkus modal dengan `<Transition>` yang bersih atau pastikan `pointer-events` overlay hilang saat `isGenerateModalOpen=false`. Verifikasi manual: buka→tutup→klik lagi tanpa scroll.

**7. Tabel adaptif: scroll horizontal yang jelas + prioritas kolom, atau layout kartu di mobile.**
Untuk tabel anggota & arsip surat, pendekatan minimal: bungkus dalam `overflow-x-auto` dengan indikator, sembunyikan kolom non-esensial di `< sm` (`hidden sm:table-cell`), dan pastikan kolom Aksi selalu tampil. Untuk arsip surat yang saat ini kehilangan aksi di mobile, tampilkan aksi inline pada baris/kartu. Layout kartu (stacked) dipertimbangkan bila kolom terlalu banyak; keputusan final per-tabel saat implementasi.

**8. Tab dokumentasi muat tanpa scroll samping.**
Ubah kontainer tab agar membungkus/menyusut di mobile: kurangi padding (`px-3 sm:px-6`), perkecil teks/ikon di mobile, gunakan `grid grid-cols-3` atau `flex-wrap` sehingga ketiga tab tampak sekaligus, hilangkan ketergantungan `overflow-x-auto` sebagai satu-satunya cara akses.

## Risks / Trade-offs

- **[Menyembunyikan kolom tabel di mobile bisa menghilangkan info]** → Sembunyikan hanya kolom non-esensial; sediakan detail via modal profil anggota / aksi buka yang sudah ada.
- **[Perubahan z-index bisa menimbulkan konflik stacking dengan SpeedDialNav/FAB]** → Uji modal bersama FAB (`z-50`) dan banner (`z-30`); pastikan modal (`z-[100]`) menang dan menutup interaksi latar.
- **[Bug tombol generate sulit direproduksi]** → Reproduksi manual di perangkat/emulator mobile sebelum & sesudah; dokumentasikan langkah verifikasi.
- **[Redesign tombol kembali mengubah kebiasaan visual]** → Gunakan ikon panah kiri konvensional; risiko rendah karena lebih standar dari ikon saat ini.
- **[Regressi tampilan desktop]** → Semua penyesuaian mobile memakai prefiks breakpoint (`sm:`/`md:`) agar desktop tak berubah; verifikasi lintas breakpoint.

## Migration Plan

Perubahan murni front-end, tanpa migrasi data. Deploy mengikuti alur build Vite biasa. Rollback = revert commit. Verifikasi manual pada breakpoint mobile (≤430px) dan desktop, mode terang & gelap, untuk tiap halaman terdampak sebelum merge.

## Open Questions

- ~~Tabel anggota & arsip surat di mobile: `overflow-x-auto` + sembunyikan kolom, atau layout kartu?~~ **Diputuskan:** gunakan `overflow-x-auto` + sembunyikan kolom non-esensial.
- ~~Tombol kembali perlu label teks "Kembali" di desktop?~~ **Diputuskan:** ikon saja tanpa teks di semua ukuran.
