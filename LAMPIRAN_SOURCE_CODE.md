# LAMPIRAN SOURCE CODE

Sistem Informasi Organisasi HMTI — Vue.js 3, NestJS, Prisma ORM, SQLite, Google Drive API.

Seluruh potongan kode berikut disalin apa adanya dari repositori. Bagian yang dipotong
ditandai dengan baris `// ... (kode selengkapnya pada repositori)`. Nilai kredensial
disensor menjadi `********`.

---

## Lampiran 4.1 — hmti-backend/prisma/schema.prisma

Skema basis data Prisma yang mendefinisikan seluruh model beserta relasinya, yaitu anggota, transaksi, tagihan iuran, konfigurasi keuangan, konten showcase, dan dokumen.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Member {
  nia       String   @id
  npm       String   @unique
  name      String
  angkatan  String
  jabatan   String
  role      String
  status    String   @default("Aktif") // Otomatis Aktif kalau ditambah member baru
  joinedAt  DateTime @default(now())  // Otomatis terisi waktu sekarang
  password  String   @default("********")
  email     String?   // Tanda tanya (?) artinya boleh kosong (optional)
  phone     String?   // Kita simpan sebagai string agar bisa pakai format +62 dll
  bio       String?   // Untuk tulisan panjang
  avatarUrl         String?   // URL foto profil publik (Google Drive thumbnail)
  avatarDriveFileId String?   // Drive file ID untuk keperluan hapus file lama
  documents Document[] @relation("DocumentUploader")

  dues Dues[] @relation("MemberDues") // Hubungan satu anggota punya banyak tagihan
  transactions Transaction[] @relation("TransactionCreator")
}

model Transaction {
  id          Int      @id @default(autoincrement())
  type        String
  amount      Int
  category    String
  description String
  subCategory String?
  date        DateTime @default(now())
  createdAt   DateTime @default(now())
  
  proofUrl          String?
  proofDriveFileId  String?
  paymentMethod     String?

  createdByNia String
  createdBy   Member   @relation("TransactionCreator", fields: [createdByNia], references: [nia])

  // TAMBAHKAN INI: Hubungan ke Tagihan (Dues)
  // Agar kita tahu transaksi ini membayar tagihan bulan berapa
  duesId      Int?
  dues        Dues?    @relation("TransactionDues", fields: [duesId], references: [id])
}

// MODEL BARU 1: TAGIHAN (DUES)
model Dues {
  id            Int      @id @default(autoincrement())
  memberNia     String   // Siapa yang berutang
  period        String   // Periode (Format: "2023-10")
  month         Int      // Bulan (10)
  year          Int      // Tahun (2023)
  amountDue     Int      @default(0) // Tagihan wajib
  amountPaid    Int      @default(0) // Sudah bayar berapa
  status        String   @default("UNPAID") // UNPAID, PARTIAL, PAID, OVERPAID
  creditBalance  Int      @default(0) // Sisa uang (Lebih bayar) untuk bulan depan
  lateFeeApplied Boolean  @default(false) // Mencegah denda ditambahkan dua kali
  dueDate        DateTime? // Jatuh tempo
  finalDate      DateTime? // Tanggal terakhir pembayaran
  createdAt      DateTime @default(now())
  
  member        Member   @relation("MemberDues", fields: [memberNia], references: [nia])
  transactions  Transaction[] @relation("TransactionDues")
}

// MODEL BARU 2: KONFIGURASI KEUANGAN
model FinanceConfig {
  id        Int     @id @default(autoincrement())
  duesAmount Int     // Nominal iuran per bulan
  lateFee   Int     // Denda flat
  dueDay    Int     // Tanggal jatuh tempo (misal tanggal 20)
  finalDay  Int     // Tanggal terakhir pembayaran (misal tanggal 25)
  isActive  Boolean @default(true) // Hanya config aktif yang digunakan
}

model ShowcaseContent {
  id          Int       @id @default(autoincrement())
  category    String    // 'prestasi' | 'event' | 'kegiatan'
  title       String
  description String?
  dateTime    DateTime?
  isVisible   Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // FK ke Document — tidak @unique agar satu dokumen bisa jadi showcase di beberapa periode
  documentId  Int?
  document    Document? @relation("ShowcaseDocument", fields: [documentId], references: [id])

  @@map("showcase_contents")
}

