import argentinaFlag from "../assets/flags/argentina.svg";
import franceFlag from "../assets/flags/france.svg";
import brazilFlag from "../assets/flags/brazil.svg";
import spainFlag from "../assets/flags/spain.svg";
import germanyFlag from "../assets/flags/germany.svg";
import portugalFlag from "../assets/flags/portugal.svg";
import capeVerdeFlag from "../assets/flags/cape-verde.svg";

export const TEAM_VISUALS = {
  阿根廷: {
    flagSrc: argentinaFlag,
    code: "ARG",
    accent: "#7DD3FC",
    accentSoft: "rgba(125, 211, 252, 0.22)",
    glow: "rgba(56, 189, 248, 0.34)",
    surface: "linear-gradient(135deg, rgba(125, 211, 252, 0.24), rgba(255, 255, 255, 0.1))",
  },
  法国: {
    flagSrc: franceFlag,
    code: "FRA",
    accent: "#60A5FA",
    accentSoft: "rgba(96, 165, 250, 0.2)",
    glow: "rgba(96, 165, 250, 0.34)",
    surface: "linear-gradient(135deg, rgba(96, 165, 250, 0.24), rgba(239, 68, 68, 0.1))",
  },
  巴西: {
    flagSrc: brazilFlag,
    code: "BRA",
    accent: "#F8D66D",
    accentSoft: "rgba(248, 214, 109, 0.22)",
    glow: "rgba(248, 214, 109, 0.32)",
    surface: "linear-gradient(135deg, rgba(248, 214, 109, 0.24), rgba(34, 197, 94, 0.12))",
  },
  西班牙: {
    flagSrc: spainFlag,
    code: "ESP",
    accent: "#F97316",
    accentSoft: "rgba(249, 115, 22, 0.22)",
    glow: "rgba(239, 68, 68, 0.3)",
    surface: "linear-gradient(135deg, rgba(249, 115, 22, 0.24), rgba(239, 68, 68, 0.1))",
  },
  德国: {
    flagSrc: germanyFlag,
    code: "GER",
    accent: "#E5E7EB",
    accentSoft: "rgba(229, 231, 235, 0.18)",
    glow: "rgba(148, 163, 184, 0.28)",
    surface: "linear-gradient(135deg, rgba(229, 231, 235, 0.22), rgba(100, 116, 139, 0.14))",
  },
  葡萄牙: {
    flagSrc: portugalFlag,
    code: "POR",
    accent: "#4ADE80",
    accentSoft: "rgba(74, 222, 128, 0.2)",
    glow: "rgba(34, 197, 94, 0.3)",
    surface: "linear-gradient(135deg, rgba(74, 222, 128, 0.24), rgba(239, 68, 68, 0.1))",
  },
  佛得角: {
    flagSrc: capeVerdeFlag,
    code: "CPV",
    accent: "#38BDF8",
    accentSoft: "rgba(56, 189, 248, 0.2)",
    glow: "rgba(56, 189, 248, 0.28)",
    surface: "linear-gradient(135deg, rgba(56, 189, 248, 0.24), rgba(248, 214, 109, 0.1))",
  },
  挪威: {
    flagSrc: "🇳🇴",
    code: "NOR",
    accent: "#EF4444",
    accentSoft: "rgba(239, 68, 68, 0.15)",
    glow: "rgba(239, 68, 68, 0.25)",
    surface: "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(56, 189, 248, 0.1))",
  },
  埃及: {
    flagSrc: "🇪🇬",
    code: "EGY",
    accent: "#F8D66D",
    accentSoft: "rgba(248, 214, 109, 0.15)",
    glow: "rgba(248, 214, 109, 0.25)",
    surface: "linear-gradient(135deg, rgba(248, 214, 109, 0.2), rgba(15, 23, 42, 0.15))",
  },
  摩洛哥: {
    flagSrc: "🇲🇦",
    code: "MAR",
    accent: "#16A34A",
    accentSoft: "rgba(22, 163, 74, 0.15)",
    glow: "rgba(22, 163, 74, 0.25)",
    surface: "linear-gradient(135deg, rgba(22, 163, 74, 0.2), rgba(239, 68, 68, 0.1))",
  },
};

const TEAM_META_FALLBACK = {
  挪威: { flag: "🇳🇴", code: "NOR" },
  埃及: { flag: "🇪🇬", code: "EGY" },
  摩洛哥: { flag: "🇲🇦", code: "MAR" },
  海地: { flag: "🇭🇹", code: "HAI" },
  苏格兰: { flag: "🏴", code: "SCO" },
};

export function getTeamVisual(teamName) {
  const meta = TEAM_META_FALLBACK[teamName];
  return (
    TEAM_VISUALS[teamName] ?? {
      flagSrc: meta?.flag ?? "🏳️",
      code: meta?.code ?? teamName.slice(0, 3).toUpperCase(),
      accent: "#94A3B8",
      accentSoft: "rgba(148, 163, 184, 0.18)",
      glow: "rgba(148, 163, 184, 0.24)",
      surface: "linear-gradient(135deg, rgba(148, 163, 184, 0.22), rgba(255, 255, 255, 0.08))",
    }
  );
}
