from langchain.tools import tool
from .db_helper import get_db_connection

@tool
def query_match_detail(home_team: str = None, away_team: str = None, match_id: int = None) -> dict:
    """
    查询单场比赛的详细信息，包括比分和进球记录。
    参数说明：
    - home_team: 主队名称，比如"阿根廷"，可选
    - away_team: 客队名称，比如"法国"，可选
    - match_id: 比赛ID，可选
    优先用match_id查询；如果传了主队和客队，按对阵双方查询。
    返回结构化比赛详情数据。
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if match_id:
            cursor.execute("SELECT * FROM matches WHERE match_id = ?", (match_id,))
        elif home_team and away_team:
            cursor.execute("SELECT * FROM matches WHERE home_team = ? AND away_team = ?", (home_team, away_team))
        else:
            conn.close()
            return {
                "success": False,
                "data": None,
                "error": "请提供比赛ID或主队+客队名称，以便查询比赛详情。"
            }
        
        match = cursor.fetchone()
        if not match:
            conn.close()
            return {
                "success": False,
                "data": None,
                "error": "未找到对应比赛，请检查输入信息。"
            }
        
        cursor.execute("SELECT player_name, team, goal_time, event_type FROM match_details WHERE match_id = ?", (match['match_id'],))
        goals = cursor.fetchall()
        conn.close()
        
        goal_list = []
        for g in goals:
            goal_list.append({
                "player_name": g["player_name"],
                "team": g["team"],
                "goal_time": g["goal_time"],
                "event_type": g["event_type"]
            })
        
        data = {
            "match_id": match["match_id"],
            "match_date": match["match_date"],
            "match_time": match["match_time"],
            "home_team": match["home_team"],
            "away_team": match["away_team"],
            "stage": match["stage"],
            "home_score": match["home_score"],
            "away_score": match["away_score"],
            "goals": goal_list
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
            "error": f"比赛详情查询工具执行失败：{str(e)}"
        }