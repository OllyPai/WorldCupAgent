PLAYER_NAME_ALIASES = {
    "梅西": ["利昂内尔・梅西", "梅西"],
    "姆巴佩": ["基利安·姆巴佩", "姆巴佩"],
    "哈兰德": ["埃尔林・哈兰德", "哈兰德"],
    "凯恩": ["哈里·凯恩", "凯恩"],
    "内马尔": ["内马尔", "内马尔·儒尼奥尔"],
    "维尼修斯": ["维尼修斯·派尚", "维尼修斯"],
    "C罗": ["C罗", "克里斯蒂亚诺·罗纳尔多", "克里斯蒂亚诺・罗纳尔多"],
}


def player_name_candidates(player_name: str) -> list[str]:
    """返回常见简称对应的候选姓名，保持用户输入优先。"""
    if not player_name:
        return []

    candidates = [player_name]
    candidates.extend(PLAYER_NAME_ALIASES.get(player_name, []))

    unique_candidates = []
    for candidate in candidates:
        if candidate and candidate not in unique_candidates:
            unique_candidates.append(candidate)
    return unique_candidates
