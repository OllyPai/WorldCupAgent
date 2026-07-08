from langchain.tools import tool
from .db_helper import get_db_connection

@tool
def query_player_stats(player_name: str) -> dict:
    """
    查询指定球员的本届世界杯个人数据，自动区分场上球员与守门员
    场上球员返回：姓名、队伍、进球、助攻、出场次数、总出场分钟、场均出场分钟、红牌、黄牌
    守门员返回：姓名、队伍、扑救次数、扑救成功率
    参数说明：
    - player_name: 球员姓名，必填，比如"梅西"、"姆巴佩"、"大马丁内斯"
    返回结构化球员统计数据。
    """
    try:
        conn = get_db_connection()
        # 开启按字段名取值
        conn.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
        cursor = conn.cursor()
        
        # 1. 先查询普通场上球员
        cursor.execute("""
            SELECT player_name, team, goals, assists, appearances, total_minutes, avg_minutes, red_cards, yellow_cards
            FROM players WHERE player_name = ?
        """, (player_name,))
        player_row = cursor.fetchone()
        if player_row:
            conn.close()
            return {
                "success": True,
                "data": player_row,
                "error": None
            }
        
        # 2. 场上球员无结果，再查询守门员
        cursor.execute("""
            SELECT player_name, team, saves, save_rate
            FROM goalkeepers WHERE player_name = ?
        """, (player_name,))
        gk_row = cursor.fetchone()
        conn.close()

        if gk_row:
            return {
                "success": True,
                "data": gk_row,
                "error": None
            }

        # 两边表都没找到该球员
        return {
            "success": False,
            "data": None,
            "error": f"未查询到球员「{player_name}」的数据，请检查姓名是否正确。"
        }
    
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": f"球员数据查询工具执行失败：{str(e)}"
        }