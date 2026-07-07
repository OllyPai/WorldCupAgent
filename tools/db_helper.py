import os
import sqlite3

def get_db_connection():
    """获取数据库连接，基于当前文件路径定位，避免相对路径出错"""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, 'worldcup.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn