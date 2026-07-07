import { Avatar, Card, Empty, Table, Tag } from "antd";

function TeamInline({ team }) {
  return (
    <span className="team-inline">
      <span className="team-flag">{team.flag}</span>
      <span>{team.name}</span>
    </span>
  );
}

function ResultShowcase({ result, fallbackAnswer = "" }) {
  if (!result) {
    return (
      <Card className="query-result-card" bordered={false}>
        {fallbackAnswer ? (
          <div className="query-answer-fallback">
            <div className="section-headline result-headline">
              <span className="section-kicker">结果摘要</span>
              <h3>当前接口暂未返回结构化结果</h3>
              <p>现阶段以后端返回的文本 answer 为主，后续再逐步补充卡片或表格。</p>
            </div>
            <div className="query-answer-fallback-box">
              <p>{fallbackAnswer}</p>
            </div>
          </div>
        ) : (
          <Empty description="暂时没有结果可以展示" />
        )}
      </Card>
    );
  }

  const scheduleColumns = [
    {
      title: "对阵",
      dataIndex: "matchup",
      key: "matchup",
      render: (_, row) => (
        <div className="matchup-cell">
          <TeamInline team={row.homeTeam} />
          <span className="matchup-divider">对</span>
          <TeamInline team={row.awayTeam} />
        </div>
      ),
    },
    {
      title: "比分",
      dataIndex: "score",
      key: "score",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (value) => (
        <Tag color={value === "进行中" ? "red" : value === "未开始" ? "blue" : "green"}>
          {value}
        </Tag>
      ),
    },
    {
      title: "时间",
      dataIndex: "time",
      key: "time",
    },
  ];

  return (
    <Card className="query-result-card" bordered={false}>
      <div className="section-headline result-headline">
        <span className="section-kicker">结构化结果</span>
        <h3>{result.title}</h3>
        <p>{result.summary}</p>
      </div>

      {result.mode === "schedule" ? (
        <Table
          columns={scheduleColumns}
          dataSource={result.rows}
          pagination={false}
          className="result-table"
        />
      ) : null}

      {result.mode === "scorecard" ? (
        <div className="score-result-wrap">
          <div className="score-result-main">
            <TeamInline team={result.match.homeTeam} />
            <div className="score-result-center">
              <strong>
                {result.match.homeScore} : {result.match.awayScore}
              </strong>
              <span>{result.match.stage}</span>
            </div>
            <TeamInline team={result.match.awayTeam} />
          </div>

          <div className="score-stat-grid">
            {result.stats.map((stat) => (
              <div className="score-stat-item" key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {result.mode === "events" ? (
        <div className="event-list">
          {result.events.map((event) => (
            <div className="event-card" key={event.id}>
              <Avatar className="event-avatar">{event.avatar}</Avatar>
              <div>
                <strong>{event.playerName}</strong>
                <div className="event-meta">
                  <span>{event.team.flag}</span>
                  <span>{event.team.name}</span>
                  <span>{event.minute}</span>
                  <Tag color="green">{event.goalType}</Tag>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {result.mode === "recommendation" ? (
        <div className="recommend-grid">
          {result.cards.map((card) => (
            <div className="recommend-card" key={card.id}>
              <div className="recommend-rank">推荐 {card.rank}</div>
              <div className="recommend-matchup">
                <TeamInline team={card.homeTeam} />
                <strong>
                  {card.homeScore} : {card.awayScore}
                </strong>
                <TeamInline team={card.awayTeam} />
              </div>
              <div className="recommend-meta">
                <Tag color="cyan">{card.heat}</Tag>
                <Tag color="green">{card.status}</Tag>
              </div>
              <p>{card.summary}</p>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

export default ResultShowcase;
