export const PRODUCT_OWNERS = ["default-owner"] as const;
export type ProductOwner = (typeof PRODUCT_OWNERS)[number];
