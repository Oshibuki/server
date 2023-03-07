export default function calculate_dmg_percentage($total_dmg, $dmg)
{
    if ($total_dmg == 0 || $dmg == 0)
        return 0;
    return $dmg / $total_dmg * 100;
}
