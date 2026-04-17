import { useEffect, useState } from "react";
import { 
  Search, 
  Download, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye
} from "lucide-react";
import apiClient from "@/utils/api.service";
import { toast } from "react-hot-toast";

type Transaction = {
  _id: string;
  user: { name: string; email: string };
  type: string;
  amount: number;
  status: string;
  paymentMethod: string;
  payosOrderCode?: string;
  createdAt: string;
  note?: string;
};

export default function FinanceTransactionsPage() {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/finance/transactions", {
        params: { page, search, type, status }
      });
      setData(res.data.transactions);
      setTotalPages(res.data.pagination.pages);
    } catch (err) {
      toast.error("Failed to load incoming streams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, type, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const getStatusStyle = (s: string) => {
    switch(s) {
      case 'success': return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case 'failed': return "bg-rose-50 text-rose-600 border-rose-100";
      case 'pending': return "bg-amber-50 text-amber-600 border-amber-100";
      default: return "bg-sand/30 text-muted border-sand/50";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold italic text-ink mb-2">Incoming Treasury</h1>
          <p className="text-muted text-sm font-medium">Monitoring PayOS transactions and manual service fees.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-sand rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-warm transition-all shadow-sm">
          <Download className="w-4 h-4" /> Export for Accounting
        </button>
      </div>

      {/* Filters Hub */}
      <div className="bg-white rounded-3xl border border-sand/50 p-6 shadow-sm flex flex-wrap items-center gap-4">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[300px]">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
           <input 
             type="text" 
             placeholder="Search by Order Code or Notes..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full h-11 bg-warm/20 border border-sand/40 rounded-2xl pl-12 pr-4 text-xs font-bold outline-none focus:border-caramel transition-all"
           />
        </form>

        <select 
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-11 px-4 bg-warm/20 border border-sand/40 rounded-2xl text-xs font-bold outline-none focus:border-caramel transition-all"
        >
          <option value="">All Streams</option>
          <option value="product_order">Product Orders</option>
          <option value="service_booking">Service Bookings</option>
          <option value="membership_fee">Memberships</option>
          <option value="blog_fee">Promoted Content</option>
        </select>

        <select 
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-11 px-4 bg-warm/20 border border-sand/40 rounded-2xl text-xs font-bold outline-none focus:border-caramel transition-all"
        >
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="pending">Awaiting</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Transactions Atelier Table */}
      <div className="bg-white rounded-[2.5rem] border border-sand/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-warm/10 border-b border-sand">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">ID / Timestamp</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Source / User</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Value</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/30">
              {loading ? (
                <tr>
                   <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                         <div className="w-8 h-8 border-4 border-caramel/20 border-t-caramel rounded-full animate-spin" />
                         <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Accessing Ledger...</span>
                      </div>
                   </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                   <td colSpan={5} className="py-20 text-center">
                      <p className="text-xs font-bold text-muted uppercase tracking-widest">No transactions found match these filters.</p>
                   </td>
                </tr>
              ) : data.map((tx) => (
                <tr key={tx._id} className="hover:bg-warm/5 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold text-ink mb-1">{tx.payosOrderCode || 'MANUAL-TX'}</p>
                    <p className="text-[10px] text-muted font-medium">{new Date(tx.createdAt).toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-ink">{tx.user?.name}</span>
                      <span className="text-[10px] font-bold text-caramel uppercase tracking-widest">{tx.type.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-ink">${tx.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-muted/50 font-bold uppercase tracking-widest">{tx.paymentMethod}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(tx.status)}`}>
                       {tx.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button className="p-2.5 rounded-xl hover:bg-warm text-muted transition-all">
                          <Eye className="w-4 h-4" />
                       </button>
                       <button className="p-2.5 rounded-xl hover:bg-warm text-muted transition-all">
                          <MoreVertical className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Console */}
        <div className="px-8 py-6 bg-warm/5 border-t border-sand flex items-center justify-between">
           <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
             Showing Page {page} of {totalPages}
           </p>
           <div className="flex items-center gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-xl bg-white border border-sand hover:bg-warm transition-all disabled:opacity-30"
              >
                 <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-xl bg-white border border-sand hover:bg-warm transition-all disabled:opacity-30"
              >
                 <ChevronRight className="h-4 w-4" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