model Document {
  id            Int      @id @default(autoincrement())
  title         String   // Judul dokumen atau nama event
  type          String   // 'SURAT_MASUK', 'SURAT_KELUAR', 'MEDIA', 'BRANDING'
  category      String?  // 'PDF', 'IMAGE', 'VIDEO', 'VECTOR', 'CANVA_LINK'
  
  // Informasi Google Drive
  driveFileId   String?  @unique // ID unik dari Google Drive (PENTING untuk delete/download)
  fileUrl       String   // Link untuk preview atau akses langsung
  
  // Metadata tambahan
  description   String?  @default("-")
  uploadDate    DateTime @default(now())
  
  // Relasi: Siapa yang upload?
  uploadedByNia    String
  uploader         Member           @relation("DocumentUploader", fields: [uploadedByNia], references: [nia])
  showcaseContents ShowcaseContent[] @relation("ShowcaseDocument")

  @@index([type])
  @@index([uploadDate])
  @@index([driveFileId])
}
```

---

## Lampiran 4.2 — hmti-backend/src/documents/ (proses unggah dokumen ke Google Drive)

Rangkaian kode yang menangani validasi tipe berkas (MIME-type) di sisi server, inisialisasi klien OAuth2 Google Drive, pembuatan berkas melalui `drive.files.create`, penetapan hak akses publik, hingga penyimpanan metadata berkas ke basis data.

**(a) Validasi MIME-type pada `documents.controller.ts`**

```typescript
// ... (kode selengkapnya pada repositori)

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ketum', 'bendahara', 'sekretaris')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // Batas 10MB
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File, 
    @Body() dto: CreateDocumentDto,
    @Req() req: any
  ) {
    if (!file) {
      throw new BadRequestException('File tidak terdeteksi! Cek Key di Postman harus bernama "file"');
    }

    // Penegakan tipe file per kategori di server agar tidak bisa di-bypass
    // lewat request langsung (client hanya menyaring picker).
    const mime = file.mimetype ?? '';
    const name = (file.originalname ?? '').toLowerCase();

    // Media Event hanya untuk foto & video.
    if (dto.type === 'MEDIA') {
      const isMedia = mime.startsWith('image/') || mime.startsWith('video/');
      if (!isMedia) {
        throw new BadRequestException('Media Event hanya menerima file foto (image/*) atau video (video/*).');
      }
    }

    // Branding Kit hanya untuk gambar atau file desain (tanpa video/dokumen).
    if (dto.type === 'BRANDING') {
      const brandingExts = ['.psd', '.ai', '.fig', '.sketch', '.svg', '.eps'];
      const isImage = mime.startsWith('image/');
      const isDesign = brandingExts.some((ext) => name.endsWith(ext));
      if (!isImage && !isDesign) {
        throw new BadRequestException('Branding Kit hanya menerima gambar atau file desain (PSD, AI, FIG, SKETCH, SVG, EPS).');
      }
    }

    const uploaderNia = req.user.nia; 
    return this.documentsService.create(dto, file, uploaderNia);
  }

// ... (kode selengkapnya pada repositori)
```

**(b) Inisialisasi OAuth2 client, `drive.files.create`, dan penetapan permission pada `google-drive.service.ts`**

```typescript
// ... (kode selengkapnya pada repositori)

@Injectable()
export class GoogleDriveService {
  private drive;
  private readonly logger = new Logger(GoogleDriveService.name);
  private cache: any = null;

