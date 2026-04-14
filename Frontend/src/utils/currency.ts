export const formatVnd = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));

export const FREE_SHIPPING_THRESHOLD_VND = 500_000;
export const STANDARD_SHIPPING_FEE_VND = 30_000;
export const EXPRESS_SHIPPING_FEE_VND = 60_000;
export const SERVICE_BOOKING_FEE_VND = 15_000;
