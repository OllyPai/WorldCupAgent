import { useMemo, useState } from "react";
import { ArrowRightOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Button, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import HeroBanner from "../components/HeroBanner";
import MatchScheduleList from "../components/MatchScheduleList";
import HotMatchCard from "../components/HotMatchCard";
import QuickQueryPanel from "../components/QuickQueryPanel";
import AgentFlowPanel from "../components/AgentFlowPanel";
import SiteFooter from "../components/SiteFooter";
import {
  agentTraces,
  featuredMatches,
  goalEvents,
  quickQueries,
  todayMatches,
} from "../data/homeMock";

function HomePage() {
  const navigate = useNavigate();
  const [selectedQueryId, setSelectedQueryId] = useState(quickQueries[0].id);

  const activeTrace = agentTraces[selectedQueryId];
  const liveMatch = featuredMatches[0];

  const liveGoals = useMemo(
    () => goalEvents.filter((event) => event.matchId === "match-01"),
    []
  );

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
            document.getElementById("today")?.scrollIntoView({ behavior: "smooth" })
          }
        />

        <section className="section-shell" id="today">
          <div className="section-title-row">
            <div className="section-headline">
              <span className="section-kicker">演示赛程</span>
              <h2>本地赛程记录一眼看清</h2>
              <p>首页展示的是本地 SQLite 课程演示库记录，真实查询请进入智能查询页。</p>
            </div>
            <Tag color="blue" className="section-tag">
              本地演示数据 + 工具查询入口
            </Tag>
          </div>

          <MatchScheduleList matches={todayMatches} />
        </section>

        <section className="section-shell" id="featured">
          <div className="section-title-row">
            <div className="section-headline">
              <span className="section-kicker">示例赛事</span>
              <h2>用于演示的赛事卡片</h2>
              <p>这里展示本地库中的代表性比赛，避免误标为官方实时赛况。</p>
            </div>
            <Button
              type="default"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate("/query?case=query-04")}
            >
              进入智能查询
            </Button>
          </div>

          <div className="featured-grid">
            {featuredMatches.map((match) => (
              <HotMatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>

        <section className="section-shell accent-shell" id="query">
          <div className="section-title-row">
            <div className="section-headline">
              <span className="section-kicker">自然语言查询</span>
              <h2>首页直接体现“能查什么”</h2>
              <p>示例问题与后端工具能力保持一致：赛程、球员数据、比赛详情。</p>
            </div>
            <Tag color="cyan" icon={<ThunderboltOutlined />}>
              先查后聊
            </Tag>
          </div>

          <QuickQueryPanel
            queries={quickQueries}
            selectedQueryId={selectedQueryId}
            onSelectQuery={setSelectedQueryId}
            trace={activeTrace}
            onOpenQuery={() => navigate(`/query?case=${selectedQueryId}`)}
          />
        </section>

        <section className="section-shell" id="agent">
          <div className="section-title-row">
            <div className="section-headline">
              <span className="section-kicker">智能体流程可视化</span>
              <h2>工具调用过程必须看得见</h2>
              <p>
                这是课程评分点之一，所以首页就把工具名、参数、结果摘要展示出来。
              </p>
            </div>
            <Tag color="green">理解任务 - 调用工具 - 观察结果</Tag>
          </div>

          <AgentFlowPanel trace={activeTrace} />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

export default HomePage;
