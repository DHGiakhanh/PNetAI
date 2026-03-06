export default function SocialFeed() {
  const posts = [
    {
      user: "Buster & Sarah",
      caption: "Best day at the park! 🐾✨",
      likes: 124,
      comments: 12,
      image: "https://app.banani.co/image-fallback.png",
    },
    {
      user: "Princess Peach",
      caption: "Current mood 💤 Do not disturb.",
      likes: 89,
      comments: 5,
      image: "https://app.banani.co/image-fallback.png",
    },
    {
      user: "Frankie's Dad",
      caption: "Ready for sweater weather 🍂",
      likes: 210,
      comments: 34,
      image:
        "https://storage.googleapis.com/banani-generated-images/generated-images/d81fa431-9f47-4a3d-882c-06a3933f8def.jpg",
    },
  ];

  return (
    <section className="social-wrapper">
      <div className="container">
        <div className="section-header">
          <h2 style={{ color: "white" }}>See what pets are up to! 📸</h2>
          <p>Join the cutest feed on the internet.</p>
        </div>

        <div className="staggered-grid">
          {posts.map((post, index) => (
            <div key={index} className="post-card">
              <h4>{post.user}</h4>

              <p className="post-caption">{post.caption}</p>

              <img src={post.image} className="post-image" />

              <div className="post-actions">
                ❤️ {post.likes} 💬 {post.comments}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}