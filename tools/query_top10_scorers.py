from langchain.tools import tool
from .db_helper import get_db_connection

@tool
def query_top10_scorers() -> dict:
    """
    【第二层业务工具】查询本届世界杯射手榜，返回进球前十球员
    适配自然语言提问：本届世界杯射手榜、这次世界杯最强的几个射手、进球最多前十人
    无输入参数，从players场上球员表按goals降序取前10名完整数据
    """
    try:
        conn = get_db_connection()
        conn.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
        cursor = conn.cursor()

        # 进球降序，最多取10条
        cursor.execute('''
            SELECT player_name, team, goals, assists, appearances, total_minutes, avg_minutes
            FROM players ORDER BY goals DESC LIMIT 10
        ''')
        top_list = cursor.fetchall()
        conn.close()

        if not top_list:
            return {
                "success": False,
                "data": None,
                "error": "暂无球员进球数据，无法生成射手榜"
            }

        return {
            "success": True,
            "data": {
                "top10_scorers": top_list,
                "desc": f"本届世界杯射手榜，共{len(top_list)}名球员，按进球数从高到低排序"
            },
            "error": None
        }

    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": f"射手榜查询工具执行失败：{str(e)}"
        }
