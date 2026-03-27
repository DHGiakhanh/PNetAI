import { Outlet, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function ServiceBookingLayout() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#fbfaf7]">
      <header className="sticky top-0 z-50 bg-[#fbfaf7]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>
          <h1 className="text-lg font-extrabold text-slate-900">
            Book Appointment
          </h1>
        </div>
      </header>

      <Outlet />
    </div>
  );
}

