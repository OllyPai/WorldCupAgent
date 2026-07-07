from langchain.tools import tool
from .db_helper import get_db_connection

@tool
def query_schedule(team: str = None, date: str = None, stage: str = None) -> dict:
    """
    查询世界杯赛程信息，支持按球队、日期、比赛阶段筛选。
    参数说明：
    - team: 球队名称，比如"阿根廷"、"巴西"，可选
    - date: 比赛日期，格式YYYY-MM-DD，比如"2026-06-12"，可选
    - stage: 比赛阶段，比如"小组赛A组"、"1/8决赛"，可选
    三个参数至少传一个。
    返回结构化赛程数据。
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        sql = "SELECT match_date, match_time, home_team, away_team, stage, home_score, away_score FROM matches WHERE 1=1"
        params = []
        
        if team:
            sql += " AND (home_team = ? OR away_team = ?)"
            params.extend([team, team])
        if date:
            sql += " AND match_date = ?"
            params.append(date)
        if stage:
            sql += " AND stage = ?"
            params.append(stage)
        
        cursor.execute(sql, params)
        results = cursor.fetchall()
        conn.close()
        
        if not results:
            return {
                "success": False,
                "data": None,
                "error": "未查询到符合条件的赛程信息，请检查关键词是否正确。"
            }
        
        data = []
        for row in results:
            data.append({
                "match_date": row["match_date"],
                "match_time": row["match_time"],
                "home_team": row["home_team"],
                "away_team": row["away_team"],
                "stage": row["stage"],
                "home_score": row["home_score"],
                "away_score": row["away_score"]
            })
        
        return {
            "success": True,
            "data": data,
            "error": None
        }
    
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": f"赛程查询工具执行失败：{str(e)}"
        }