  constructor() {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_DRIVE_CLIENT_ID,      // ********
        process.env.GOOGLE_DRIVE_CLIENT_SECRET   // ********
      );
      oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN }); // ********
      this.drive = google.drive({ version: 'v3', auth: oauth2Client });
      
      // Initialize cache if available
      if (NodeCache) {
        this.cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
        this.logger.log('[OK] Cache enabled (node-cache)');
      } else {
        this.logger.warn('[WARN] Cache disabled (install node-cache for better performance)');
      }
    } catch (e) {
      this.logger.error('Gagal inisialisasi Drive');
    }
  }

  async uploadFile(file: Express.Multer.File, targetFolderId?: string) {
    if (!this.drive) throw new InternalServerErrorException('Drive Service Down');

    // FIXER: Jika Windows mengirim octet-stream, kita paksa berdasarkan ekstensi
    let detectedMime = file.mimetype;
    if (detectedMime === 'application/octet-stream') {
      const ext = file.originalname?.split('.').pop()?.toLowerCase() ?? '';

      if (ext === 'pdf') detectedMime = 'application/pdf';
      if (ext === 'docx') detectedMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if (ext === 'png') detectedMime = 'image/png';
      if (ext === 'jpg' || ext === 'jpeg') detectedMime = 'image/jpeg';
    }

    try {
      const response = await this.drive.files.create({
        requestBody: {
          name: `${Date.now()}-${file.originalname}`,
          parents: [targetFolderId || process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID],
        },
        media: {
          mimeType: detectedMime,
          body: Readable.from(file.buffer), // Cara paling stabil kirim buffer
        },
        fields: 'id, webViewLink',
      });

      const fileId = response.data.id;

      if (!fileId) {
        throw new InternalServerErrorException('Drive tidak mengembalikan fileId');
      }

      // Pastikan file bisa diakses publik untuk kebutuhan preview di frontend.
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      // Ambil ulang metadata setelah permission diset agar link final siap dipakai.
      const publicFile = await this.drive.files.get({
        fileId,
        fields: 'id, webViewLink, webContentLink, thumbnailLink',
      });

      return publicFile.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Drive Error: ${message}`);
      throw new InternalServerErrorException('Gagal upload ke Cloud');
    }
  }

// ... (kode selengkapnya pada repositori)
}
```

**(c) Penyimpanan metadata ke basis data pada `documents.service.ts`**

```typescript
// ... (kode selengkapnya pada repositori)

  async create(dto: CreateDocumentDto, file: Express.Multer.File, uploaderNia: string) {
    try {
      this.logger.log(`Memulai upload ke Google Drive: ${file.originalname}`);

      // --- LOGIKA PEMILIHAN FOLDER OTOMATIS ---
      // Ambil Folder ID dari .env. Pastikan namanya sama persis dengan di file .env kamu!
      let targetFolderId = process.env.FOLDER_ID_SURAT; // Default ke folder surat

      if (dto.type === 'MEDIA') {
        targetFolderId = process.env.FOLDER_ID_MEDIA;
      } else if (dto.type === 'BRANDING') {
        targetFolderId = process.env.FOLDER_ID_BRANDING;
      }

      // 1. Upload ke Google Drive dengan menyertakan Folder ID tujuan
      // Kita tambahkan parameter kedua: targetFolderId
      const publicFile = await this.googleDriveService.uploadFile(file, targetFolderId);

      // 2. Simpan metadata ke Database SQLite
      return await this.prisma.document.create({
        data: {
          title: dto.title,
          type: dto.type,
          category: file.mimetype,
          fileUrl: publicFile.webContentLink || publicFile.webViewLink,
          driveFileId: publicFile.id,
          description: dto.description || '',
          uploadedByNia: uploaderNia,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Gagal upload: ${message}`);
      throw new InternalServerErrorException('Gagal memproses dokumen ke Cloud Storage');
    }
  }

// ... (kode selengkapnya pada repositori)
```

---

## Lampiran 4.3 — hmti-frontend/src/views/DocsView.vue

Fungsi penanganan unggah berkas di sisi antarmuka yang memvalidasi tipe berkas sesuai tab aktif, menyusun objek `FormData`, lalu mengirimkannya ke API melalui pemanggilan axios `uploadDocument`.

```javascript
// ... (kode selengkapnya pada repositori)

const handleFileUpload = async (event) => {
  // Mengambil file dari input klik atau drag & drop
  const file = event.target.files?.[0] || event.dataTransfer?.files?.[0]
  if (!file) return

  // Validasi tipe file per-tab secara eksplisit (bukan sekadar atribut accept
  // yang bisa di-bypass), berlaku untuk picker maupun drag-and-drop.
  const fileName = file.name?.toLowerCase() || ''
  const BRANDING_EXTS = ['.psd', '.ai', '.fig', '.sketch', '.svg', '.eps']

  // Tab Media Event: hanya foto & video.
  if (activeTab.value === 'media') {
    const isMedia = file.type?.startsWith('image/') || file.type?.startsWith('video/')
    if (!isMedia) {
      toastError('Hanya foto dan video yang diperbolehkan di Media Event')
      if (fileInput.value) fileInput.value.value = ''
      return
    }
  }

  // Tab Branding Kit: hanya gambar atau file desain (tanpa video/dokumen).
  if (activeTab.value === 'branding') {
    const isImage = file.type?.startsWith('image/')
    const isDesign = BRANDING_EXTS.some(ext => fileName.endsWith(ext))
    if (!isImage && !isDesign) {
      toastError('Branding Kit hanya menerima gambar atau file desain (PSD, AI, FIG, SKETCH, SVG, EPS)')
      if (fileInput.value) fileInput.value.value = ''
      return
    }
  }

  isUploading.value = true
  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', file.name)

  // LOGIC MAPPING: Menyesuaikan tab aktif dengan Type di Database
  let docType = 'SURAT_KELUAR'
  if (activeTab.value === 'media') docType = 'MEDIA'
  if (activeTab.value === 'branding') docType = 'BRANDING'
  formData.append('type', docType)

  try {
    await uploadDocument(formData)
    toastSuccess('Upload berhasil!')
    fetchDocs()
  } catch (err) {
    const msg = err.response?.status === 403 ? 'Hanya Ketua, Bendahara, dan Sekretaris yang dapat upload dokumen.' : 'Gagal upload. Cek koneksi backend!'
    toastError(msg)
  } finally {
    isUploading.value = false
    if (fileInput.value) fileInput.value.value = '' // Reset input file supaya bisa upload file yang sama
  }
}

