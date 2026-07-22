-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "role" TEXT NOT NULL DEFAULT 'CLIENTE',
    "planType" TEXT DEFAULT 'STANDARD',
    "noConsolidationFee" BOOLEAN NOT NULL DEFAULT false,
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
    "referralRewardPaid" BOOLEAN NOT NULL DEFAULT false,
    "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "shippingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "stripeCustomerId" TEXT,
    "tenant_id" TEXT,

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
    "serviceType" TEXT DEFAULT 'SHIPPING_INTL',
    "storagePaidUntil" TIMESTAMP(3),
    "storageDebt" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "courier" TEXT,
    "declaredValue" DOUBLE PRECISION DEFAULT 0.0,
    "selectedCourier" TEXT,
    "courierService" TEXT,
    "shippingAddress" TEXT,
    "shippingSubtotal" DOUBLE PRECISION DEFAULT 0.0,
    "shippingProcessingFee" DOUBLE PRECISION DEFAULT 0.0,
    "shippingTotalPaid" DOUBLE PRECISION DEFAULT 0.0,
    "stripePaymentId" TEXT,
    "customsItems" JSONB,
    "extraCharges" JSONB,
    "weightLbs" DOUBLE PRECISION,
    "lengthIn" DOUBLE PRECISION,
    "widthIn" DOUBLE PRECISION,
    "heightIn" DOUBLE PRECISION,
    "photoUrlMiami" TEXT,
    "receiptUrl" TEXT,
    "invoiceUrl" TEXT,
    "shippingLabelUrl" TEXT,
    "awbDocumentUrl" TEXT,
    "deliveryPhotoUrl" TEXT,
    "deliverySignature" TEXT,
    "deliveredBy" TEXT,
    "tookanLink" TEXT,
    "carrierTrackingNumber" TEXT,
    "gmcTrackingNumber" TEXT NOT NULL,
    "finalTrackingNumber" TEXT,
    "estimatedArrival" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "consolidatedShipmentId" TEXT,
    "tenant_id" TEXT,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsolidatedShipment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gmcShipmentNumber" TEXT NOT NULL,
    "destinationCountryCode" TEXT,
    "shippingAddress" TEXT,
    "status" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL DEFAULT 'CONSOLIDATION',
    "storagePaidUntil" TIMESTAMP(3),
    "selectedCourier" TEXT,
    "courierService" TEXT,
    "finalTrackingNumber" TEXT,
    "shippingLabelUrl" TEXT,
    "awbDocumentUrl" TEXT,
    "deliveredBy" TEXT,
    "paymentId" TEXT,
    "weightLbs" DOUBLE PRECISION,
    "declaredValue" DOUBLE PRECISION DEFAULT 0.0,
    "customsItems" JSONB,
    "extraCharges" JSONB,
    "auraDetails" JSONB,
    "subtotalAmount" DOUBLE PRECISION DEFAULT 0.0,
    "processingFee" DOUBLE PRECISION DEFAULT 0.0,
    "totalAmount" DOUBLE PRECISION,
    "widthIn" DOUBLE PRECISION,
    "heightIn" DOUBLE PRECISION,
    "lengthIn" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,
    "tenant_id" TEXT,

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
    "signatureUrl" TEXT,
    "tookanLink" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "driverId" TEXT,
    "userId" TEXT NOT NULL,
    "tenant_id" TEXT,

    CONSTRAINT "PickupRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "href" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "userId" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fullName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "cityZip" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" TEXT,
    "phone" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailboxSubscription" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "planType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_USPS',
    "uspsForm1583Url" TEXT,
    "primaryIdUrl" TEXT,
    "secondaryIdUrl" TEXT,
    "rejectionReason" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "stripeSubscriptionId" TEXT,
    "userId" TEXT NOT NULL,
    "tenant_id" TEXT,

    CONSTRAINT "MailboxSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdditionalRecipient" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "uspsForm1583Url" TEXT,
    "primaryIdUrl" TEXT,
    "secondaryIdUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_USPS',
    "rejectionReason" TEXT,
    "subscriptionId" TEXT NOT NULL,

    CONSTRAINT "AdditionalRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trackingNumber" TEXT,
    "senderName" TEXT,
    "weightOz" DOUBLE PRECISION,
    "lengthIn" DOUBLE PRECISION,
    "widthIn" DOUBLE PRECISION,
    "heightIn" DOUBLE PRECISION,
    "isDamaged" BOOLEAN NOT NULL DEFAULT false,
    "envelopeImageUrl" TEXT NOT NULL,
    "scannedDocUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNREAD',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "cargoPackageId" TEXT,
    "tenant_id" TEXT,

    CONSTRAINT "MailItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailboxTransaction" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "stripePaymentId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "MailboxTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopperOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_QUOTE',
    "serviceType" TEXT NOT NULL DEFAULT 'PERSONAL_SHOPPER',
    "itemsSubtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usTaxes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "domesticShipping" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gmcShopperFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stripeFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stripePaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenant_id" TEXT,

    CONSTRAINT "ShopperOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopperItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "storeName" TEXT,
    "productUrl" TEXT NOT NULL,
    "name" TEXT,
    "details" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "declaredPrice" DOUBLE PRECISION NOT NULL,
    "actualPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopperItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailPickupRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "tenant_id" TEXT,

    CONSTRAINT "MailPickupRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmazonProduct" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "affiliateUrl" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmazonProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "custom_domain" TEXT,
    "logo_url" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#000000',
    "secondary_color" TEXT NOT NULL DEFAULT '#ffffff',
    "owner_name" TEXT,
    "owner_email" TEXT NOT NULL,
    "owner_phone" TEXT,
    "easypost_api_key" TEXT,
    "stripe_publishable_key" TEXT,
    "stripe_secret_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "tenant_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "status" TEXT NOT NULL DEFAULT 'trial',
    "setup_paid" BOOLEAN NOT NULL DEFAULT false,
    "billing_start" DATE,
    "next_billing" DATE,
    "monthly_price" INTEGER NOT NULL DEFAULT 14900,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MailItemToMailPickupRequest" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

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
CREATE INDEX "Package_gmcTrackingNumber_idx" ON "Package"("gmcTrackingNumber");

