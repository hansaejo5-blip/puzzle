import { ItemType } from "../types/game";

export const itemCatalog: Record<
  ItemType,
  { label: string; short: string; color: string; accent: string; english: string }
> = {
  coffee: { label: "커피", short: "CO", color: "#c28d64", accent: "#6f4e37", english: "Coffee" },
  donut: { label: "도넛", short: "DO", color: "#f6b8b8", accent: "#d66b7f", english: "Donut" },
  croissant: { label: "크루아상", short: "CR", color: "#f3c071", accent: "#c58a29", english: "Croissant" },
  cake: { label: "케이크", short: "CA", color: "#f2a7be", accent: "#c05b8b", english: "Cake" },
  macaron: { label: "마카롱", short: "MA", color: "#a9d8c0", accent: "#5b9a7c", english: "Macaron" },
  sandwich: { label: "샌드", short: "SA", color: "#d4c38a", accent: "#8f7b39", english: "Sandwich" },
  cookie: { label: "쿠키", short: "CK", color: "#d7a15f", accent: "#8e5f2d", english: "Cookie" },
  berry: { label: "딸기", short: "BE", color: "#ee8aa0", accent: "#bb4066", english: "Berry Drink" },
  waffle: { label: "와플", short: "WA", color: "#efc57b", accent: "#9f6d2b", english: "Waffle" },
  icecream: { label: "아이스", short: "IC", color: "#a6d4f2", accent: "#5a93ba", english: "Ice Cream" }
};
