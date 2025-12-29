-- CreateTable
CREATE TABLE "TrackedMarket" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "trackedOutcome" TEXT NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "appearedAt" TIMESTAMP(3) NOT NULL,
    "marketUrl" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3),
    "resolvedOutcome" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackedMarket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoryEntry" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "trackedOutcome" TEXT NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "resolvedOutcome" TEXT NOT NULL,
    "appearedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "marketUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HistoryEntry_resolvedAt_idx" ON "HistoryEntry"("resolvedAt");

-- CreateIndex
CREATE INDEX "HistoryEntry_marketId_idx" ON "HistoryEntry"("marketId");

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Bookmark_marketId_idx" ON "Bookmark"("marketId");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_marketId_key" ON "Bookmark"("userId", "marketId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

