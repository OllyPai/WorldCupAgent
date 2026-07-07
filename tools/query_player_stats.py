from langchain.tools import tool
from .db_helper import get_db_connection

@tool
def query_player_stats(player_name: str) -> dict:
    """
    查询指定球员的本届世界杯个人数据，包括进球、助攻、出场次数。
    参数说明：
    - player_name: 球员姓名，必填，比如"梅西"、"姆巴佩"
    返回结构化球员统计数据。
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT player_name, team, goals, assists, appearances FROM players WHERE player_name = ?", (player_name,))
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            return {
                "success": False,
                "data": None,
                "error": f"未查询到球员「{player_name}」的数据，请检查姓名是否正确。"
            }
        
        data = {
            "player_name": result["player_name"],
            "team": result["team"],
            "goals": result["goals"],
            "assists": result["assists"],
            "appearances": result["appearances"]
        }
        
        return {
            "success": True,
            "data": data,
            "error": None
        }
    
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": f"球员数据查询工具执行失败：{str(e)}"
        }