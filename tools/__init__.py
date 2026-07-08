# 第一层 原子工具
from .query_player_stats import query_player_stats
from .query_schedule import query_schedule
from .query_match_detail import query_match_detail

# 第二层 业务工具
from .query_top_scorer_by_team import query_top_scorer_by_team
from .query_best_goalkeeper import query_best_goalkeeper
from .query_top10_scorers import query_top10_scorers

# 对外暴露全部可用工具，无第三层自由SQL工具
__all__ = [
    "query_player_stats",
    "query_schedule",
    "query_match_detail",
    "query_top_scorer_by_team",
    "query_best_goalkeeper",
    "query_top10_scorers"
]