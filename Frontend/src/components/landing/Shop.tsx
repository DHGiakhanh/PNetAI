import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { productService, Product } from "../../services/product.service";
import { formatVnd } from "@/utils/currency";

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProduct, setFeaturedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [hotProducts, latestProducts] = await Promise.all([
        productService.getHotProducts(),
        productService.getLatestProducts()
      ]);
      
      // Use hot products if available, otherwise latest
      const displayProducts = hotProducts.length > 0 ? hotProducts : latestProducts;
      setProducts(displayProducts.slice(0, 4));
      
      // Set featured product (first hot or latest product)
      if (displayProducts.length > 0) {
        setFeaturedProduct(displayProducts[0]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

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
            {loading ? (
              <div className="animate-pulse">
                <div className="rounded-3xl w-full h-80 bg-gray-200"></div>
                <div className="flex justify-between items-end mt-6">
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded-full w-20 ml-4"></div>
                </div>
              </div>
            ) : featuredProduct ? (
              <Link to={`/products/${featuredProduct._id}`}>
                <img
                  src={featuredProduct.images[0] || "https://images.unsplash.com/photo-1541188495357-ad2dc89487f4?q=80&w=1471&auto=format&fit=crop"}
                  className="rounded-3xl w-full h-80 object-cover"
                  alt={featuredProduct.name}
                />

                <div className="flex justify-between items-end mt-6">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-800">
                      {featuredProduct.name}
                    </h3>

                    <p className="text-gray-500 mt-2 text-sm">
                      {featuredProduct.description.length > 80 
                        ? featuredProduct.description.substring(0, 80) + "..."
                        : featuredProduct.description}
                    </p>
                  </div>

                  <div className="bg-pink-100 text-pink-600 px-4 py-2 rounded-full font-semibold">
                    {formatVnd(featuredProduct.price)}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="text-center py-20 text-gray-500">
                No featured products available
              </div>
            )}
          </div>

          {/* Small Products */}
          <div className="grid grid-cols-2 gap-6">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-3xl shadow-sm animate-pulse">
                  <div className="rounded-2xl w-full h-36 bg-gray-200"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mt-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mt-1"></div>
                </div>
              ))
            ) : (
              products.slice(1, 5).map((p) => (
                <Link
                  key={p._id}
                  to={`/products/${p._id}`}
                  className="bg-white p-4 rounded-3xl shadow-sm hover:shadow-md transition"
                >
                  <img
                    src={p.images[0] || "https://images.unsplash.com/photo-1535294435445-d7249524ef2e?q=80&w=400&auto=format&fit=crop"}
                    className="rounded-2xl w-full h-36 object-cover"
                    alt={p.name}
                  />

                  <h4 className="font-semibold text-gray-800 mt-3">
                    {p.name}
                  </h4>

                  <p className="text-blue-500 font-semibold text-sm mt-1">
                    {formatVnd(p.price)}
                  </p>
                </Link>
              ))
            )}
          </div>

        </div>

        {/* Button */}
        <div className="text-center mt-14">
          <Link 
            to="/products"
            className="flex items-center gap-2 mx-auto bg-white px-6 py-3 rounded-full shadow hover:shadow-md transition"
          >
            Browse Full Shop
            <ArrowRight size={18} />
          </Link>
        </div>

      </div>

    </section>
  );
}
