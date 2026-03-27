-- AlterTable
ALTER TABLE "SearchHistory" ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'us',
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD';

-- CreateIndex
CREATE INDEX "SearchHistory_query_country_idx" ON "SearchHistory"("query", "country");
