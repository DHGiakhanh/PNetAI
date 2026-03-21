export const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => {

  const colors:any = {
    pink: "bg-pink-100 text-pink-500",
    cyan: "bg-cyan-100 text-cyan-500",
    purple: "bg-purple-100 text-purple-500",
    orange: "bg-orange-100 text-orange-500"
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-pink-100 rounded-2xl p-5 shadow-md hover:shadow-xl transition">

      <div className="flex items-center justify-between mb-2">

        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5"/>
        </div>

        <span className="text-xs text-green-500 font-medium">
          {subtitle}
        </span>

      </div>

      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>

    </div>
  );
};