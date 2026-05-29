import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";



export default function BlogDetailPage() {
  const { blogId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (blogId) {
      navigate(`/feeds?postId=${blogId}`, { replace: true });
    } else {
      navigate("/feeds", { replace: true });
    }
  }, [blogId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCF9F5]">
       <Loader2 className="w-12 h-12 animate-spin text-caramel" />
    </div>
  );
}
