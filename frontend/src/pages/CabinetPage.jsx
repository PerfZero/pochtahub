import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usersAPI, ordersAPI } from "../api";
import logoSvg from "../assets/whitelogo.svg";

const API_URL = import.meta.env.VITE_API_URL || "/api";
const getMediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/media")) {
    if (API_URL.startsWith("http")) {
      return `${API_URL.replace("/api", "")}${path}`;
    }
    const isLocalDev =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isLocalDev && window.location.port !== "8000") {
      return `http://127.0.0.1:8000${path}`;
    }
    return `${window.location.origin}${path}`;
  }
  if (path.startsWith("company_logos/") || path.includes("company_logos/")) {
    const mediaPath = path.startsWith("/") ? path : `/media/${path}`;
    if (API_URL.startsWith("http")) {
      return `${API_URL.replace("/api", "")}${mediaPath}`;
    }
    const isLocalDev =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isLocalDev && window.location.port !== "8000") {
      return `http://127.0.0.1:8000${mediaPath}`;
    }
    return `${window.location.origin}${mediaPath}`;
  }
  return path;
};

function CabinetPage() {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [orderTracking, setOrderTracking] = useState({});
  const [loadingTracking, setLoadingTracking] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem("access_token");
    const isTestToken = token && token.startsWith("test_");

    if (isTestToken) {
      setProfile({
        username: "test_user",
        email: "test@mail.ru",
        phone: "+79999999999",
        first_name: "",
        last_name: "",
      });
      setOrders([]);
      setEmail("test@mail.ru");
      setPhone("+79999999999");
      setLoading(false);
      return;
    }

    try {
      const [profileRes, ordersRes] = await Promise.all([
        usersAPI.getProfile(),
        ordersAPI.getOrders(),
      ]);
      setProfile(profileRes.data);
      const ordersList = ordersRes.data.results || ordersRes.data || [];
      console.log(
        "Загруженные заказы:",
        ordersList.map((o) => ({
          id: o.id,
          transport_company_name: o.transport_company_name,
          transport_company_logo: o.transport_company_logo,
          transport_company_id: o.transport_company_id,
        })),
      );
      setOrders(ordersList);
      setEmail(profileRes.data.email || "");
      setPhone(profileRes.data.phone || "");
      setFullName(
        [profileRes.data.first_name, profileRes.data.last_name]
          .filter(Boolean)
          .join(" ") || "",
      );
      setAddress(profileRes.data.address || "");
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/calculate");
  };

  const handleSave = async () => {
    const token = localStorage.getItem("access_token");
    const isTestToken = token && token.startsWith("test_");

    if (isTestToken) {
      alert("В тестовом режиме сохранение недоступно");
      return;
    }

    try {
      const nameParts = fullName.split(" ");
      const updateData = {
        first_name: nameParts[0] || "",
        last_name: nameParts.slice(1).join(" ") || "",
        address: address,
      };

      await usersAPI.updateProfile(updateData);
      await loadData();
    } catch (error) {
      console.error("Ошибка сохранения:", error);
      alert("Ошибка сохранения данных");
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      new: "bg-[#FFF3CD] text-[#856404]",
      pending_payment: "bg-[#D1ECF1] text-[#0C5460]",
      paid: "bg-[#D4EDDA] text-[#155724]",
      in_delivery: "bg-[#CCE5FF] text-[#004085]",
      completed: "bg-[#D1F2EB] text-[#00695C]",
      cancelled: "bg-[#F8D7DA] text-[#721C24]",
    };
    return styles[status] || "bg-[#F4EEE2] text-[#2D2D2D]";
  };

  const getStatusText = (status) => {
    const texts = {
      new: "Новый",
      pending_payment: "Ожидает оплаты",
      paid: "Оплачен",
      in_delivery: "В доставке",
      completed: "Завершен",
      cancelled: "Отменен",
    };
    return texts[status] || status;
  };

  const handleCalculate = () => {
    navigate("/calculate");
  };

  const toggleOrder = async (orderId) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
      if (!orderTracking[orderId]) {
        await loadTracking(orderId);
      }
    }
    setExpandedOrders(newExpanded);
  };

  const loadTracking = async (orderId) => {
    const token = localStorage.getItem("access_token");
    const isTestToken = token && token.startsWith("test_");

    if (isTestToken) {
      return;
    }

    setLoadingTracking((prev) => ({ ...prev, [orderId]: true }));
    try {
      const response = await ordersAPI.getOrderTracking(orderId);
      setOrderTracking((prev) => ({ ...prev, [orderId]: response.data }));
    } catch (error) {
      console.error("Ошибка загрузки трекинга:", error);
    } finally {
      setLoadingTracking((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTimeTracking = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("ru-RU", { month: "long" });
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year} г, ${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#0077FE] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#2D2D2D]">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="w-full bg-[#0077FE] flex flex-col items-center px-4 md:px-6 py-4 md:py-6 gap-4 md:gap-6">
        <Link to="/calculate">
          <img src={logoSvg} alt="PochtaHub" className="h-6 md:h-8" />
        </Link>
      </header>

      <div className="flex justify-center pt-6 md:pt-12 pb-8">
        <div className="w-full max-w-[720px] bg-white rounded-2xl p-4 md:p-8 mx-4 md:mx-6">
          <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-6 md:mb-8 text-center px-2">
            Личный кабинет
          </h1>

          <div className="flex gap-2 mb-6 md:mb-8 justify-center">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === "profile"
                  ? "bg-[#0077FE] text-white"
                  : "bg-[#F5F5F5] text-[#2D2D2D]"
              }`}
            >
              Мой профиль
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === "orders"
                  ? "bg-[#0077FE] text-white"
                  : "bg-[#F5F5F5] text-[#2D2D2D]"
              }`}
            >
              Мои доставки
            </button>
          </div>

          {activeTab === "profile" && (
            <div className="space-y-6 md:space-y-8">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-[#2D2D2D] mb-4 md:mb-6">
                  Мой профиль
                </h2>
                <div className="space-y-4 md:space-y-6">
                  <div>
                    <label className="block text-sm text-[#858585] mb-2">
                      ФИО
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE]"
                      placeholder="Введите ФИО"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#858585] mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-4 py-3 border border-[#C8C7CC] rounded-xl text-base text-[#858585] bg-[#F5F5F5] cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#858585] mb-2">
                      Телефон
                    </label>
                    <input
                      type="text"
                      value={phone}
                      disabled
                      className="w-full px-4 py-3 border border-[#C8C7CC] rounded-xl text-base text-[#858585] bg-[#F5F5F5] cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-bold text-[#2D2D2D] mb-4 md:mb-6">
                  Адрес
                </h2>
                <div>
                  <label className="block text-sm text-[#858585] mb-2">
                    Адрес
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 10C11.3807 10 12.5 8.88071 12.5 7.5C12.5 6.11929 11.3807 5 10 5C8.61929 5 7.5 6.11929 7.5 7.5C7.5 8.88071 8.61929 10 10 10Z"
                          stroke="#858585"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M10 17.5C13.3333 14.1667 16.6667 11.5152 16.6667 7.5C16.6667 4.46243 14.2043 2 10 2C5.79566 2 3.33334 4.46243 3.33334 7.5C3.33334 11.5152 6.66667 14.1667 10 17.5Z"
                          stroke="#858585"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE]"
                      placeholder="Введите адрес"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSave}
                className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold hover:bg-[#0066CC] transition-colors"
              >
                Сохранить
              </button>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="flex flex-col gap-4">
              {orders.length === 0 ? (
                <div className="bg-[#F5F5F5] border border-[#C8C7CC] rounded-2xl p-12 text-center">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-xl font-bold text-[#2D2D2D] mb-2">
                    У вас пока нет заказов
                  </h3>
                  <p className="text-[#858585] mb-6">
                    Создайте первый заказ и начните отправлять посылки
                  </p>
                  <Link
                    to="/calculate"
                    className="inline-block px-6 py-4 rounded-xl text-base font-semibold bg-[#0077FE] text-white"
                  >
                    Создать заказ
                  </Link>
                </div>
              ) : (
                orders.map((order) => {
                  const isExpanded = expandedOrders.has(order.id);
                  const tracking = orderTracking[order.id];
                  const trackingLoading = loadingTracking[order.id];

                  const getDeliveryDays = () => {
                    if (order.tariff_name && order.tariff_name.includes("2-3"))
                      return "2-3 дн.";
                    if (order.tariff_name && order.tariff_name.includes("3-5"))
                      return "3-5 дн.";
                    if (order.tariff_name && order.tariff_name.includes("1-2"))
                      return "1-2 дн.";
                    return "2-3 дн.";
                  };

                  const orderNumber =
                    order.external_order_number || `#${order.id}`;
                  const packagingCost = order.packaging_price || 0;
                  const insuranceCost = order.insurance_price || 0;
                  const commission = order.pochtahub_commission || 0;
                  const acquiringCost = order.acquiring_price || 0;
                  const deliveryCost = order.price || 0;
                  const totalPrice =
                    order.total_price ||
                    deliveryCost +
                      packagingCost +
                      insuranceCost +
                      commission +
                      acquiringCost;

                  const logoUrl = order.transport_company_logo
                    ? getMediaUrl(order.transport_company_logo)
                    : null;
                  if (logoUrl) {
                    console.log(
                      `Заказ ${order.id}: логотип = ${order.transport_company_logo}, обработанный URL = ${logoUrl}`,
                    );
                  } else {
                    console.log(
                      `Заказ ${order.id}: transport_company_logo = ${order.transport_company_logo}, transport_company_id = ${order.transport_company_id}`,
                    );
                  }

                  return (
                    <div
                      key={order.id}
                      className="bg-white border border-[#C8C7CC] rounded-2xl overflow-hidden"
                    >
                      <div className="border-b border-[#C8C7CC] mb-[-1px]">
                        <button
                          onClick={() => toggleOrder(order.id)}
                          className="w-full px-4 py-3 flex items-center gap-4 hover:bg-[#F9F9F9] transition-colors text-left"
                        >
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={order.transport_company_name || "ТК"}
                              className="w-10 h-10 object-contain shrink-0"
                              onError={(e) => {
                                console.error(
                                  "Ошибка загрузки логотипа:",
                                  logoUrl,
                                  "Исходный путь:",
                                  order.transport_company_logo,
                                );
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#0C3739] flex items-center justify-center shrink-0 border border-[#ECE9EB]">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M10 2L2 6L10 10L18 6L10 2Z"
                                  stroke="white"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M2 14L10 18L18 14"
                                  stroke="white"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M2 10L10 14L18 10"
                                  stroke="white"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="text-base font-bold text-[#2D2D2D]">
                              {formatDate(order.created_at)}
                            </div>
                            <div className="text-sm text-[#858585]">
                              Отправление {orderNumber}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-base font-bold text-[#2D2D2D]">
                              {totalPrice.toLocaleString("ru-RU")}₽
                            </div>
                            <div className="text-sm text-[#858585]">
                              {getDeliveryDays()}
                            </div>
                          </div>
                          <div className="shrink-0">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className={`transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            >
                              <path
                                d="M6 9L12 15L18 9"
                                stroke="#2D2D2D"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="px-4 py-3">
                          <div className="bg-[#F4F2F3] rounded-xl overflow-hidden">
                            <div className="border-b border-[#C8C7CC] border-dashed">
                              <div className="px-4 py-3 flex justify-between items-center">
                                <span className="text-sm text-[#2D2D2D]">
                                  Транспортная компания
                                </span>
                                <span className="text-sm text-[#2D2D2D]">
                                  {order.transport_company_name || "-"}
                                </span>
                              </div>
                            </div>
                            <div className="border-b border-[#C8C7CC] border-dashed">
                              <div className="px-4 py-3 flex justify-between items-center">
                                <span className="text-sm text-[#2D2D2D]">
                                  Статус оплаты
                                </span>
                                <span
                                  className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusStyle(
                                    order.status,
                                  )}`}
                                >
                                  {getStatusText(order.status)}
                                </span>
                              </div>
                            </div>
                            <div className="border-b border-[#C8C7CC] border-dashed">
                              <div className="px-4 py-3 flex justify-between items-center">
                                <span className="text-sm text-[#2D2D2D]">
                                  Откуда
                                </span>
                                <span className="text-sm text-[#2D2D2D] text-right">
                                  {order.sender_city && order.sender_address
                                    ? `${order.sender_city}, ${order.sender_address}`
                                    : order.sender_address ||
                                      order.sender_city ||
                                      "-"}
                                </span>
                              </div>
                            </div>
                            <div className="border-b border-[#C8C7CC] border-dashed">
                              <div className="px-4 py-3 flex justify-between items-center">
                                <span className="text-sm text-[#2D2D2D]">
                                  Куда
                                </span>
                                <span className="text-sm text-[#2D2D2D] text-right">
                                  {order.recipient_city &&
                                  order.recipient_address
                                    ? `${order.recipient_city}, ${order.recipient_address}`
                                    : order.recipient_address ||
                                      order.recipient_city ||
                                      "-"}
                                </span>
                              </div>
                            </div>
                            <div className="border-b border-[#C8C7CC] border-dashed">
                              <div className="px-4 py-3 flex justify-between items-center">
                                <span className="text-sm text-[#2D2D2D]">
                                  Телефон отправителя
                                </span>
                                <span className="text-sm text-[#2D2D2D]">
                                  {order.sender_phone || "-"}
                                </span>
                              </div>
                            </div>
                            <div className="border-b border-[#C8C7CC] border-dashed">
                              <div className="px-4 py-3 flex justify-between items-center">
                                <span className="text-sm text-[#2D2D2D]">
                                  Телефон получателя
                                </span>
                                <span className="text-sm text-[#2D2D2D]">
                                  {order.recipient_phone || "-"}
                                </span>
                              </div>
                            </div>
                            <div className="border-b border-[#C8C7CC] border-dashed">
                              <div className="px-4 py-3 flex justify-between items-center">
                                <span className="text-sm text-[#2D2D2D]">
                                  Кто оплачивает
                                </span>
                                <span className="text-sm text-[#2D2D2D]">
                                  {order.selected_role === "recipient"
                                    ? "Получатель"
                                    : "Отправитель"}
                                </span>
                              </div>
                            </div>
                            <div className="border-b border-[#C8C7CC] border-dashed">
                              <div className="px-4 py-3 flex justify-between items-center">
                                <span className="text-sm text-[#2D2D2D]">
                                  Габариты посылки
                                </span>
                                <span className="text-sm text-[#2D2D2D] text-right">
                                  {order.length &&
                                  order.width &&
                                  order.height &&
                                  order.weight
                                    ? `${order.length} см × ${order.width} см × ${order.height} см × ${order.weight} кг`
                                    : order.weight
                                      ? `${order.weight} кг`
                                      : "-"}
                                </span>
                              </div>
                            </div>
                            <div className="border-b border-[#C8C7CC] border-dashed">
                              <div className="px-4 py-3 flex justify-between items-center">
                                <span className="text-sm text-[#2D2D2D]">
                                  Стоимость
                                </span>
                                <span className="text-sm text-[#2D2D2D]">
                                  {totalPrice.toLocaleString("ru-RU")}₽
                                </span>
                              </div>
                            </div>
                            <div className="border-b border-[#C8C7CC] border-dashed">
                              <div className="px-4 py-3 flex justify-between items-center">
                                <span className="text-sm text-[#2D2D2D]">
                                  Дата отправления
                                </span>
                                <span className="text-sm text-[#2D2D2D]">
                                  {formatDateTime(order.created_at)}
                                </span>
                              </div>
                            </div>
                            <div className="border-b border-[#C8C7CC] border-dashed">
                              <div className="px-4 py-3 flex justify-between items-center">
                                <span className="text-sm text-[#2D2D2D]">
                                  Дата получения
                                </span>
                                <span className="text-sm text-[#2D2D2D]">
                                  {order.completed_at
                                    ? formatDateTime(order.completed_at)
                                    : "-"}
                                </span>
                              </div>
                            </div>
                            {packagingCost > 0 && (
                              <div className="border-b border-[#C8C7CC] border-dashed">
                                <div className="px-4 py-3 flex justify-between items-center">
                                  <span className="text-sm text-[#2D2D2D]">
                                    Стоимость упаковки
                                  </span>
                                  <span className="text-sm text-[#2D2D2D]">
                                    {packagingCost.toLocaleString("ru-RU")}₽
                                  </span>
                                </div>
                              </div>
                            )}
                            {insuranceCost > 0 && (
                              <div className="border-b border-[#C8C7CC] border-dashed">
                                <div className="px-4 py-3 flex justify-between items-center">
                                  <span className="text-sm text-[#2D2D2D]">
                                    Страховка
                                  </span>
                                  <span className="text-sm text-[#2D2D2D]">
                                    {insuranceCost.toLocaleString("ru-RU")}₽
                                  </span>
                                </div>
                              </div>
                            )}
                            {commission > 0 && (
                              <div className="border-b border-[#C8C7CC] border-dashed">
                                <div className="px-4 py-3 flex justify-between items-center">
                                  <span className="text-sm text-[#2D2D2D]">
                                    Комиссия PochtaHub
                                  </span>
                                  <span className="text-sm text-[#2D2D2D]">
                                    {commission.toLocaleString("ru-RU")}₽
                                  </span>
                                </div>
                              </div>
                            )}
                            {acquiringCost > 0 && (
                              <div className="border-b border-[#C8C7CC] border-dashed">
                                <div className="px-4 py-3 flex justify-between items-center">
                                  <span className="text-sm text-[#2D2D2D]">
                                    Эквайринг
                                  </span>
                                  <span className="text-sm text-[#2D2D2D]">
                                    {acquiringCost.toLocaleString("ru-RU", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                    ₽
                                  </span>
                                </div>
                              </div>
                            )}
                            <div className="border-b border-[#C8C7CC] border-dashed">
                              <div className="px-4 py-3 flex justify-between items-center">
                                <span className="text-sm text-[#2D2D2D]">
                                  Стоимость доставки
                                </span>
                                <span className="text-sm text-[#2D2D2D]">
                                  {deliveryCost.toLocaleString("ru-RU", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                  ₽
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="px-4 py-3 flex justify-between items-center">
                                <span className="text-sm text-[#2D2D2D]">
                                  Итого
                                </span>
                                <span className="text-sm text-[#2D2D2D]">
                                  {totalPrice.toLocaleString("ru-RU", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                  ₽
                                </span>
                              </div>
                            </div>
                          </div>

                          {order.package_image && (
                            <div className="mt-4">
                              <div className="text-sm text-[#858585] mb-2">
                                Фото посылки
                              </div>
                              <img
                                src={order.package_image}
                                alt="Фото посылки"
                                className="max-w-full h-auto rounded-lg border border-[#C8C7CC] max-h-64"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            </div>
                          )}

                          {order.transport_company_name
                            ?.toLowerCase()
                            .includes("сдэк") && (
                            <div className="mt-4">
                              <div className="text-base font-bold text-[#2D2D2D] mb-4">
                                Отслеживание отправления {orderNumber}
                              </div>
                              {trackingLoading ? (
                                <div className="flex items-center justify-center py-8">
                                  <div className="w-8 h-8 border-4 border-[#0077FE] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              ) : tracking?.tracking_history &&
                                tracking.tracking_history.length > 0 ? (
                                <div className="flex flex-col">
                                  {tracking.tracking_history.map(
                                    (item, index) => {
                                      const isLast =
                                        index ===
                                        tracking.tracking_history.length - 1;
                                      const isCompleted = true;
                                      return (
                                        <div
                                          key={index}
                                          className="flex items-start gap-4"
                                        >
                                          <div className="flex flex-col items-center shrink-0">
                                            {index > 0 && (
                                              <div
                                                className={`w-1.5 h-5 ${isCompleted ? "bg-[#0077FE]" : "bg-[#F4F2F3]"}`}
                                              ></div>
                                            )}
                                            <svg
                                              width="20"
                                              height="20"
                                              viewBox="0 0 20 20"
                                              fill="none"
                                              xmlns="http://www.w3.org/2000/svg"
                                            >
                                              {isCompleted ? (
                                                <>
                                                  <circle
                                                    cx="10"
                                                    cy="10"
                                                    r="9"
                                                    fill="#0077FE"
                                                    stroke="#0077FE"
                                                    strokeWidth="1.5"
                                                  />
                                                  <path
                                                    d="M6 10L9 13L14 7"
                                                    stroke="white"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                  />
                                                </>
                                              ) : (
                                                <circle
                                                  cx="10"
                                                  cy="10"
                                                  r="9"
                                                  stroke="#C8C7CC"
                                                  strokeWidth="1.5"
                                                />
                                              )}
                                            </svg>
                                            {!isLast && (
                                              <div
                                                className={`w-1.5 h-5 ${isCompleted ? "bg-[#0077FE]" : "bg-[#F4F2F3]"}`}
                                              ></div>
                                            )}
                                          </div>
                                          <div className="flex-1 pb-4">
                                            <p className="text-sm font-bold text-[#2D2D2D]">
                                              {item.status_name || item.status}
                                            </p>
                                            <p className="text-xs text-[#525252] mt-1">
                                              {formatDateTimeTracking(
                                                item.date_time,
                                              )}
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm text-[#858585] py-4">
                                  История отслеживания пока недоступна
                                </div>
                              )}
                            </div>
                          )}

                          <div className="mt-4 flex flex-col items-center py-2">
                            <div className="text-base font-bold text-[#2D2D2D] mb-2">
                              Есть вопрос по доставке?
                            </div>
                            <button className="text-sm text-[#0077FE]">
                              Написать в поддержку
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          <div className="mt-6 md:mt-8 text-center">
            <button
              onClick={handleLogout}
              className="text-sm text-[#858585] hover:text-[#2D2D2D] transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CabinetPage;
