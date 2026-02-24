import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';

interface Product {
  _id: string;
  name: string;
  price: number;
  image?: string;
  images?: string[];
  category: string;
}

interface Blog {
  _id: string;
  title: string;
  content: string;
  image?: string;
  createdAt: string;
}

interface Carousel {
  _id: string;
  title: string;
  image: string;
  link?: string;
}

export const Home = () => {
  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const [hotProducts, setHotProducts] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [hotPosts, setHotPosts] = useState<Blog[]>([]);
  const [latestPosts, setLatestPosts] = useState<Blog[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // Fetch data from API
    fetchHomeData();
  }, []);

  useEffect(() => {
    if (carousels.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % carousels.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [carousels.length]);

  const fetchHomeData = async () => {
    try {
      // Mock data - replace with actual API calls
      setCarousels([
        { _id: '1', title: 'Welcome to Our Store', image: 'https://via.placeholder.com/1200x400', link: '/products' },
        { _id: '2', title: 'New Arrivals', image: 'https://via.placeholder.com/1200x400', link: '/products/latest' },
      ]);

      setHotProducts([
        { _id: '1', name: 'Hot Product 1', price: 99.99, category: 'Electronics', images: ['https://via.placeholder.com/300'] },
        { _id: '2', name: 'Hot Product 2', price: 149.99, category: 'Fashion', images: ['https://via.placeholder.com/300'] },
        { _id: '3', name: 'Hot Product 3', price: 79.99, category: 'Home', images: ['https://via.placeholder.com/300'] },
        { _id: '4', name: 'Hot Product 4', price: 199.99, category: 'Sports', images: ['https://via.placeholder.com/300'] },
      ]);

      setLatestProducts([
        { _id: '5', name: 'Latest Product 1', price: 89.99, category: 'Electronics', images: ['https://via.placeholder.com/300'] },
        { _id: '6', name: 'Latest Product 2', price: 129.99, category: 'Fashion', images: ['https://via.placeholder.com/300'] },
        { _id: '7', name: 'Latest Product 3', price: 69.99, category: 'Home', images: ['https://via.placeholder.com/300'] },
        { _id: '8', name: 'Latest Product 4', price: 179.99, category: 'Sports', images: ['https://via.placeholder.com/300'] },
      ]);

      setRecommendedProducts([
        { _id: '9', name: 'Recommended 1', price: 119.99, category: 'Electronics', images: ['https://via.placeholder.com/300'] },
        { _id: '10', name: 'Recommended 2', price: 159.99, category: 'Fashion', images: ['https://via.placeholder.com/300'] },
        { _id: '11', name: 'Recommended 3', price: 99.99, category: 'Home', images: ['https://via.placeholder.com/300'] },
        { _id: '12', name: 'Recommended 4', price: 209.99, category: 'Sports', images: ['https://via.placeholder.com/300'] },
      ]);

      setHotPosts([
        { _id: '1', title: 'Hot Post 1', content: 'This is a hot post...', image: 'https://via.placeholder.com/400x250', createdAt: new Date().toISOString() },
        { _id: '2', title: 'Hot Post 2', content: 'Another hot post...', image: 'https://via.placeholder.com/400x250', createdAt: new Date().toISOString() },
      ]);

      setLatestPosts([
        { _id: '3', title: 'Latest Post 1', content: 'This is the latest post...', image: 'https://via.placeholder.com/400x250', createdAt: new Date().toISOString() },
        { _id: '4', title: 'Latest Post 2', content: 'Another latest post...', image: 'https://via.placeholder.com/400x250', createdAt: new Date().toISOString() },
      ]);
    } catch (error) {
      console.error('Error fetching home data:', error);
    }
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <div className="aspect-square bg-gray-700 flex items-center justify-center">
        <img 
          src={product.images?.[0] || 'https://via.placeholder.com/300'} 
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <p className="text-xs text-blue-400 mb-1">{product.category}</p>
        <h3 className="text-white font-semibold mb-2 truncate">{product.name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-blue-400">${product.price}</span>
          <Button size="small">Add to Cart</Button>
        </div>
      </div>
    </div>
  );

  const BlogCard = ({ blog }: { blog: Blog }) => (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
      <div className="h-48 bg-gray-700">
        <img 
          src={blog.image || 'https://via.placeholder.com/400x250'} 
          alt={blog.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-white font-semibold mb-2 line-clamp-2">{blog.title}</h3>
        <p className="text-gray-400 text-sm line-clamp-3 mb-3">{blog.content}</p>
        <Link to={`/blogs/${blog._id}`} className="text-blue-400 hover:text-blue-300 text-sm font-medium">
          Read More →
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Carousel */}
      {carousels.length > 0 && (
        <div className="relative h-96 overflow-hidden">
          {carousels.map((carousel, index) => (
            <div
              key={carousel._id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img 
                src={carousel.image} 
                alt={carousel.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-5xl font-bold mb-4">{carousel.title}</h2>
                  {carousel.link && (
                    <Link to={carousel.link}>
                      <Button>Shop Now</Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {carousels.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition ${
                  index === currentSlide ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* Hot Products */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">🔥 Hot Products</h2>
            <Link to="/products?filter=hot" className="text-blue-400 hover:text-blue-300">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {hotProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>

        {/* Latest Products */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">✨ Latest Products</h2>
            <Link to="/products?filter=latest" className="text-blue-400 hover:text-blue-300">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>

        {/* Recommended Products */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">💎 Recommended For You</h2>
            <Link to="/products?filter=recommended" className="text-blue-400 hover:text-blue-300">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>

        {/* Hot Posts */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">📰 Hot Posts</h2>
            <Link to="/blogs?filter=hot" className="text-blue-400 hover:text-blue-300">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hotPosts.map(blog => (
              <BlogCard key={blog._id} blog={blog} />
            ))}
          </div>
        </section>

        {/* Latest Posts */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">📝 Latest Posts</h2>
            <Link to="/blogs" className="text-blue-400 hover:text-blue-300">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {latestPosts.map(blog => (
              <BlogCard key={blog._id} blog={blog} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
