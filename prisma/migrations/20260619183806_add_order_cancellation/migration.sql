-- AlterTable
ALTER TABLE "public"."order_items" ADD COLUMN     "selected_size" VARCHAR(10);

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "cancelled_at" TIMESTAMP(6),
ADD COLUMN     "cancelled_by" VARCHAR(20);
