-- CreateTable
CREATE TABLE "Fmt2026Prize" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "remaining" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'common',
    "imagePath" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fmt2026Prize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fmt2026Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "totalSpins" INTEGER NOT NULL DEFAULT 50,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "pinHash" TEXT,
    "pinVersion" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fmt2026Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fmt2026Draw" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prizeId" TEXT,
    "prizeName" TEXT NOT NULL,
    "voidedAt" TIMESTAMP(3),

    CONSTRAINT "Fmt2026Draw_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Fmt2026Prize_slug_key" ON "Fmt2026Prize"("slug");

-- CreateIndex
CREATE INDEX "Fmt2026Draw_createdAt_idx" ON "Fmt2026Draw"("createdAt");

-- CreateIndex
CREATE INDEX "Fmt2026Draw_voidedAt_idx" ON "Fmt2026Draw"("voidedAt");

-- AddForeignKey
ALTER TABLE "Fmt2026Draw" ADD CONSTRAINT "Fmt2026Draw_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "Fmt2026Prize"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Starting stock for the booth. Admins change it in /admin/fmt2026; the draw
-- stays closed and PIN-less until they open it.
INSERT INTO "Fmt2026Settings" ("id", "totalSpins", "isOpen", "pinVersion", "updatedAt")
VALUES (1, 50, false, 0, CURRENT_TIMESTAMP);

INSERT INTO "Fmt2026Prize" ("id", "slug", "name", "remaining", "tier", "imagePath", "sortOrder", "updatedAt") VALUES
    ('fmt2026-binh-nuoc', 'binh-nuoc', 'Bình nước FMT', 6, 'rare', '/fmt2026/prizes/binh-nuoc.svg', 1, CURRENT_TIMESTAMP),
    ('fmt2026-hoodie-zip', 'hoodie-zip', 'Áo hoodie zip FMT', 5, 'epic', '/fmt2026/prizes/hoodie-zip.svg', 2, CURRENT_TIMESTAMP),
    ('fmt2026-ao-do', 'ao-do', 'Áo FMT đỏ', 20, 'common', '/fmt2026/prizes/ao-do.svg', 3, CURRENT_TIMESTAMP),
    ('fmt2026-ao-vang', 'ao-vang', 'Áo FMT vàng', 4, 'epic', '/fmt2026/prizes/ao-vang.svg', 4, CURRENT_TIMESTAMP),
    ('fmt2026-so', 'so', 'Sổ FMT', 20, 'common', '/fmt2026/prizes/so.svg', 5, CURRENT_TIMESTAMP),
    ('fmt2026-tui', 'tui', 'Túi FMT', 7, 'rare', '/fmt2026/prizes/tui.svg', 6, CURRENT_TIMESTAMP);
