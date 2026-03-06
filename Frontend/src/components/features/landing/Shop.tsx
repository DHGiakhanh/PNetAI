export default function Shop() {
  const products = [
    {
      name: "Squeaky Dino Toy",
      price: "$12.99",
      image: "https://app.banani.co/image-fallback.png",
    },
    {
      name: "Organic Salmon Bites",
      price: "$8.50",
      image: "https://app.banani.co/image-fallback.png",
    },
    {
      name: "Mint Walk Harness",
      price: "$24.00",
      image: "https://app.banani.co/image-fallback.png",
    },
    {
      name: "Ceramic Paw Bowl",
      price: "$18.50",
      image:
        "https://storage.googleapis.com/banani-generated-images/generated-images/ee73e9dc-fba3-4389-92bd-63e7cae85c3d.jpg",
    },
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <h2>Paw-picked goodies 🎾</h2>
          <p>
            Discover premium treats, stylish accessories, and comfy beds chosen
            by our community.
          </p>
        </div>

        <div className="shop-grid-small">
          {products.map((product, index) => (
            <div key={index} className="shop-card-small">
              <img src={product.image} />
              <h4>{product.name}</h4>
              <div className="price">{product.price}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}