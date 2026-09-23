-- CreateEnum
CREATE TYPE "ApplianceSource" AS ENUM ('PHOTO_LABEL', 'MODEL_NAME', 'MANUAL');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('RED', 'ORANGE', 'YELLOW', 'GREEN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "totalKwh" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "tariffRate" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "ocrRawData" JSONB,
    "calibrationCoef" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appliance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "category" TEXT,
    "ratedPowerWatts" DOUBLE PRECISION NOT NULL,
    "source" "ApplianceSource" NOT NULL DEFAULT 'MANUAL',
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplianceEstimate" (
    "id" TEXT NOT NULL,
    "applianceId" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "hoursPerDay" DOUBLE PRECISION NOT NULL,
    "dutyCycle" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "rawEstimateKwh" DOUBLE PRECISION NOT NULL,
    "calibratedKwh" DOUBLE PRECISION,
    "priority" "Priority" NOT NULL DEFAULT 'YELLOW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplianceEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Receipt_userId_idx" ON "Receipt"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_userId_periodMonth_periodYear_key" ON "Receipt"("userId", "periodMonth", "periodYear");

-- CreateIndex
CREATE INDEX "Appliance_userId_idx" ON "Appliance"("userId");

-- CreateIndex
CREATE INDEX "ApplianceEstimate_receiptId_idx" ON "ApplianceEstimate"("receiptId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplianceEstimate_applianceId_receiptId_key" ON "ApplianceEstimate"("applianceId", "receiptId");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appliance" ADD CONSTRAINT "Appliance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplianceEstimate" ADD CONSTRAINT "ApplianceEstimate_applianceId_fkey" FOREIGN KEY ("applianceId") REFERENCES "Appliance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplianceEstimate" ADD CONSTRAINT "ApplianceEstimate_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