// ... (kode selengkapnya pada repositori)
```

Pemanggilan axios untuk unggah dokumen didefinisikan terpisah pada `hmti-frontend/src/api/documentApi.js`:

```javascript
// ... (kode selengkapnya pada repositori)

export const uploadDocument = (formData) => {
  return api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
```

---

## Lampiran 4.4 — hmti-backend/src/finance/dues.service.ts

Method pembangkitan tagihan iuran bulanan untuk seluruh anggota aktif, yang sekaligus menerapkan denda tertunggak dan memperhitungkan saldo kelebihan bayar (credit carryover) dari periode-periode sebelumnya.

```typescript
// ... (kode selengkapnya pada repositori)

  // 4. FUNGSI GENERATE TAGIHAN BULANAN
  async generateMonthlyDues(period: string, month: number, year: number) {
    const config = await this.prisma.financeConfig.findFirst({ where: { isActive: true } });
    if (!config) throw new Error('Konfigurasi Keuangan belum diatur.');

    // Terapkan denda ke semua tagihan yang sudah lewat finalDate sebelum generate baru
    await this.applyPendingLateFees();

    const members = await this.prisma.member.findMany({ where: { status: 'Aktif' } });
    const results: { nia: string; status: string; duesId?: number }[] = [];

    for (const member of members) {
      // Skip jika tagihan periode ini sudah ada
      const existing = await this.prisma.dues.findFirst({ where: { memberNia: member.nia, period } });
      if (existing) {
        results.push({ nia: member.nia, status: 'SKIP' });
        continue;
      }

      // STEP 2: Hitung credit carryover dari bulan-bulan sebelumnya
      const creditRows = await this.prisma.dues.findMany({
        where: { memberNia: member.nia, creditBalance: { gt: 0 } },
        orderBy: [{ year: 'desc' }, { month: 'desc' }]
      });

      let totalCredit = 0;
      for (const row of creditRows) {
        const overpaidAmount = Math.max(0, (row.amountPaid || 0) - (row.amountDue || 0));
        if (overpaidAmount > 0) {
          await this.prisma.dues.update({
            where: { id: row.id },
            data: {
              amountPaid: row.amountDue,
              creditBalance: (row.creditBalance || 0) + overpaidAmount,
              status: 'OVERPAID'
            }
          });
          totalCredit += (row.creditBalance || 0) + overpaidAmount;
        } else {
          totalCredit += (row.creditBalance || 0);
        }
      }

      if (totalCredit > 0) {
        await this.prisma.dues.updateMany({
          where: { memberNia: member.nia, creditBalance: { gt: 0 } },
          data: { creditBalance: 0, status: 'PAID' }
        });
      }

      // STEP 3: Buat tagihan baru untuk bulan ini
      const paidFromCredit = Math.min(totalCredit, config.duesAmount);
      const creditBalance = Math.max(0, totalCredit - config.duesAmount);
      let status = 'UNPAID';
      if (paidFromCredit >= config.duesAmount) {
        status = creditBalance > 0 ? 'OVERPAID' : 'PAID';
      } else if (paidFromCredit > 0) {
        status = 'PARTIAL';
      }

      const newDues = await this.prisma.dues.create({
        data: {
          memberNia: member.nia,
          period,
          month,
          year,
          amountDue: config.duesAmount,
          amountPaid: paidFromCredit,
          status,
          creditBalance,
          dueDate: new Date(year, month - 1, config.dueDay),
          finalDate: new Date(year, month - 1, config.finalDay)
        }
      });

      results.push({ nia: member.nia, status: 'CREATED', duesId: newDues.id });
    }

    return results;
  }

// ... (kode selengkapnya pada repositori)
```

Perhitungan ulang saldo kas dilakukan pada `hmti-backend/src/transactions/transactions.service.ts`, yaitu dengan menelusuri seluruh transaksi terurut tanggal dan mengakumulasikan saldo berjalan (*running balance*) dari selisih pemasukan dan pengeluaran.

```typescript
// ... (kode selengkapnya pada repositori)

  async generateReport(from: string, to: string, format: 'excel' | 'word'): Promise<Buffer> {
    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        date: { gte: fromDate, lte: toDate },
      },
      orderBy: { date: 'asc' },
    });

    let runningBalance = 0;
    const rows = transactions.map((t, i) => {
      if (t.type === 'in') runningBalance += t.amount;
      else runningBalance -= t.amount;

      const date = new Date(t.date);
      const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

      return {
        no: i + 1,
        tipe: t.type === 'in' ? 'Pemasukan' : 'Pengeluaran',
        tanggal: dateStr,
        kategori: t.category,
        deskripsi: t.description,
        nominalKeluar: t.type === 'out' ? t.amount : 0,
        nominalMasuk: t.type === 'in' ? t.amount : 0,
        saldo: runningBalance,
      };
    });

    if (format === 'excel') {
      return this.generateExcel(rows, from, to);
    } else {
      return this.generateWord(rows, from, to);
    }
  }

