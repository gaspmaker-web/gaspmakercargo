-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CLIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "countryCode" TEXT,
    "suiteNo" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "cityZip" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "referralCode" TEXT,
    "referredBy" TEXT,
    "shippingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "stripeCustomerId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripePaymentMethodId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "expMonth" INTEGER NOT NULL,
    "expYear" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isBackup" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT,
    "storagePaidUntil" TIMESTAMP(3),
    "storageDebt" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "courier" TEXT,
    "declaredValue" DOUBLE PRECISION DEFAULT 0.0,
    "weightLbs" DOUBLE PRECISION,
    "lengthIn" DOUBLE PRECISION,
    "widthIn" DOUBLE PRECISION,
    "heightIn" DOUBLE PRECISION,
    "photoUrlMiami" TEXT,
    "receiptUrl" TEXT,
    "invoiceUrl" TEXT,
    "carrierTrackingNumber" TEXT,
    "gmcTrackingNumber" TEXT NOT NULL,
    "estimatedArrival" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "consolidatedShipmentId" TEXT,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsolidatedShipment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gmcShipmentNumber" TEXT NOT NULL,
    "destinationCountryCode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "storagePaidUntil" TIMESTAMP(3),
    "selectedCourier" TEXT,
    "courierService" TEXT,
    "finalTrackingNumber" TEXT,
    "shippingLabelUrl" TEXT,
    "paymentId" TEXT,
    "weightLbs" DOUBLE PRECISION,
    "subtotalAmount" DOUBLE PRECISION DEFAULT 0.0,
    "processingFee" DOUBLE PRECISION DEFAULT 0.0,
    "totalAmount" DOUBLE PRECISION,
    "widthIn" DOUBLE PRECISION,
    "heightIn" DOUBLE PRECISION,
    "lengthIn" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ConsolidatedShipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serviceType" TEXT NOT NULL DEFAULT 'SHIPPING',
    "originAddress" TEXT NOT NULL,
    "originCity" TEXT NOT NULL,
    "pickupDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "dropOffAddress" TEXT,
    "dropOffCity" TEXT,
    "dropOffContact" TEXT,
    "dropOffPhone" TEXT,
    "subtotal" DOUBLE PRECISION DEFAULT 0.0,
    "processingFee" DOUBLE PRECISION DEFAULT 0.0,
    "totalPaid" DOUBLE PRECISION DEFAULT 0.0,
    "stripePaymentId" TEXT,
    "weightInfo" TEXT,
    "volumeInfo" TEXT,
    "photoPickupUrl" TEXT,
    "photoDeliveryUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "userId" TEXT NOT NULL,

    CONSTRAINT "PickupRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_suiteNo_key" ON "User"("suiteNo");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_stripePaymentMethodId_key" ON "PaymentMethod"("stripePaymentMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "Package_gmcTrackingNumber_key" ON "Package"("gmcTrackingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ConsolidatedShipment_gmcShipmentNumber_key" ON "ConsolidatedShipment"("gmcShipmentNumber");

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_consolidatedShipmentId_fkey" FOREIGN KEY ("consolidatedShipmentId") REFERENCES "ConsolidatedShipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsolidatedShipment" ADD CONSTRAINT "ConsolidatedShipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupRequest" ADD CONSTRAINT "PickupRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
