import { ArrowRight } from "lucide-react";

export default function Shop() {
  const products = [
    {
      name: "Squeaky Dino Toy",
      price: "$12.99",
      img: "https://images.unsplash.com/photo-1535294435445-d7249524ef2e?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
      name: "Organic Salmon Bites",
      price: "$8.50",
      img: "https://plus.unsplash.com/premium_photo-1695055513495-8fadd1194039?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
      name: "Mint Walk Harness",
      price: "$24.00",
      img: "https://images.unsplash.com/photo-1733861342772-51f28b30fbb0?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
      name: "Ceramic Paw Bowl",
      price: "$18.50",
      img: "https://images.unsplash.com/photo-1679224106783-c21b1841412a?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    }
  ];

  return (
    <section className="py-24 bg-[#fafcff]">

      <div className="max-w-6xl mx-auto px-6">

        {/* Title */}
        <div className="text-center mb-16">

          <h2 className="text-4xl font-bold text-gray-800">
            Paw-picked goodies 🎾
          </h2>

          <p className="text-gray-500 mt-4 max-w-xl mx-auto">
            Discover premium treats, stylish accessories, and comfy beds
            chosen by our community.
          </p>

        </div>

        {/* Layout */}
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-10 items-start">

          {/* Featured Product */}
          <div className="bg-white rounded-[32px] p-6 shadow-sm">

            <img
              src="https://images.unsplash.com/photo-1541188495357-ad2dc89487f4?q=80&w=1471&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              className="rounded-3xl w-full h-80 object-cover"
            />

            <div className="flex justify-between items-end mt-6">

              <div>

                <h3 className="text-2xl font-semibold text-gray-800">
                  Cloud Pet Bed
                </h3>

                <p className="text-gray-500 mt-2 text-sm">
                  Ultimate comfort for your furry friend. Washable and
                  orthopedic.
                </p>

              </div>

              <div className="bg-pink-100 text-pink-600 px-4 py-2 rounded-full font-semibold">
                $45.00
              </div>

            </div>

          </div>

          {/* Small Products */}
          <div className="grid grid-cols-2 gap-6">

            {products.map((p, i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-3xl shadow-sm hover:shadow-md transition"
              >

                <img
                  src={p.img}
                  className="rounded-2xl w-full h-36 object-cover"
                />

                <h4 className="font-semibold text-gray-800 mt-3">
                  {p.name}
                </h4>

                <p className="text-blue-500 font-semibold text-sm mt-1">
                  {p.price}
                </p>

              </div>
            ))}

          </div>

        </div>

        {/* Button */}
        <div className="text-center mt-14">

          <button className="flex items-center gap-2 mx-auto bg-white px-6 py-3 rounded-full shadow hover:shadow-md transition">
            Browse Full Shop
            <ArrowRight size={18} />
          </button>

        </div>

      </div>

    </section>
  );
}