// ... (kode selengkapnya pada repositori)
```

---

## Lampiran 4.5 — hmti-backend/src/auth/auth.service.ts

Method `validateUser()` yang memverifikasi kata sandi menggunakan `bcrypt.compare()` dan method `login()` yang menerbitkan token JWT berisi NIA serta peran pengguna.

```typescript
// ... (kode selengkapnya pada repositori)

  async validateUser(nia: string, password: string): Promise<any> {
    const user = await this.prisma.member.findUnique({
      where: { nia: nia }
    });

    if (!user) return null;

    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (e) {
    }

    if (!isPasswordValid && password === user.password) {
      isPasswordValid = true;
    }

    if (isPasswordValid) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  // Fungsi Login: Buatkan Token (Tiket Masuk)
  async login(user: any) {
    const payload = { nia: user.nia, sub: user.nia, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: user // Kita kirim juga data user biar Frontend tahu siapa yang login
    };
  }
```

---

## Lampiran 4.6 — hmti-backend/src/auth/jwt-auth.guard.ts dan hmti-backend/src/guards/roles.guard.ts

Dua kelas penjaga akses: `JwtAuthGuard` yang memvalidasi token JWT pada setiap permintaan, dan `RolesGuard` yang mencocokkan peran pengguna dengan peran yang dipersyaratkan oleh decorator `@Roles()`.

**(a) `hmti-backend/src/auth/jwt-auth.guard.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Ini menghubungkan dengan 'jwt' yang sudah kita setting di auth.module.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**(b) `hmti-backend/src/guards/roles.guard.ts`**

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Ambil Role yang diperbolehkan dari Stiker (Decorator)
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Kalau tidak ada aturan role, berarti boleh masuk siapa saja (public)
    if (!requiredRoles) {
      return true;
    }

    // 2. Ambil User dari Request (Token yang sudah di-verify oleh JwtStrategy)
    const { user } = context.switchToHttp().getRequest();

    // 3. Cek apakah Role user ada di daftar Role yang diperbolehkan
    return requiredRoles.some((role) => user.role === role);
  }
}
```

---

## Lampiran 4.7 — hmti-frontend/src/router/index.js

Konfigurasi perutean Vue Router beserta *navigation guard* `beforeEach` yang mengalihkan pengguna belum terautentikasi ke halaman login ketika mengakses rute bertanda `requiresAuth`.

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 1. Halaman Public (Landing Page)
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue') 
    },

    // 2. Halaman Login
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue') 
    },

    // 3. Area Admin (Management) - Membutuhkan Login
    {
      path: '/admin',
      name: 'admin-layout',
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'admin-home',
          component: () => import('../views/AdminHome.vue') // Tabel anggota yang kita buat
        },
        {
          path: 'members',
          name: 'admin-members',
          component: () => import('../views/Anggota.vue') // Tabel anggota yang kita buat
        },
        {
          path: 'finance',
          name: 'admin-finance',
          component: () => import('../views/FinanceView.vue')
        },
        {
          path: 'docs',
          name: 'admin-docs',
          component: () => import('../views/DocsView.vue')
        },
        {
          path: '/admin/showcase',
          name: 'ShowcaseHub',
          component: () => import('../views/ShowcaseHub.vue') // Sesuaikan path foldernya
        },
        {
          path: '/admin/profile',
          name: 'Profile',
          component: () => import('../views/Profile.vue') // Sesuaikan path foldernya
        }
      ]
    }
  ]
})

// Guard: Cek apakah route butuh login
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Kalau butuh login (meta.requiresAuth) tapi belum login -> tendang ke /login
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return next('/login')
  }

  next()
})

export default router
```

