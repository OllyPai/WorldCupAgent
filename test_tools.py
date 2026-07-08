from tools import (
    query_schedule,
    query_player_stats,
    query_match_detail,
    query_top_scorer_by_team,
    query_best_goalkeeper,
    query_top10_scorers
)

# 测试第一层原子工具
print("===== 1. 原子工具：球队赛程 =====")
print(query_schedule.invoke({"team": "阿根廷"}))

print("\n===== 2. 原子工具：单球员数据 =====")
print(query_player_stats.invoke({"player_name": "利昂内尔・梅西"}))

print("\n===== 3. 原子工具：单场比赛进球详情 =====")
print(query_match_detail.invoke({"home_team": "阿根廷", "away_team": "佛得角"}))

# 测试第二层业务工具
print("\n===== 4. 业务工具：队内最佳射手 =====")
print(query_top_scorer_by_team.invoke({"team": "阿根廷"}))

print("\n===== 5. 业务工具：本届扑救最多门将 =====")
print(query_best_goalkeeper.invoke({}))

print("\n===== 6. 业务工具：进球前十射手榜 =====")
print(query_top10_scorers.invoke({}))