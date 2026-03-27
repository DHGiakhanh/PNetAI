import { MessageSquare } from "lucide-react";

export default function AIVet() {
  return (
    <section className="py-24 bg-[#fafcff]">

      <div className="max-w-6xl mx-auto px-6">

        <div className="bg-[#F2D6DF] rounded-[48px] p-16 grid md:grid-cols-2 gap-10 items-center">

          {/* Image */}
          <div className="flex justify-center">

            <div className="bg-[#9CCFB7] p-6 rounded-full">

              <img
                src="https://images.unsplash.com/photo-1583511655826-05700d52f4d9"
                className="w-72 h-72 object-cover rounded-full"
              />

            </div>

          </div>

          {/* Text */}
          <div>

            <h2 className="text-4xl font-bold text-[#5B2A3C] leading-tight">
              Meet your new AI Vet Assistant 🤖🩺
            </h2>

            <p className="text-[#5B2A3C]/80 mt-6 leading-relaxed max-w-md">
              Got a quick question about diet or a midnight worry? Our friendly
              AI Vet is here 24/7 to provide personalized, instant advice based
              on your pet's health profile.
            </p>

            <button className="flex items-center gap-2 mt-8 bg-[#5B2A3C] text-white px-6 py-3 rounded-full hover:opacity-90 transition">

              <MessageSquare size={18} />

              Ask the AI Vet

            </button>

          </div>

        </div>

      </div>

    </section>
  );
}