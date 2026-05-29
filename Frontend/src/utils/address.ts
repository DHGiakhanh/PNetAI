type UserAddressSource = {
  address?: string;
  location?: {
    addressName?: string;
  };
};

/** Hiển thị quận/huyện và tỉnh/thành — không hiện số nhà hay đường. */
export function formatUserDistrictProvince(user?: UserAddressSource): string {
  const raw = user?.location?.addressName?.trim() || user?.address?.trim();
  if (!raw) return "Chưa cập nhật địa chỉ";

  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return parts.slice(-2).join(", ");
  }

  return parts[0] || raw;
}
