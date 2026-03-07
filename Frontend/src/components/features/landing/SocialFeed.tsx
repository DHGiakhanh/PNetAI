import { Heart, MessageCircle } from "lucide-react";

export default function SocialFeed() {
  const posts = [
    {
      user: "Buster & Sarah",
      info: "Golden Retriever • 2h ago",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      caption: "Best day at the park! Buster finally caught the frisbee 🐾✨",
      img: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d",
      likes: 124,
      comments: 12,
      rotate: "-rotate-3"
    },
    {
      user: "Princess Peach",
      info: "Calico Cat • 4h ago",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
      caption: "Current mood 💤 Do not disturb until dinner time.",
      img: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131",
      likes: 89,
      comments: 5,
      rotate: "rotate-1"
    },
    {
      user: "Frankie's Dad",
      info: "French Bulldog • 5h ago",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      caption: "Ready for sweater weather! How does he look? 🍂🐶",
      img: "https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8",
      likes: 210,
      comments: 34,
      rotate: "rotate-3"
    }
  ];

  return (
    <section className="py-24 bg-[#fafcff]">

      <div className="max-w-6xl mx-auto px-6">

        <div className="bg-[#8DBFCC] rounded-[48px] py-20 px-10 text-center">

          {/* Title */}
          <h2 className="text-4xl font-bold text-white">
            See what pets are up to! 📸
          </h2>

          <p className="text-white/80 mt-4 max-w-xl mx-auto">
            Join the cutest feed on the internet. Share your pet's daily
            adventures, funny moments, and make furry friends.
          </p>

          {/* Cards */}
          <div className=" grid sm:grid-cols-1 md:grid-cols-3 gap-10 mt-16 items-start">

            {posts.map((post, i) => (
              <div
                key={i}
                className={`
                  bg-white p-6 rounded-3xl text-left shadow-lg
                  transform transition duration-300
                  hover:-translate-y-3 hover:shadow-2xl
                  ${post.rotate}
                `}
              >

                {/* User */}
                <div className="flex items-center gap-3 mb-4">

                  <img
                    src={post.avatar}
                    className="w-10 h-10 rounded-full object-cover"
                  />

                  <div>
                    <p className="font-semibold text-gray-800">
                      {post.user}
                    </p>

                    <p className="text-sm text-gray-500">
                      {post.info}
                    </p>
                  </div>

                </div>

                {/* Caption */}
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {post.caption}
                </p>

                {/* Image */}
                <img
                  src={post.img}
                  className="rounded-2xl w-full h-60 object-cover"
                />

                {/* Actions */}
                <div className="flex gap-6 mt-4 text-gray-500">

                  <div className="flex items-center gap-2">
                    <Heart size={18} />
                    {post.likes}
                  </div>

                  <div className="flex items-center gap-2">
                    <MessageCircle size={18} />
                    {post.comments}
                  </div>

                </div>

              </div>
            ))}

          </div>

        </div>

      </div>

    </section>
  );
}