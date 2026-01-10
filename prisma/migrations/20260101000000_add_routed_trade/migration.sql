CREATE TABLE "RoutedTrade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "conditionId" TEXT,
    "outcome" TEXT NOT NULL,
    "outcomeTokenId" TEXT,
    "side" TEXT NOT NULL,
    "size" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "orderId" TEXT,
    "status" TEXT,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoutedTrade_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "RoutedTrade" ADD CONSTRAINT "RoutedTrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "RoutedTrade_userId_createdAt_idx" ON "RoutedTrade"("userId", "createdAt");
CREATE INDEX "RoutedTrade_marketId_idx" ON "RoutedTrade"("marketId");
