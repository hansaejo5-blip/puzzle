export function getKstDateParts(now = new Date()) {
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  });
  const parts = formatter.formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    weekday: value("weekday")
  };
}

export function getDailyKey(now = new Date()) {
  const { year, month, day } = getKstDateParts(now);
  return `${year}-${month}-${day}`;
}

export function getWeeklyKey(now = new Date()) {
  const { year, month, day } = getKstDateParts(now);
  const date = new Date(`${year}-${month}-${day}T00:00:00+09:00`);
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 1);
  return `${date.getUTCFullYear()}-W${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(
    date.getUTCDate()
  ).padStart(2, "0")}`;
}
