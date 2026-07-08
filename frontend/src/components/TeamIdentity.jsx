import { getTeamVisual } from "../data/teamVisuals";

function TeamIdentity({ teamName, align = "left", compact = false }) {
  const visual = getTeamVisual(teamName);
  const style = {
    "--team-accent": visual.accent,
    "--team-accent-soft": visual.accentSoft,
    "--team-surface": visual.surface,
    "--team-glow": visual.glow,
  };

  return (
    <div
      className={`team-identity team-identity-${align} ${compact ? "is-compact" : ""}`}
      style={style}
    >
      <span className="team-crest" aria-hidden="true">
        {visual.flagSrc.startsWith("data:") || visual.flagSrc.startsWith("/") || visual.flagSrc.startsWith(".") ? (
          <img className="team-crest-flag" src={visual.flagSrc} alt="" />
        ) : (
          <span className="team-crest-emoji">{visual.flagSrc}</span>
        )}
      </span>
      <span className="team-text-stack">
        <span className="team-label">{teamName}</span>
        <span className="team-code">{visual.code}</span>
      </span>
    </div>
  );
}

export default TeamIdentity;
