// src/components/common/StatCard.tsx
import { useSettingsStore } from '../../stores/settingsStore';

type StatCardProps = {
  title: string;
  value: string | number;
};

const StatCard = ({ title, value }: StatCardProps) => {
  const { theme } = useSettingsStore();

  return (
    <div
      className="min-w-[220px] rounded-[20px] px-6 py-3 flex flex-col items-center"
      style={{
        backgroundColor: `${theme.accentColor}40`,
        borderLeft: `4px solid ${theme.accentColor}`
      }}
    >
      <span className="text-xs text-gray-700 font-medium tracking-wide uppercase">{title}</span>
      <span
        className="text-xl font-semibold mt-1"
        style={{ color: theme.primaryColor }}
      >
        {value}
      </span>
    </div>
  );
};

export default StatCard;