interface KpiTileProps {
  label: string;
  value: string;
}

export function KpiTile({ label, value }: KpiTileProps) {
  return (
    <div className="kpi-tile">
      <div className="kpi-tile__value">{value}</div>
      <div className="kpi-tile__label">{label}</div>
    </div>
  );
}
