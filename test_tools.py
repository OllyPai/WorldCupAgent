from tools import query_schedule, query_player_stats, query_match_detail

# 测试赛程
print(query_schedule.invoke({"team": "阿根廷"}))
# 测试球员
print(query_player_stats.invoke({"player_name": "梅西"}))
# 测试详情
print(query_match_detail.invoke({"home_team": "阿根廷", "away_team": "佛得角"}))