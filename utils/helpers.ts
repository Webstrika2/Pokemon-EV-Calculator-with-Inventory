
export const parseCurrency = (value: string): number => {
  const num = parseInt(value.replace(/,/g, ''), 10);
  return isNaN(num) || num < 0 ? 0 : num;
};

export const textToNumberMap: Record<string, number> = {
  "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
  "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19, "twenty": 20,
  "one hundred": 100, "two hundred": 200, "two fifty two": 252, "252": 252 // "252" as text key for robustness
};
