
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Formats a date key like "2023-01" into "January/2023".
 * @param {string} key - The date key to format.
 * @returns {string} The formatted date string.
 */
export function formatMonthKey(key: string) {
  const [year, month] = key.split("-");
  const monthIndex = parseInt(month, 10) - 1;
  return `${monthNames[monthIndex]}/${year}`;
}