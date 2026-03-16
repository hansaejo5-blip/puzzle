import { RestorePoint } from "../types/game";

export const restorePoints: RestorePoint[] = [
  {
    id: "counter",
    chapter: 1,
    name: "카운터 교체",
    description: "낡은 주문대를 새 분위기로 바꿉니다.",
    starCost: 2,
    options: [
      { id: "oak", label: "오크 우드", palette: ["#d7b08e", "#f3dfca"], accent: "#8e5e3b" },
      { id: "peach", label: "피치 크림", palette: ["#f1c9bc", "#fff2e8"], accent: "#d98265" }
    ]
  },
  {
    id: "menu-board",
    chapter: 1,
    name: "메뉴판 설치",
    description: "카페 첫인상을 결정하는 보드입니다.",
    starCost: 2,
    options: [
      { id: "chalk", label: "초크 보드", palette: ["#565656", "#a8d0b4"], accent: "#1f1f1f" },
      { id: "gold-frame", label: "골드 프레임", palette: ["#e9d49a", "#fff8e2"], accent: "#ad8840" }
    ]
  },
  {
    id: "lights",
    chapter: 1,
    name: "조명 복구",
    description: "공간을 부드럽게 밝힙니다.",
    starCost: 3,
    options: [
      { id: "warm", label: "웜 라이트", palette: ["#f3d285", "#fff8d3"], accent: "#dea63f" },
      { id: "glass", label: "글래스 라이트", palette: ["#b8dff2", "#effbff"], accent: "#6c98b7" }
    ]
  },
  {
    id: "floor",
    chapter: 1,
    name: "바닥 청소",
    description: "첫 장면이 훨씬 깔끔해집니다.",
    starCost: 2,
    options: [
      { id: "tile", label: "파우더 타일", palette: ["#f0e5d7", "#fff8ef"], accent: "#b79e7c" },
      { id: "wood", label: "허니 우드", palette: ["#d9b487", "#f4e2cb"], accent: "#9b6a3f" }
    ]
  },
  {
    id: "chairs",
    chapter: 1,
    name: "의자 배치",
    description: "손님을 맞이할 좌석을 정돈합니다.",
    starCost: 3,
    options: [
      { id: "mint", label: "민트 체어", palette: ["#b8decb", "#effaf4"], accent: "#5f977d" },
      { id: "rose", label: "로즈 체어", palette: ["#f4c9c9", "#fff0f0"], accent: "#ce7979" }
    ]
  },
  {
    id: "window",
    chapter: 2,
    name: "창문 장식",
    description: "햇빛이 더 부드럽게 들어옵니다.",
    starCost: 3,
    options: [
      { id: "linen", label: "린넨 커튼", palette: ["#fff4e6", "#f6dcc0"], accent: "#c59c69" },
      { id: "green", label: "그린 셰이드", palette: ["#c7e4d0", "#f4fff6"], accent: "#669a74" }
    ]
  },
  {
    id: "art",
    chapter: 2,
    name: "벽 그림",
    description: "메인 홀 분위기를 완성합니다.",
    starCost: 3,
    options: [
      { id: "dessert", label: "디저트 포스터", palette: ["#f5d7b8", "#fff3e6"], accent: "#d28d52" },
      { id: "botanical", label: "보태니컬", palette: ["#cee6d1", "#f4fff6"], accent: "#6a9b70" }
    ]
  },
  {
    id: "hall-table",
    chapter: 2,
    name: "메인 테이블",
    description: "홀 중앙을 꾸밉니다.",
    starCost: 4,
    options: [
      { id: "round", label: "라운드 테이블", palette: ["#d9ba98", "#f2e4d0"], accent: "#896345" },
      { id: "marble", label: "마블 테이블", palette: ["#dbe7ef", "#ffffff"], accent: "#859db1" }
    ]
  },
  {
    id: "machine",
    chapter: 2,
    name: "커피 머신 존",
    description: "바리스타 동선을 정리합니다.",
    starCost: 4,
    options: [
      { id: "chrome", label: "실버 머신", palette: ["#dce6ee", "#ffffff"], accent: "#8a99a8" },
      { id: "retro", label: "레트로 머신", palette: ["#f1b48f", "#fff0e3"], accent: "#b96843" }
    ]
  },
  {
    id: "plants",
    chapter: 2,
    name: "식물 배치",
    description: "카페에 생기를 더합니다.",
    starCost: 3,
    options: [
      { id: "olive", label: "올리브 화분", palette: ["#c8ddba", "#eff7ea"], accent: "#6f8f57" },
      { id: "flower", label: "플라워 화분", palette: ["#f2c7d6", "#fff1f6"], accent: "#bf6f8f" }
    ]
  },
  {
    id: "showcase",
    chapter: 3,
    name: "디저트 쇼케이스",
    description: "시그니처 디저트를 전면에 배치합니다.",
    starCost: 4,
    options: [
      { id: "glass", label: "클린 글래스", palette: ["#d8edf7", "#ffffff"], accent: "#7fb2cc" },
      { id: "pink", label: "핑크 베이스", palette: ["#f6d0d9", "#fff6f9"], accent: "#c9768f" }
    ]
  },
  {
    id: "terrace-table",
    chapter: 3,
    name: "테라스 테이블",
    description: "야외 좌석에 포인트를 줍니다.",
    starCost: 4,
    options: [
      { id: "sunset", label: "선셋 우드", palette: ["#deb588", "#fff0d6"], accent: "#ac7247" },
      { id: "ivory", label: "아이보리", palette: ["#f3ece1", "#ffffff"], accent: "#bba58a" }
    ]
  },
  {
    id: "sign",
    chapter: 3,
    name: "간판 조명",
    description: "완성된 카페의 얼굴을 밝힙니다.",
    starCost: 4,
    options: [
      { id: "neon", label: "소프트 네온", palette: ["#ffd4b8", "#fff5eb"], accent: "#f08f59" },
      { id: "classic", label: "클래식 라이트", palette: ["#ffe7a8", "#fff9e6"], accent: "#c9992e" }
    ]
  },
  {
    id: "parasol",
    chapter: 3,
    name: "파라솔",
    description: "테라스 휴식 공간을 완성합니다.",
    starCost: 3,
    options: [
      { id: "mint", label: "민트 파라솔", palette: ["#c7e8d8", "#f2fff8"], accent: "#67a487" },
      { id: "berry", label: "베리 파라솔", palette: ["#f4ccd8", "#fff2f6"], accent: "#c7708b" }
    ]
  },
  {
    id: "outdoor",
    chapter: 3,
    name: "외부 장식",
    description: "마지막 환영 연출을 추가합니다.",
    starCost: 5,
    options: [
      { id: "lantern", label: "랜턴 가든", palette: ["#f3d29d", "#fff7e7"], accent: "#d09432" },
      { id: "bloom", label: "블룸 아치", palette: ["#f3cad5", "#fff3f7"], accent: "#ca7090" }
    ]
  }
];
