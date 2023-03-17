export default function (mmr) {
    let rank = ""
    if (mmr < 1200)
        rank = 'Peasant';
    else if ((mmr >= 1200) && (mmr < 1400))
        rank = 'Guard';
    else if ((mmr >= 1400) && (mmr < 1600))
        rank = 'Knight';
    else if ((mmr >= 1600) && (mmr < 1800))
        rank = 'MasterKnight';
    else if ((mmr >= 1800) && (mmr < 2000))
        rank = 'Lord';
    else if ((mmr >= 2000) && (mmr < 2500))
        rank = 'Duke';
    else if ((mmr >= 2500) && (mmr < 3000))
        rank = 'Prince';
    else if ((mmr >= 3000) && (mmr < 4000))
        rank = 'King';
    else if ((mmr > 4000))
        rank = 'Emperor';

    return rank
}
