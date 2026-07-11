from tools import (
    query_best_goalkeeper,
    query_match_detail,
    query_player_stats,
    query_players,
    query_schedule,
    query_top10_scorers,
    query_top_scorer_by_team,
)

# 测试赛程
print(query_schedule.invoke({"team": "阿根廷"}))
# 测试球员
print(query_player_stats.invoke({"player_name": "梅西"}))
# 测试球员排行
print(query_players.invoke({"sort_by": "goals", "limit": 3}))
# 测试详情
print(query_match_detail.invoke({"home_team": "阿根廷", "away_team": "佛得角"}))
# 测试队内最佳射手
print(query_top_scorer_by_team.invoke({"team": "阿根廷"}))
# 测试门将扑救榜
print(query_best_goalkeeper.invoke({}))
# 测试射手榜
print(query_top10_scorers.invoke({}))
