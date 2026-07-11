# 统一导出所有工具，上游调用方无需关心内部文件结构
from .query_schedule import query_schedule
from .query_player_stats import query_player_stats
from .query_players import query_players
from .query_match_detail import query_match_detail
from .query_top_scorer_by_team import query_top_scorer_by_team
from .query_best_goalkeeper import query_best_goalkeeper
from .query_top10_scorers import query_top10_scorers

__all__ = [
    "query_schedule",
    "query_player_stats",
    "query_players",
    "query_match_detail",
    "query_top_scorer_by_team",
    "query_best_goalkeeper",
    "query_top10_scorers",
]
