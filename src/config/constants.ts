export interface ProductOwner {
  name: string;
  logo: string;
}

export const PRODUCT_OWNERS: ProductOwner[] = [
  {
    name: "default-owner",
    logo: "/favicon.png",
  },
];

export const DATAMATRIX_LABEL_HEIGHT_CM: number = 4.2;
export const DATAMATRIX_LABEL_WIDTH_CM: number = 9;
