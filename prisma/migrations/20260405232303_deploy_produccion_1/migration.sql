/*
  Warnings:

  - You are about to drop the column `password_hash` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[resetToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ConsolidatedShipment" DROP CONSTRAINT "ConsolidatedShipment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Package" DROP CONSTRAINT "Package_userId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentMethod" DROP CONSTRAINT "PaymentMethod_userId_fkey";

-- DropForeignKey
ALTER TABLE "PickupRequest" DROP CONSTRAINT "PickupRequest_userId_fkey";

-- AlterTable
ALTER TABLE "ConsolidatedShipment" ADD COLUMN     "customsItems" JSONB,
ADD COLUMN     "declaredValue" DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN     "deliveredBy" TEXT,
ADD COLUMN     "serviceType" TEXT NOT NULL DEFAULT 'CONSOLIDATION',
ADD COLUMN     "shippingAddress" TEXT,
ALTER COLUMN "destinationCountryCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "courierService" TEXT,
ADD COLUMN     "customsItems" JSONB,
ADD COLUMN     "deliveredBy" TEXT,
ADD COLUMN     "deliveryPhotoUrl" TEXT,
ADD COLUMN     "deliverySignature" TEXT,
ADD COLUMN     "finalTrackingNumber" TEXT,
ADD COLUMN     "selectedCourier" TEXT,
ADD COLUMN     "shippingAddress" TEXT,
ADD COLUMN     "shippingLabelUrl" TEXT,
ADD COLUMN     "shippingProcessingFee" DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN     "shippingSubtotal" DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN     "shippingTotalPaid" DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN     "stripePaymentId" TEXT,
ADD COLUMN     "tookanLink" TEXT;

-- AlterTable
ALTER TABLE "PickupRequest" ADD COLUMN     "driverId" TEXT,
ADD COLUMN     "signatureUrl" TEXT,
ADD COLUMN     "tookanLink" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password_hash",
ADD COLUMN     "image" TEXT,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "referralRewardPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

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
    "itemsSubtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usTaxes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "domesticShipping" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gmcShopperFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stripeFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stripePaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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

    CONSTRAINT "MailPickupRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MailItemToMailPickupRequest" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

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
CREATE UNIQUE INDEX "_MailItemToMailPickupRequest_AB_unique" ON "_MailItemToMailPickupRequest"("A", "B");

-- CreateIndex
CREATE INDEX "_MailItemToMailPickupRequest_B_index" ON "_MailItemToMailPickupRequest"("B");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsolidatedShipment" ADD CONSTRAINT "ConsolidatedShipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupRequest" ADD CONSTRAINT "PickupRequest_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupRequest" ADD CONSTRAINT "PickupRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailboxSubscription" ADD CONSTRAINT "MailboxSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdditionalRecipient" ADD CONSTRAINT "AdditionalRecipient_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "MailboxSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailItem" ADD CONSTRAINT "MailItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailboxTransaction" ADD CONSTRAINT "MailboxTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopperOrder" ADD CONSTRAINT "ShopperOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopperItem" ADD CONSTRAINT "ShopperItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShopperOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailPickupRequest" ADD CONSTRAINT "MailPickupRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MailItemToMailPickupRequest" ADD CONSTRAINT "_MailItemToMailPickupRequest_A_fkey" FOREIGN KEY ("A") REFERENCES "MailItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MailItemToMailPickupRequest" ADD CONSTRAINT "_MailItemToMailPickupRequest_B_fkey" FOREIGN KEY ("B") REFERENCES "MailPickupRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
