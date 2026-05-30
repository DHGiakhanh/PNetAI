import {
  EXPRESS_SHIPPING_FEE_VND,
  FREE_SHIPPING_THRESHOLD_VND,
  STANDARD_SHIPPING_FEE_VND,
} from "./currency";

export type ShippingMethod = "standard" | "express";

export interface ShippingLineItem {
  price: number;
  qty: number;
  providerId: string | null;
}

export const resolveProviderId = (input: any): string | null => {
  if (!input) return null;

  let val = input;
  if (typeof input === "object" && "providerId" in input) {
    val = input.providerId;
  }

  if (!val) return null;

  if (typeof val === "string") {
    return val.trim();
  }

  if (typeof val === "object") {
    if (val._id) {
      return typeof val._id === "string" ? val._id.trim() : val._id.toString().trim();
    }
    if (typeof val.toString === "function") {
      const str = val.toString();
      if (str !== "[object Object]") {
        return str.trim();
      }
    }
  }

  return String(val).trim();
};

export const calculateItemLineTotal = (price: number, qty: number): number =>
  Math.round(price) * qty;

export const calculateShippingFeeForGroup = (
  subtotal: number,
  shippingMethod: ShippingMethod
): number => {
  const roundedSubtotal = Math.round(subtotal);

  if (shippingMethod === "express") {
    return EXPRESS_SHIPPING_FEE_VND;
  }

  return roundedSubtotal >= FREE_SHIPPING_THRESHOLD_VND
    ? 0
    : STANDARD_SHIPPING_FEE_VND;
};

export const getProviderSubtotals = (items: ShippingLineItem[]): number[] => {
  const providerMap = new Map<string, number>();

  for (const item of items) {
    if (!item.providerId) continue;

    const lineTotal = calculateItemLineTotal(item.price, item.qty);
    providerMap.set(
      item.providerId,
      (providerMap.get(item.providerId) || 0) + lineTotal
    );
  }

  return Array.from(providerMap.values()).map((subtotal) => Math.round(subtotal));
};

export const calculateTotalShippingFee = (
  items: ShippingLineItem[],
  shippingMethod: ShippingMethod
): number =>
  getProviderSubtotals(items).reduce(
    (sum, subtotal) => sum + calculateShippingFeeForGroup(subtotal, shippingMethod),
    0
  );

export const hasFreeStandardShipping = (items: ShippingLineItem[]): boolean =>
  getProviderSubtotals(items).every(
    (subtotal) => subtotal >= FREE_SHIPPING_THRESHOLD_VND
  );
