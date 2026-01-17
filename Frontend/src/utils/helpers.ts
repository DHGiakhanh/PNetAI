export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('vi-VN');
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};
