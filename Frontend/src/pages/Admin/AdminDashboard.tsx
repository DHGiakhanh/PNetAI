import { useEffect, useState } from "react";
import { 
  ShoppingBag, 
  Users, 
  BookOpen, 
  ShieldCheck, 
  ArrowUpRight, 
  Loader2,
  TrendingUp,
  Clock,
  DollarSign
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import apiClient from "@/utils/api.service";
import { motion } from "framer-motion";

import { json2csv } from 'json-2-csv';
import { toast } from "react-hot-toast";

type DashboardStats = {
  kpis: {
    ordersToday: number;
    gmv: number;
    pendingPosts: number;
    pendingLegal: number;
  };
  charts: {
    userGrowth: any[];
    revenueTrend: any[];
  };
  recentLogs: any[];
};

export const AdminDashboard = () => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/admin/statistics/dashboard");
        setData(res.data);
      } catch (err) {
        console.error("Dashboard data fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleExport = async () => {
    if (!data) return;
    try {
      const exportData = [
        { Metric: "Total GMV", Value: data.kpis.gmv },
        { Metric: "Orders Today", Value: data.kpis.ordersToday },
        { Metric: "Pending Blog Posts", Value: data.kpis.pendingPosts },
        { Metric: "Pending Legal Reviews", Value: data.kpis.pendingLegal },
      ];
      
      const csv = json2csv(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `PNetAI_Report_${new Date().toLocaleDateString()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Report downloaded successfully");
    } catch (err) {
      toast.error("Failed to generate report");
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caramel animate-spin mb-4" />
        <p className="text-xs font-bold text-muted uppercase tracking-[0.2em] animate-pulse">Consulting Atelier Analytics</p>
      </div>
    );
  }

  const kpis = [
    { 
      label: "GMV (Gross Merchandise Value)", 
      value: `$${(data?.kpis.gmv || 0).toLocaleString()}`, 
      icon: DollarSign, 
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      trend: "+12.5%",
      isUp: true
    },
    { 
      label: "Successful Orders (Today)", 
      value: data?.kpis.ordersToday || 0, 
      icon: ShoppingBag, 
      color: "text-caramel",
      bg: "bg-caramel/5",
      trend: "+4.2%",
      isUp: true
    },
    { 
      label: "Pending Blog Reviews", 
      value: data?.kpis.pendingPosts || 0, 
      icon: BookOpen, 
      color: "text-amber-600",
      bg: "bg-amber-50",
      trend: "Critical",
      isUp: false
    },
    { 
      label: "Legal Approval Queue", 
      value: data?.kpis.pendingLegal || 0, 
      icon: ShieldCheck, 
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      trend: "Action Required",
      isUp: false
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold italic text-ink mb-2">Editor's Dashboard</h1>
          <p className="text-muted text-sm font-medium">Real-time health metrics of the PNetAI ecosystem.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-5 py-2.5 bg-white border border-sand rounded-2xl shadow-sm flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-ink uppercase tracking-widest">Live System Status</span>
          </div>
          <button 
            onClick={handleExport}
            className="px-6 py-2.5 bg-ink text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-caramel transition-all"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-[2.5rem] border border-sand/50 p-8 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className={`w-12 h-12 rounded-2xl ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${kpi.isUp ? 'text-emerald-600' : 'text-amber-600'}`}>
                {kpi.trend}
                {kpi.isUp ? <ArrowUpRight className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              </div>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-1">{kpi.label}</p>
            <h3 className="text-3xl font-serif font-bold text-ink">{kpi.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Monthly Revenue Area Chart */}
         <div className="bg-white rounded-[3rem] border border-sand/50 p-10 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-serif font-bold italic text-ink">Revenue Performance</h3>
                <p className="text-xs font-medium text-muted">Monthly financial distribution across all modules.</p>
              </div>
              <TrendingUp className="w-6 h-6 text-caramel" />
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.charts.revenueTrend || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5E3C" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#8B5E3C" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4D5BC" />
                  <XAxis 
                    dataKey="_id.month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#808080' }}
                    tickFormatter={(m) => `Month ${m}`}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#808080' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                    itemStyle={{ color: '#8B5E3C' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#8B5E3C" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>

         {/* User Growth Bar Chart */}
         <div className="bg-white rounded-[3rem] border border-sand/50 p-10 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-serif font-bold italic text-ink">User Acquisition</h3>
                <p className="text-xs font-medium text-muted">New Pet Owner registrations on a monthly basis.</p>
              </div>
              <Users className="w-6 h-6 text-ink" />
            </div>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.charts.userGrowth || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4D5BC" />
                    <XAxis 
                      dataKey="_id.month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#808080' }}
                      tickFormatter={(m) => `Month ${m}`}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#808080' }} />
                    <Tooltip 
                      cursor={{ fill: '#FBF9F6' }}
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                      {(data?.charts.userGrowth || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#1C1917' : '#8B5E3C'} />
                      ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

    </motion.div>
  );
};
