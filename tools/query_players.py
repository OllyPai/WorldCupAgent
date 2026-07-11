from langchain.tools import tool

from .db_helper import get_db_connection
from .player_aliases import player_name_candidates


ALLOWED_SORT_FIELDS = {"goals", "assists", "appearances"}


@tool
def query_players(
    player_name: str = None,
    team: str = None,
    sort_by: str = "goals",
    limit: int = 10,
) -> dict:
    """
    查询球员列表，支持按球员、球队筛选，并按进球、助攻或出场次数排序。
    参数说明：
    - player_name: 球员姓名，比如"梅西"、"姆巴佩"，可选
    - team: 球队名称，比如"阿根廷"、"法国"，可选
    - sort_by: 排序字段，只支持"goals"、"assists"、"appearances"，默认"goals"
    - limit: 返回数量，默认10，最大20
    返回结构化球员列表数据。
    """
    try:
        if sort_by not in ALLOWED_SORT_FIELDS:
            return {
                "success": False,
                "data": None,
                "error": "排序字段仅支持 goals、assists、appearances。",
            }

        try:
            safe_limit = int(limit)
        except (TypeError, ValueError):
            safe_limit = 10
        safe_limit = max(1, min(safe_limit, 20))

        conn = get_db_connection()
        cursor = conn.cursor()

        sql = (
            "SELECT player_name, team, goals, assists, appearances "
            "FROM players WHERE 1=1"
        )
        params = []

        if player_name:
            candidates = player_name_candidates(player_name)
            placeholders = ", ".join("?" for _ in candidates)
            sql += f" AND (player_name IN ({placeholders}) OR player_name LIKE ?)"
            params.extend(candidates)
            params.append(f"%{player_name}%")
        if team:
            sql += " AND team = ?"
            params.append(team)

        sql += f" ORDER BY {sort_by} DESC, goals DESC, assists DESC, appearances DESC, player_name ASC LIMIT ?"
        params.append(safe_limit)

        cursor.execute(sql, params)
        results = cursor.fetchall()
        conn.close()

        if not results:
            return {
                "success": False,
                "data": None,
                "error": "未查询到符合条件的球员数据，请检查球员或球队名称是否正确。",
            }

        players = [
            {
                "player_name": row["player_name"],
                "team": row["team"],
                "goals": row["goals"],
                "assists": row["assists"],
                "appearances": row["appearances"],
            }
            for row in results
        ]

        return {
            "success": True,
            "data": {
                "players": players,
                "sort_by": sort_by,
                "limit": safe_limit,
                "filters": {
                    "player_name": player_name,
                    "team": team,
                },
            },
            "error": None,
        }

    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": f"球员列表查询工具执行失败：{str(e)}",
        }
