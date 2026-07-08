from langchain.tools import tool
from .db_helper import get_db_connection

@tool
def query_top_scorer_by_team(team: str) -> dict:
    """
    【第二层业务工具】查询指定球队队内最佳射手（进球最多场上球员）
    适配多类自然语言提问：
        XX队进球最多的是谁？XX队内射手王？XX最佳射手是谁？
    参数：
        team: str 必填，国家队名称，示例："阿根廷"、"巴西"
    返回队内第一射手姓名、总进球、助攻、出场数据
    """
    try:
        conn = get_db_connection()
        conn.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
        cursor = conn.cursor()

        # 按进球降序取第一名，仅查询场上球员表（门将无进球数据）
        cursor.execute('''
            SELECT player_name, team, goals, assists, appearances, total_minutes, avg_minutes
            FROM players WHERE team = ? ORDER BY goals DESC LIMIT 1
        ''', (team,))
        top_player = cursor.fetchone()
        conn.close()

        if not top_player:
            return {
                "success": False,
                "data": None,
                "error": f"未查询到「{team}」任何球员数据，无法统计队内射手"
            }

        return {
            "success": True,
            "data": {
                "team": team,
                "top_scorer": top_player,
                "desc": f"{team}队内最佳射手，总进球数{top_player['goals']}"
            },
            "error": None
        }

    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": f"队内射手统计工具执行失败：{str(e)}"
        }
