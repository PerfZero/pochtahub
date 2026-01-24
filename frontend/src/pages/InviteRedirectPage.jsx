import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ordersAPI } from "../api";
import { encodeInviteData } from "../utils/recipientInvite";

function InviteRedirectPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Ссылка недействительна.");
      setLoading(false);
      return;
    }

    ordersAPI
      .getInvitePayload(token)
      .then((response) => {
        const payload = response?.data?.payload;
        if (!payload) {
          setError("Ссылка недействительна.");
          return;
        }
        const encoded = encodeInviteData(payload);
        navigate(`/recipient?data=${encoded}`, { replace: true });
      })
      .catch(() => {
        setError("Ссылка недействительна.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-[#F4EEE2] border-t-[#0077FE] rounded-full animate-spin"></div>
          <p className="text-[#2D2D2D]">Открываем отправление...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-[420px]">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-[#2D2D2D] mb-2">
            Ссылка не найдена
          </h1>
          <p className="text-sm text-[#858585] mb-6">{error}</p>
          <Link
            to="/calculate"
            className="inline-flex items-center justify-center bg-[#0077FE] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#0066CC] transition-colors"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

export default InviteRedirectPage;
