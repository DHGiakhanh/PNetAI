import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { formatVnd } from "@/utils/currency";
import { bookingService } from "@/services/booking.service";
import { Calendar, Clock, MapPin, Dog } from "lucide-react";

type Booking = {
  _id: string;
  service: {
    title: string;
    description: string;
    images?: string[];
    location?: { city: string };
  };
  pet: {
    name: string;
    avatarUrl?: string;
    species: string;
    breed?: string;
  };
  bookingDate: string;
  bookingTime: string;
  totalAmount: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  paymentMethod?: string;
};

const statusTone: Record<Booking["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-sky-100 text-sky-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await bookingService.getMyBookings();
        setBookings(data || []);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Could not load bookings.");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const totalSpent = useMemo(
    () => bookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0),
    [bookings]
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-warm to-cream px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-serif text-4xl font-bold italic text-ink">My Appointments</h1>
        <p className="mt-2 text-sm text-muted">Track your service bookings and appointment status.</p>

        <div className="mt-4 rounded-2xl border border-sand bg-white/90 p-4 text-sm text-ink shadow-sm">
          <p>
            Total bookings: <span className="font-semibold">{bookings.length}</span> · Total spent:{" "}
            <span className="font-semibold text-brown">{formatVnd(totalSpent)}</span>
          </p>
        </div>

        <section className="mt-8 space-y-6">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-caramel border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Synching Appointments...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-20 text-center bg-white/50 rounded-[2rem] border border-dashed border-sand">
              <p className="text-xs font-bold text-muted uppercase tracking-widest">No appointments found.</p>
            </div>
          ) : (
            bookings.map((booking) => {
              if (!booking.service || !booking.pet) return null;
              
              return (
                <article key={booking._id} className="rounded-2xl border border-sand bg-white/90 overflow-hidden shadow-sm flex flex-col sm:flex-row">
                <div className="w-full sm:w-48 h-48 sm:h-auto overflow-hidden bg-sand/20 flex-shrink-0">
                  <img
                    src={(booking.service.images && booking.service.images.length > 0) 
                      ? booking.service.images[0] 
                      : "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=400&auto=format&fit=crop"
                    }
                    alt={booking.service.title}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                  <div className="flex-1 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-serif font-bold italic text-ink">{booking.service.title}</h3>
                          <span className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest ${statusTone[booking.status]}`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-muted">
                           <span className="flex items-center gap-1.5">
                             <Calendar className="w-3" />
                             {new Date(booking.bookingDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                           </span>
                           <span className="flex items-center gap-1.5">
                             <Clock className="w-3" />
                             {booking.bookingTime}
                           </span>
                           {booking.service.location?.city && (
                             <span className="flex items-center gap-1.5">
                               <MapPin className="w-3" />
                               {booking.service.location.city}
                             </span>
                           )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-ink">{formatVnd(booking.totalAmount)}</p>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">
                          ID: {booking._id.slice(-8).toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-warm/30 rounded-2xl border border-sand/30">
                       <div className="w-10 h-10 rounded-xl bg-white border border-sand flex items-center justify-center overflow-hidden">
                          {booking.pet.avatarUrl ? (
                            <img src={booking.pet.avatarUrl} className="w-full h-full object-cover" />
                          ) : (
                            <Dog className="w-5 h-5 text-muted" />
                          )}
                       </div>
                       <div>
                          <p className="text-xs font-bold text-ink">Appointment for {booking.pet.name}</p>
                          <p className="text-[10px] font-medium text-muted">{booking.pet.breed || booking.pet.species}</p>
                       </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
