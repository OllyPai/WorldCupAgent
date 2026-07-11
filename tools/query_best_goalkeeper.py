from langchain.tools import tool
from .db_helper import get_db_connection

@tool
def query_best_goalkeeper() -> dict:
    """
    【第二层业务工具】查询本届世界杯扑救次数最多的门将（本届门神）
    适配自然语言提问：本届世界杯门神是谁、谁扑救次数最多、扑救最强门将
    无输入参数，自动从goalkeepers表按saves降序取第一名门将完整数据
    返回该门将姓名、所属队伍、总扑救次数、扑救成功率
    """
    try:
        conn = get_db_connection()
        conn.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
        cursor = conn.cursor()

        # 按扑救次数降序取第一名
        cursor.execute('''
            SELECT player_name, team, saves, save_rate
            FROM goalkeepers ORDER BY saves DESC LIMIT 1
        ''')
        best_gk = cursor.fetchone()
        conn.close()

        if not best_gk:
            return {
                "success": False,
                "data": None,
                "error": "暂无门将数据可统计扑救榜单"
            }

        return {
            "success": True,
            "data": {
                "best_goalkeeper": best_gk,
                "desc": f"本届世界杯扑救次数最多门将（门神）：{best_gk['player_name']}，累计扑救{best_gk['saves']}次"
            },
            "error": None
        }

    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": f"最佳门将统计工具执行失败：{str(e)}"
        }
