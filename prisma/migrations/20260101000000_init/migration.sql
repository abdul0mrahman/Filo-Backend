CREATE TYPE "Role" AS ENUM ('CREATOR', 'BRAND', 'ADMIN');
CREATE TYPE "Platform" AS ENUM ('INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER', 'FACEBOOK', 'LINKEDIN', 'OTHER');

CREATE TABLE "User" (
  "id" SERIAL NOT NULL, "name" TEXT NOT NULL, "email" TEXT NOT NULL, "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'CREATOR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CreatorProfile" (
  "id" SERIAL NOT NULL, "userId" INTEGER NOT NULL, "displayName" TEXT NOT NULL, "bio" TEXT, "niche" TEXT,
  "location" TEXT, "avatarUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CreatorProfile_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BrandProfile" (
  "id" SERIAL NOT NULL, "userId" INTEGER NOT NULL, "companyName" TEXT NOT NULL, "industry" TEXT, "website" TEXT,
  "description" TEXT, "location" TEXT, "logoUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BrandProfile_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SocialAccount" (
  "id" SERIAL NOT NULL, "creatorId" INTEGER NOT NULL, "platform" "Platform" NOT NULL, "handle" TEXT NOT NULL,
  "profileUrl" TEXT, "followers" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "CreatorProfile_userId_key" ON "CreatorProfile"("userId");
CREATE UNIQUE INDEX "BrandProfile_userId_key" ON "BrandProfile"("userId");
CREATE UNIQUE INDEX "SocialAccount_creatorId_platform_handle_key" ON "SocialAccount"("creatorId", "platform", "handle");
ALTER TABLE "CreatorProfile" ADD CONSTRAINT "CreatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BrandProfile" ADD CONSTRAINT "BrandProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
