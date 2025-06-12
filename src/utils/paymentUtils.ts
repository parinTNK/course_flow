export function luhnCheck (num: string): boolean {
  let arr = (num + "").split("").reverse().map((x) => parseInt(x));
  let lastDigit = arr.shift()!;
  let sum = arr.reduce(
    (acc, val, i) =>
      i % 2 === 0 ? acc + ((val *= 2) > 9 ? val - 9 : val) : acc + val,
    0
  );
  return (sum + lastDigit) % 10 === 0;
};

export function formatCardNumber(value: string): string{
  const numbers = value.replace(/\D/g, "").slice(0, 19);
  return numbers.replace(/(.{4})/g, "$1 ").trim();
};

export function formatExpiry (value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 4);
  if (numbers.length < 3) return numbers;
  return numbers.slice(0, 2) + "/" + numbers.slice(2);
};

export function isExpiryValid (expiry: string): boolean{
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) return false;
  const [mm, yy] = expiry.split("/");
  const month = parseInt(mm, 10);
  const year = parseInt("20" + yy, 10);
  const now = new Date();
  const exp = new Date(year, month - 1, 1);
  return exp >= new Date(now.getFullYear(), now.getMonth(), 1);
};