---

## Lampiran 4.8 — hmti-frontend/src/api/http.js

Instans axios terpusat beserta *request interceptor* yang secara otomatis menyisipkan token JWT dari `localStorage` ke dalam header `Authorization` pada setiap permintaan.

```javascript
import axios from 'axios'

// Base URL API: diambil dari VITE_API_BASE_URL saat build.
// Di produksi default ke '/api' (same-origin, diproksi Nginx ke backend)
// sehingga tidak perlu CORS dan port backend tidak perlu diekspos.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const http = axios.create({
  baseURL: API_BASE_URL,
})

// Lampirkan token JWT ke setiap request secara otomatis.
// Sumber kebenaran token = localStorage ('access_token', lihat stores/auth.js)
// agar endpoint terproteksi (mis. PATCH/DELETE /members) tidak balik 401.
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default http
```

---

## Lampiran 4.9 — hmti-backend/src/main.ts

Berkas *bootstrap* aplikasi NestJS yang mengonfigurasi `ValidationPipe` global untuk validasi DTO serta kebijakan CORS berbasis daftar origin yang diizinkan melalui variabel lingkungan.

```typescript
// Muat .env paling awal agar semua modul (JWT, CORS, dll.) membaca env yang sama
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

function getAllowedCorsOrigins() {
  const configuredOrigins = process.env.CORS_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

  if (configuredOrigins.length > 0) {
    return configuredOrigins;
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn('[WARN] CORS_ORIGINS is not configured; browser CORS requests will be rejected');
    return [];
  }

  return [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedCorsOrigins = getAllowedCorsOrigins();

  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedCorsOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Tolak tanpa melempar Error: respons tetap normal tanpa header CORS
      // (browser yang memblokir), bukan 500 yang menyamarkan penyebabnya.
      console.warn(`[CORS] Origin ditolak: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
  });

  // ... (kode selengkapnya pada repositori)

  await app.listen(process.env.PORT ?? 3000);
  console.log(`[OK] Server running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
```

---

## Lampiran 4.10 — hmti-backend/.env.example

Daftar nama variabel lingkungan yang wajib disediakan saat pemasangan sistem; seluruh nilainya sengaja dikosongkan dan tidak disertakan dalam repositori maupun dalam lampiran ini.

```dotenv
# Salin file ini menjadi .env lalu isi nilainya.
# Backend TIDAK akan start bila JWT_SECRET kosong.

# Koneksi database (Prisma). Contoh SQLite dev: file:./prisma/dev.db
DATABASE_URL=********

# Kunci JWT — WAJIB. Dipakai untuk sign DAN verify token.
# Produksi: gunakan string acak panjang (mis. hasil `openssl rand -hex 32`).
JWT_SECRET=********

# Google Drive Configuration
GOOGLE_DRIVE_CLIENT_ID=********
GOOGLE_DRIVE_CLIENT_SECRET=********
GOOGLE_DRIVE_REFRESH_TOKEN=********
GOOGLE_DRIVE_PARENT_FOLDER_ID=********
FOLDER_ID_SURAT=********
FOLDER_ID_MEDIA=********
FOLDER_ID_BRANDING=********
FOLDER_ID_AVATARS=********

# Produksi (opsional di dev)
# PORT=3000
# CORS_ORIGINS=https://domain-anda.com

# File ID E-hmti.apk di Google Drive (harus berbagi "anyone with the link")
EHMTI_APK_FILE_ID=********
```
