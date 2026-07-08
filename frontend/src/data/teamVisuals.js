const flagModules = import.meta.glob("../assets/flags/*.svg", {
  eager: true,
  import: "default",
});

const DEFAULT_VISUAL = {
  accent: "#94A3B8",
  accentSoft: "rgba(148, 163, 184, 0.18)",
  glow: "rgba(148, 163, 184, 0.24)",
  surface: "linear-gradient(135deg, rgba(148, 163, 184, 0.22), rgba(255, 255, 255, 0.08))",
};

const TEAM_FLAG_META = {
  阿尔及利亚: { file: "algeria.svg", code: "ALG" },
  阿根廷: { file: "argentina.svg", code: "ARG", accent: "#7DD3FC", accentSoft: "rgba(125, 211, 252, 0.22)", glow: "rgba(56, 189, 248, 0.34)", surface: "linear-gradient(135deg, rgba(125, 211, 252, 0.24), rgba(255, 255, 255, 0.1))" },
  澳大利亚: { file: "australia.svg", code: "AUS" },
  奥地利: { file: "austria.svg", code: "AUT" },
  比利时: { file: "belgium.svg", code: "BEL" },
  波黑: { file: "bosnia-and-herzegovina.svg", code: "BIH" },
  波斯尼亚和黑塞哥维那: { file: "bosnia-and-herzegovina.svg", code: "BIH" },
  巴西: { file: "brazil.svg", code: "BRA", accent: "#F8D66D", accentSoft: "rgba(248, 214, 109, 0.22)", glow: "rgba(248, 214, 109, 0.32)", surface: "linear-gradient(135deg, rgba(248, 214, 109, 0.24), rgba(34, 197, 94, 0.12))" },
  加拿大: { file: "canada.svg", code: "CAN" },
  佛得角: { file: "cape-verde.svg", code: "CPV", accent: "#38BDF8", accentSoft: "rgba(56, 189, 248, 0.2)", glow: "rgba(56, 189, 248, 0.28)", surface: "linear-gradient(135deg, rgba(56, 189, 248, 0.24), rgba(248, 214, 109, 0.1))" },
  哥伦比亚: { file: "colombia.svg", code: "COL" },
  克罗地亚: { file: "croatia.svg", code: "CRO" },
  库拉索: { file: "curacao.svg", code: "CUW" },
  捷克: { file: "czech-republic.svg", code: "CZE" },
  刚果民主共和国: { file: "dr-congo.svg", code: "COD" },
  厄瓜多尔: { file: "ecuador.svg", code: "ECU" },
  埃及: { file: "egypt.svg", code: "EGY", accent: "#F8D66D", accentSoft: "rgba(248, 214, 109, 0.15)", glow: "rgba(248, 214, 109, 0.25)", surface: "linear-gradient(135deg, rgba(248, 214, 109, 0.2), rgba(15, 23, 42, 0.15))" },
  英格兰: { file: "england.svg", code: "ENG" },
  法国: { file: "france.svg", code: "FRA", accent: "#60A5FA", accentSoft: "rgba(96, 165, 250, 0.2)", glow: "rgba(96, 165, 250, 0.34)", surface: "linear-gradient(135deg, rgba(96, 165, 250, 0.24), rgba(239, 68, 68, 0.1))" },
  德国: { file: "germany.svg", code: "GER", accent: "#E5E7EB", accentSoft: "rgba(229, 231, 235, 0.18)", glow: "rgba(148, 163, 184, 0.28)", surface: "linear-gradient(135deg, rgba(229, 231, 235, 0.22), rgba(100, 116, 139, 0.14))" },
  加纳: { file: "ghana.svg", code: "GHA" },
  海地: { file: "haiti.svg", code: "HAI" },
  伊朗: { file: "iran.svg", code: "IRN" },
  伊拉克: { file: "iraq.svg", code: "IRQ" },
  科特迪瓦: { file: "ivory-coast.svg", code: "CIV" },
  日本: { file: "japan.svg", code: "JPN" },
  约旦: { file: "jordan.svg", code: "JOR" },
  墨西哥: { file: "mexico.svg", code: "MEX" },
  摩洛哥: { file: "morocco.svg", code: "MAR", accent: "#16A34A", accentSoft: "rgba(22, 163, 74, 0.15)", glow: "rgba(22, 163, 74, 0.25)", surface: "linear-gradient(135deg, rgba(22, 163, 74, 0.2), rgba(239, 68, 68, 0.1))" },
  荷兰: { file: "netherlands.svg", code: "NED" },
  新西兰: { file: "new-zealand.svg", code: "NZL" },
  挪威: { file: "norway.svg", code: "NOR", accent: "#EF4444", accentSoft: "rgba(239, 68, 68, 0.15)", glow: "rgba(239, 68, 68, 0.25)", surface: "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(56, 189, 248, 0.1))" },
  巴拿马: { file: "panama.svg", code: "PAN" },
  巴拉圭: { file: "paraguay.svg", code: "PAR" },
  葡萄牙: { file: "portugal.svg", code: "POR", accent: "#4ADE80", accentSoft: "rgba(74, 222, 128, 0.2)", glow: "rgba(34, 197, 94, 0.3)", surface: "linear-gradient(135deg, rgba(74, 222, 128, 0.24), rgba(239, 68, 68, 0.1))" },
  卡塔尔: { file: "qatar.svg", code: "QAT" },
  沙特阿拉伯: { file: "saudi-arabia.svg", code: "KSA" },
  苏格兰: { file: "scotland.svg", code: "SCO" },
  塞内加尔: { file: "senegal.svg", code: "SEN" },
  南非: { file: "south-africa.svg", code: "RSA" },
  韩国: { file: "south-korea.svg", code: "KOR" },
  西班牙: { file: "spain.svg", code: "ESP", accent: "#F97316", accentSoft: "rgba(249, 115, 22, 0.22)", glow: "rgba(239, 68, 68, 0.3)", surface: "linear-gradient(135deg, rgba(249, 115, 22, 0.24), rgba(239, 68, 68, 0.1))" },
  瑞典: { file: "sweden.svg", code: "SWE" },
  瑞士: { file: "switzerland.svg", code: "SUI" },
  突尼斯: { file: "tunisia.svg", code: "TUN" },
  土耳其: { file: "turkey.svg", code: "TUR" },
  美国: { file: "united-states.svg", code: "USA" },
  乌拉圭: { file: "uruguay.svg", code: "URU" },
  乌兹别克斯坦: { file: "uzbekistan.svg", code: "UZB" },
};