-- CreateIndex
CREATE INDEX "Package_userId_idx" ON "Package"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsolidatedShipment_gmcShipmentNumber_key" ON "ConsolidatedShipment"("gmcShipmentNumber");

-- CreateIndex
CREATE INDEX "ConsolidatedShipment_gmcShipmentNumber_idx" ON "ConsolidatedShipment"("gmcShipmentNumber");

-- CreateIndex
CREATE INDEX "ConsolidatedShipment_userId_idx" ON "ConsolidatedShipment"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "Address"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MailboxSubscription_stripeSubscriptionId_key" ON "MailboxSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "MailboxSubscription_userId_key" ON "MailboxSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MailItem_trackingNumber_key" ON "MailItem"("trackingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MailItem_cargoPackageId_key" ON "MailItem"("cargoPackageId");

-- CreateIndex
CREATE INDEX "ShopperOrder_userId_idx" ON "ShopperOrder"("userId");

-- CreateIndex
CREATE INDEX "ShopperItem_orderId_idx" ON "ShopperItem"("orderId");

-- CreateIndex
CREATE INDEX "AmazonProduct_category_idx" ON "AmazonProduct"("category");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_custom_domain_key" ON "tenants"("custom_domain");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_owner_email_key" ON "tenants"("owner_email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_plans_tenant_id_key" ON "tenant_plans"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "_MailItemToMailPickupRequest_AB_unique" ON "_MailItemToMailPickupRequest"("A", "B");

-- CreateIndex
CREATE INDEX "_MailItemToMailPickupRequest_B_index" ON "_MailItemToMailPickupRequest"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_consolidatedShipmentId_fkey" FOREIGN KEY ("consolidatedShipmentId") REFERENCES "ConsolidatedShipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsolidatedShipment" ADD CONSTRAINT "ConsolidatedShipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsolidatedShipment" ADD CONSTRAINT "ConsolidatedShipment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupRequest" ADD CONSTRAINT "PickupRequest_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupRequest" ADD CONSTRAINT "PickupRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupRequest" ADD CONSTRAINT "PickupRequest_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailboxSubscription" ADD CONSTRAINT "MailboxSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailboxSubscription" ADD CONSTRAINT "MailboxSubscription_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdditionalRecipient" ADD CONSTRAINT "AdditionalRecipient_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "MailboxSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailItem" ADD CONSTRAINT "MailItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailItem" ADD CONSTRAINT "MailItem_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailboxTransaction" ADD CONSTRAINT "MailboxTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopperOrder" ADD CONSTRAINT "ShopperOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopperOrder" ADD CONSTRAINT "ShopperOrder_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopperItem" ADD CONSTRAINT "ShopperItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShopperOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailPickupRequest" ADD CONSTRAINT "MailPickupRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailPickupRequest" ADD CONSTRAINT "MailPickupRequest_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_plans" ADD CONSTRAINT "tenant_plans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MailItemToMailPickupRequest" ADD CONSTRAINT "_MailItemToMailPickupRequest_A_fkey" FOREIGN KEY ("A") REFERENCES "MailItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MailItemToMailPickupRequest" ADD CONSTRAINT "_MailItemToMailPickupRequest_B_fkey" FOREIGN KEY ("B") REFERENCES "MailPickupRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

