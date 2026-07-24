-- CreateTable
CREATE TABLE IF NOT EXISTS "tenant_rates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "value" DECIMAL(10,4) NOT NULL,
    "country_code" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tenant_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_rates_tenant_id_concept_country_code_key" 
ON "tenant_rates"("tenant_id", "concept", "country_code");

-- AddForeignKey
ALTER TABLE "tenant_rates" ADD CONSTRAINT "tenant_rates_tenant_id_fkey" 
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
