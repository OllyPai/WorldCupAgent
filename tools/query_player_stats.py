from langchain.tools import tool
from .db_helper import get_db_connection
from .player_aliases import player_name_candidates

@tool
def query_player_stats(player_name: str) -> dict:
    """
    查询指定球员的本届世界杯个人数据。
    普通场上球员返回进球、助攻、出场次数等字段；守门员返回扑救数据。
    如果球员统计表未收录，但比赛事件表有进球记录，则返回进球聚合兜底结果。
    参数说明：
    - player_name: 球员姓名，必填，比如"梅西"、"姆巴佩"、"C罗"
    返回结构化球员统计数据。
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        candidates = player_name_candidates(player_name)

        for candidate in candidates:
            cursor.execute(
                """
                SELECT player_name, team, goals, assists, appearances,
                       total_minutes, avg_minutes, red_cards, yellow_cards
                FROM players WHERE player_name = ?
                """,
                (candidate,),
            )
            result = cursor.fetchone()
            if result:
                conn.close()
                return {
                    "success": True,
                    "data": {
                        "player_name": result["player_name"],
                        "team": result["team"],
                        "goals": result["goals"],
                        "assists": result["assists"],
                        "appearances": result["appearances"],
                        "total_minutes": result["total_minutes"],
                        "avg_minutes": result["avg_minutes"],
                        "red_cards": result["red_cards"],
                        "yellow_cards": result["yellow_cards"],
                    },
                    "error": None,
                }

        cursor.execute(
            """
            SELECT player_name, team, goals, assists, appearances,
                   total_minutes, avg_minutes, red_cards, yellow_cards
            FROM players WHERE player_name LIKE ?
            ORDER BY goals DESC, appearances DESC, player_name ASC
            LIMIT 1
            """,
            (f"%{player_name}%",),
        )
        result = cursor.fetchone()
        if result:
            conn.close()
            return {
                "success": True,
                "data": {
                    "player_name": result["player_name"],
                    "team": result["team"],
                    "goals": result["goals"],
                    "assists": result["assists"],
                    "appearances": result["appearances"],
                    "total_minutes": result["total_minutes"],
                    "avg_minutes": result["avg_minutes"],
                    "red_cards": result["red_cards"],
                    "yellow_cards": result["yellow_cards"],
                },
                "error": None,
            }

        for candidate in candidates:
            cursor.execute(
                "SELECT player_name, team, saves, save_rate FROM goalkeepers WHERE player_name = ?",
                (candidate,),
            )
            result = cursor.fetchone()
            if result:
                conn.close()
                return {
                    "success": True,
                    "data": {
                        "player_name": result["player_name"],
                        "team": result["team"],
                        "saves": result["saves"],
                        "save_rate": result["save_rate"],
                    },
                    "error": None,
                }

        cursor.execute(
            """
            SELECT player_name, team, saves, save_rate
            FROM goalkeepers WHERE player_name LIKE ?
            ORDER BY saves DESC, player_name ASC
            LIMIT 1
            """,
            (f"%{player_name}%",),
        )
        result = cursor.fetchone()
        if result:
            conn.close()
            return {
                "success": True,
                "data": {
                    "player_name": result["player_name"],
                    "team": result["team"],
                    "saves": result["saves"],
                    "save_rate": result["save_rate"],
                },
                "error": None,
            }

        for candidate in candidates:
            cursor.execute(
                """
                SELECT player_name, team, COUNT(*) AS goals
                FROM match_details
                WHERE player_name = ? AND event_type = 'goal'
                GROUP BY player_name, team
                ORDER BY goals DESC
                LIMIT 1
                """,
                (candidate,),
            )
            result = cursor.fetchone()
            if result:
                conn.close()
                return {
                    "success": True,
                    "data": {
                        "player_name": result["player_name"],
                        "team": result["team"],
                        "goals": result["goals"],
                    },
                    "error": None,
                }

        cursor.execute(
            """
            SELECT player_name, team, COUNT(*) AS goals
            FROM match_details
            WHERE player_name LIKE ? AND event_type = 'goal'
            GROUP BY player_name, team
            ORDER BY goals DESC
            LIMIT 1
            """,
            (f"%{player_name}%",),
        )
        result = cursor.fetchone()
        conn.close()
        if result:
            return {
                "success": True,
                "data": {
                    "player_name": result["player_name"],
                    "team": result["team"],
                    "goals": result["goals"],
                },
                "error": None,
            }

        return {
            "success": False,
            "data": None,
            "error": f"未查询到球员「{player_name}」的数据，请检查姓名是否正确。",
        }
    
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": f"球员数据查询工具执行失败：{str(e)}"
        }
