export const getBangkokISOString = (date: Date | string = new Date()): string => {
  const now = new Date(date);
  return (
    now
      .toLocaleString('sv', { timeZone: 'Asia/Bangkok', hour12: false })
      .replace(' ', 'T') + '+07:00'
  );
};
