import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import { Printer } from "lucide-react";
import bwipjs from "bwip-js";
import { EntityType, ProductOwner } from "../../types";
import {
  DATAMATRIX_LABEL_HEIGHT_CM,
  DATAMATRIX_LABEL_WIDTH_CM,
} from "@/config/constants";

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: "bold",
    },
  ],
});

export interface PDFLabelItem {
  id: string;
  type: EntityType;
  title: string;
  code: string;
  owner?: ProductOwner | null;
  cabinetCode?: string | null;
  compartmentCode?: string | null;
  sku?: string | null;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    flexDirection: "row",
    flexWrap: "wrap",
    padding: "10mm",
    backgroundColor: "#ffffff",
  },
  labelCard: {
    width: DATAMATRIX_LABEL_WIDTH_CM + "cm",
    height: DATAMATRIX_LABEL_HEIGHT_CM + "cm",
    border: "1pt solid #18181b",
    borderRadius: 8,
    marginRight: "5mm",
    marginBottom: "5mm",
    padding: "2.5mm",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftColumn: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
  rightColumn: {
    width: "24mm",
    borderLeft: "1pt dashed #e4e4e7",
    paddingLeft: "2.5mm",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  labelKey: {
    fontSize: 8,
    color: "#71717a",
    width: 35,
  },
  labelValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#18181b",
    border: "1pt solid #e4e4e7",
    borderRadius: 2,
    padding: "1px 2px",
    backgroundColor: "#fafafa",
  },
  barcodeImg: {
    width: 60,
    height: 60,
    marginBottom: 4,
  },
  barcodeText: {
    fontSize: 6,
    fontFamily: "Courier",
    textAlign: "center",
  },
  badge: {
    backgroundColor: "#18181b",
    color: "#ffffff",
    fontSize: 7,
    padding: "1px 3px",
    borderRadius: 2,
    marginBottom: 4,
    textTransform: "uppercase",
  },
});

const getBarcodeDataURL = (text: string) => {
  try {
    const canvas = document.createElement("canvas");
    bwipjs.toCanvas(canvas, {
      bcid: "datamatrix",
      text,
      scale: 3,
      height: 10,
      width: 10,
      includetext: false,
      textxalign: "center",
      backgroundcolor: "ffffff",
    });
    return canvas.toDataURL("image/png");
  } catch (err) {
    return "";
  }
};

export const DataMatrixLabelPDF = ({ items }: { items: PDFLabelItem[] }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {items.map((item) => {
          const barcodeDataURL = getBarcodeDataURL(item.code);
          const typeLabelText =
            item.type === "product"
              ? "Ürün"
              : item.type === "cabinet"
                ? "Dolap"
                : "Raf";

          return (
            <View key={item.id} style={styles.labelCard} wrap={false}>
              <View style={styles.leftColumn}>
                <Text style={styles.title}>{item.title}</Text>

                {item.type === "product" && (
                  <>
                    {item.sku && (
                      <View style={styles.row}>
                        <Text style={styles.labelKey}>SKU:</Text>
                        <Text style={styles.labelValue}>{item.sku}</Text>
                      </View>
                    )}
                    {item.owner && (
                      <View style={styles.row}>
                        <Text style={styles.labelKey}>Sahip:</Text>
                        <Text style={styles.labelValue}>{item.owner.name}</Text>
                      </View>
                    )}
                    {item.cabinetCode && (
                      <View style={styles.row}>
                        <Text style={styles.labelKey}>Dolap:</Text>
                        <Text style={styles.labelValue}>
                          {item.cabinetCode}
                        </Text>
                      </View>
                    )}
                    {item.compartmentCode && (
                      <View style={styles.row}>
                        <Text style={styles.labelKey}>Raf:</Text>
                        <Text style={styles.labelValue}>
                          {item.compartmentCode}
                        </Text>
                      </View>
                    )}
                  </>
                )}

                {item.type === "compartment" && item.cabinetCode && (
                  <View style={styles.row}>
                    <Text style={styles.labelKey}>Dolap:</Text>
                    <Text style={styles.labelValue}>{item.cabinetCode}</Text>
                  </View>
                )}
              </View>

              <View style={styles.rightColumn}>
                {item.type === "product" && item.owner?.logo ? (
                  <Image
                    src={item.owner.logo}
                    style={{ width: 25, height: 25, marginBottom: 4 }}
                  />
                ) : (
                  <Text style={styles.badge}>{typeLabelText}</Text>
                )}
                {barcodeDataURL ? (
                  <Image src={barcodeDataURL} style={styles.barcodeImg} />
                ) : null}
                <Text style={styles.barcodeText}>{item.code}</Text>
              </View>
            </View>
          );
        })}
      </Page>
    </Document>
  );
};

interface Props {
  items: PDFLabelItem[];
  selectedCount: number;
}

export default function PDFDownloadButton({ items, selectedCount }: Props) {
  return (
    <PDFDownloadLink
      document={<DataMatrixLabelPDF items={items} />}
      fileName="etiketler.pdf"
      className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-40"
    >
      {({ loading }) => (
        <>
          {loading ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Printer className="h-3.5 w-3.5" />
          )}
          <span>
            {loading ? "Hazırlanıyor..." : `PDF İndir (${selectedCount})`}
          </span>
        </>
      )}
    </PDFDownloadLink>
  );
}
