import { useEffect, useMemo, useState } from "react";
import apiClient from "@/utils/api.service";

type Service = {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  partner?: { _id: string; name: string; partnerType?: string; email?: string };
};

type Pet = { _id: string; name: string; species: string };
type Appointment = {
  _id: string;
  owner: { _id: string; name: string };
  partner: { _id: string; name: string };
  pet: Pet;
  service: Service;
  startTime: string;
  endTime: string;
  status: string;
  note?: string;
};

export default function Booking() {
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
  const role = user?.role || "user";

  const [services, setServices] = useState<Service[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);

  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    serviceId: "",
    petId: "",
    scheduledAt: ""
  });

  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [partnerAppointments, setPartnerAppointments] = useState<Appointment[]>([]);

  async function refresh() {
    setLoading(true);
    try {
      const [sRes, pRes, aRes] = await Promise.all([
        apiClient.get("/services"),
        apiClient.get("/pets"),
        apiClient.get("/appointments/me")
      ]);

      setServices(sRes.data?.services || []);
      setPets(pRes.data?.pets || []);
      setMyAppointments(aRes.data?.appointments || []);

      if (role === "partner") {
        const pa = await apiClient.get("/appointments/partner/me");
        setPartnerAppointments(pa.data?.appointments || []);
      } else {
        setPartnerAppointments([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createAppointment = async () => {
    if (!form.serviceId || !form.petId || !form.scheduledAt) return;
    try {
      await apiClient.post("/appointments/book", {
        serviceId: form.serviceId,
        petId: form.petId,
        scheduledAt: form.scheduledAt
      });
      setForm({ serviceId: "", petId: "", scheduledAt: "" });
      await refresh();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || "Failed to book");
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      await apiClient.put(`/appointments/${id}/status`, { status });
      await refresh();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || "Failed to update status");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Services & Booking</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-2xl border border-pink-100 p-4">
          <h2 className="font-semibold mb-3">Book appointment</h2>

          <div className="space-y-3">
            <select
              className="w-full rounded-xl border border-pink-100 p-2"
              value={form.serviceId}
              onChange={(e) => setForm((s) => ({ ...s, serviceId: e.target.value }))}
            >
              <option value="">Select service</option>
              {services.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} • {s.price} • {s.durationMinutes}m
                </option>
              ))}
            </select>

            <select
              className="w-full rounded-xl border border-pink-100 p-2"
              value={form.petId}
              onChange={(e) => setForm((s) => ({ ...s, petId: e.target.value }))}
            >
              <option value="">Select pet</option>
              {pets.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} • {p.species}
                </option>
              ))}
            </select>

            <input
              className="w-full rounded-xl border border-pink-100 p-2"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm((s) => ({ ...s, scheduledAt: e.target.value }))}
            />

            <button
              onClick={createAppointment}
              className="w-full px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-semibold"
            >
              Book
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-pink-100 p-4">
            <h2 className="font-semibold mb-3">My appointments</h2>
            {myAppointments.length === 0 ? (
              <div className="text-sm text-gray-500">No appointments yet.</div>
            ) : (
              <div className="space-y-3">
                {myAppointments.map((a) => (
                  <div key={a._id} className="border border-pink-100 rounded-xl p-3">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <div className="font-medium">{a.service?.name}</div>
                        <div className="text-sm text-gray-500">
                          Pet: {a.pet?.name} • {new Date(a.startTime).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            a.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : a.status === "cancelled"
                              ? "bg-gray-100 text-gray-700"
                              : a.status === "confirmed"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-pink-100 text-pink-700"
                          }`}
                        >
                          {a.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {role === "partner" ? (
            <div className="bg-white rounded-2xl border border-pink-100 p-4">
              <h2 className="font-semibold mb-3">Partner queue</h2>
              {partnerAppointments.length === 0 ? (
                <div className="text-sm text-gray-500">No partner appointments.</div>
              ) : (
                <div className="space-y-3">
                  {partnerAppointments.map((a) => (
                    <div key={a._id} className="border border-pink-100 rounded-xl p-3">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <div className="font-medium">{a.pet?.name} • {a.service?.name}</div>
                          <div className="text-sm text-gray-500">
                            Owner: {a.owner?.name} • {new Date(a.startTime).toLocaleString()}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500">Status</div>
                          <select
                            className="rounded-xl border border-pink-100 p-2"
                            value={a.status}
                            onChange={(e) => updateAppointmentStatus(a._id, e.target.value)}
                          >
                            {["pending", "confirmed", "completed", "cancelled"].map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