const TEAM_NAME_ALIASES = {
  "刚果（金）": "刚果民主共和国",
  象牙海岸: "科特迪瓦",
  南韩: "韩国",
  美利坚合众国: "美国",
};

function resolveFlagSrc(fileName) {
  return flagModules[`../assets/flags/${fileName}`] ?? null;
}

export const TEAM_VISUALS = Object.fromEntries(
  Object.entries(TEAM_FLAG_META).map(([teamName, meta]) => [
    teamName,
    {
      flagSrc: resolveFlagSrc(meta.file),
      code: meta.code,
      accent: meta.accent ?? DEFAULT_VISUAL.accent,
      accentSoft: meta.accentSoft ?? DEFAULT_VISUAL.accentSoft,
      glow: meta.glow ?? DEFAULT_VISUAL.glow,
      surface: meta.surface ?? DEFAULT_VISUAL.surface,
    },
  ])
);

export function getTeamVisual(teamName) {
  const normalizedName = TEAM_NAME_ALIASES[teamName] ?? teamName;

  return (
    TEAM_VISUALS[normalizedName] ?? {
      flagSrc: null,
      code: normalizedName === "待定" ? "TBD" : normalizedName.slice(0, 3).toUpperCase(),
      accent: DEFAULT_VISUAL.accent,
      accentSoft: DEFAULT_VISUAL.accentSoft,
      glow: DEFAULT_VISUAL.glow,
      surface: DEFAULT_VISUAL.surface,
    }
  );
}
