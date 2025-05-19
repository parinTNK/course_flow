export const getBangkokISOString = (): string => {
  const now = new Date()
  return now
    .toLocaleString('sv', { timeZone: 'Asia/Bangkok', hour12: false })
    .replace(' ', 'T') + '+07:00'
}