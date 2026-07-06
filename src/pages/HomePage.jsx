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
              <span className="section-kicker">Today Matches</span>
              <h2>今日赛程一眼看清</h2>
              <p>先让用户看到信息密度，再让他进入智能查询。</p>
            </div>
            <Tag color="green" className="section-tag">
              实时状态 + 比分 + 场馆
            </Tag>
          </div>

          <MatchScheduleList matches={todayMatches} />
        </section>

        <section className="section-shell" id="featured">
          <div className="section-title-row">
            <div className="section-headline">
              <span className="section-kicker">Featured Matches</span>
              <h2>深蓝黑底上的焦点赛事卡片</h2>
              <p>这里强调热点、比分和比赛气氛，做出赛事首页的张力。</p>
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
              <span className="section-kicker">Natural Language Query</span>
              <h2>首页直接体现“能查什么”</h2>
              <p>先用示例问题做出交互感，后续再接真实的查询页和后端接口。</p>
            </div>
            <Tag color="cyan" icon={<ThunderboltOutlined />}>
              Query First
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
              <span className="section-kicker">Transparent Agent Flow</span>
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
