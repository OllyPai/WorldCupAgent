import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import HeroBanner from "../components/HeroBanner";
import MatchScheduleList from "../components/MatchScheduleList";
import HotMatchCard from "../components/HotMatchCard";
import PlayerSpotlightGrid from "../components/PlayerSpotlightGrid";
import SiteFooter from "../components/SiteFooter";
import {
  featuredMatches,
  goalEvents,
  playerSpotlights,
  todayMatches,
} from "../data/homeMock";

function HomePage() {
  const navigate = useNavigate();
  const liveMatch = featuredMatches[0];
  const liveGoals = goalEvents.filter((event) => event.matchId === "match-95");

  return (
    <div className="page-shell">
      <div className="page-background" />
      <AppHeader />

      <main className="home-page">
        <HeroBanner
          featuredMatch={liveMatch}
          liveGoals={liveGoals}
          onPrimaryAction={() => navigate("/query")}
          onSecondaryAction={() =>
            document.getElementById("schedule")?.scrollIntoView({ behavior: "smooth" })
          }
        />

        <section className="section-shell" id="schedule">
          <div className="section-title-row">
            <div className="section-headline">
              <span className="section-kicker">赛程查询</span>
              <h2>近日赛程与比赛状态</h2>
              {/* <p>用户可以先看当天对阵、时间、阶段和比分，再决定要不要进一步查询。</p> */}
            </div>
            <div className="section-tag">日期 · 时间 · 对阵 · 阶段</div>
          </div>

          <MatchScheduleList matches={todayMatches} />
        </section>

        <section className="section-shell" id="player">
          <div className="section-title-row">
            <div className="section-headline">
              <span className="section-kicker">球员数据查询</span>
              <h2>球员信息</h2>
              {/* <p>这里聚焦球员统计信息，直接对应智能体的球员数据查询能力。</p> */}
            </div>
            <div className="section-tag">进球 · 助攻 · 出场</div>
          </div>

          <PlayerSpotlightGrid players={playerSpotlights} />
        </section>

        <section className="section-shell" id="detail">
          <div className="section-title-row">
            <div className="section-headline">
              <span className="section-kicker">比赛详情查询</span>
              <h2>单场比赛比分与关键事件</h2>
              {/* <p>单场比赛信息围绕比分、比赛阶段和进球记录展开，适合做详细查询展示。</p> */}
            </div>
            <div className="section-tag">比分 · 阶段 · 进球记录</div>
          </div>

          <div className="featured-grid">
            {featuredMatches.map((match) => (
              <HotMatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

export default HomePage;
