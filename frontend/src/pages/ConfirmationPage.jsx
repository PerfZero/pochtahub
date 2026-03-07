import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ordersAPI, paymentAPI } from "../api";
import logoSvg from "../assets/images/logo.svg";
import iconVerify from "../assets/images/icon-verify.svg";

function ConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [tracking, setTracking] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const hasTrackedOrderGoal = useRef(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  useEffect(() => {
    if (!order || hasTrackedOrderGoal.current) {
      return;
    }
    if (typeof window !== "undefined" && typeof window.ym === "function") {
      window.ym(104664178, "reachGoal", "заказ!");
      hasTrackedOrderGoal.current = true;
    }
  }, [order]);

  const loadOrder = async () => {
    if (!orderId || orderId === "undefined") {
      setLoading(false);
      return;
    }

    try {
      const response = await ordersAPI.getOrder(orderId);
      setOrder(response.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setPaying(true);
    try {
      const response = await paymentAPI.createPayment(orderId);
      const confirmationUrl = response?.data?.confirmation_url;
      if (confirmationUrl) {
        window.location.href = confirmationUrl;
        return;
      }
      await loadOrder();
      alert("Платеж создан, но ссылка на оплату не получена.");
    } catch (error) {
      alert(
        `Ошибка при оплате: ${error.response?.data?.error || error.message}`,
      );
    } finally {
      setPaying(false);
    }
  };

  const handleUpdateStatus = async () => {
    setUpdatingStatus(true);
    try {
      await ordersAPI.updateStatusFromCdek(orderId);
      await loadOrder();
      alert("Статус заказа обновлен!");
    } catch (error) {
      alert(
        `Ошибка обновления статуса: ${error.response?.data?.error || error.message}`,
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const loadTracking = async () => {
    if (!order?.external_order_number && !order?.external_order_uuid) {
      return;
    }
    setLoadingTracking(true);
    try {
      const response = await ordersAPI.getOrderTracking(orderId);
      setTracking(response.data);
    } catch (error) {
    } finally {
      setLoadingTracking(false);
    }
  };

  const handleDownloadDocuments = async () => {
    try {
      const response = await ordersAPI.getOrderDocuments(orderId);
      if (response.data.success && response.data.base64) {
        const byteCharacters = atob(response.data.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `order_${orderId}_cdek.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert("Не удалось получить документы");
      }
    } catch (error) {
      alert(
        `Ошибка получения документов: ${error.response?.data?.error || error.message}`,
      );
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

  const statusSteps = [
    { key: "new", label: "Новый" },
    { key: "pending_payment", label: "Ожидает оплаты" },
    { key: "paid", label: "Оплачен" },
    { key: "in_delivery", label: "В доставке" },
    { key: "completed", label: "Завершен" },
  ];

  const getProgressInfo = (status) => {
    if (status === "cancelled") {
      return {
        currentIndex: -1,
        current: 0,
        total: statusSteps.length,
        remaining: 0,
        cancelled: true,
      };
    }
    const index = statusSteps.findIndex((step) => step.key === status);
    if (index === -1) return null;
    const total = statusSteps.length;
    const current = index + 1;
    const remaining = Math.max(total - current, 0);
    return {
      currentIndex: index,
      current,
      total,
      remaining,
      cancelled: false,
    };
  };

  const getDimensionsText = (orderData) => {
    const length = orderData.length;
    const width = orderData.width;
    const height = orderData.height;
    if (length && width && height) {
      return `${length} × ${width} × ${height} см`;
    }
    return "—";
  };

  const maskPhone = (phone) => {
    if (!phone) return "—";
    const digits = String(phone).replace(/\D/g, "");
    if (digits.length < 2) return phone;
    const last2 = digits.slice(-2);
    return `+7 *** ***-**-${last2}`;
  };

  const maskName = (name) => {
    if (!name) return "—";
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const first = parts[0];
    const lastInitial = parts[parts.length - 1]?.[0]?.toUpperCase();
    return lastInitial ? `${first} ${lastInitial}.` : first;
  };

  const shortenAddress = (address, city) => {
    const cleanCity = city ? String(city).trim() : "";
    const cleanAddress = address ? String(address).trim() : "";
    if (!cleanAddress && !cleanCity) return "—";
    if (!cleanAddress) return cleanCity || "—";
    const maxLen = 12;
    const shortAddress =
      cleanAddress.length > maxLen
        ? `${cleanAddress.slice(0, maxLen)}…`
        : cleanAddress;
    return cleanCity ? `${cleanCity}, ${shortAddress}` : shortAddress;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-[#F4EEE2] border-t-[#0077FE] rounded-full animate-spin"></div>
          <p className="text-[#2D2D2D]">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <header className="w-full flex justify-center items-center p-6 border-b border-[#C8C7CC]">
          <div className="w-full max-w-[1128px] flex items-center gap-6">
            <Link to="/calculate">
              <img src={logoSvg} alt="PochtaHub" className="h-8" />
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-[#2D2D2D] mb-2">
              Заказ не найден
            </h1>
            <Link
              to="/cabinet"
              className="text-[#0077FE] font-semibold hover:underline"
            >
              Вернуться в личный кабинет
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const progressInfo = getProgressInfo(order.status);
  const stepsToRender = progressInfo?.cancelled
    ? [{ key: "cancelled", label: "Отменен", cancelled: true }]
    : statusSteps;

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F9]">
      <header className="w-full bg-white border-b border-[#C8C7CC]">
        <div className="w-full max-w-[1128px] mx-auto flex flex-col md:flex-row md:items-center gap-4 md:gap-6 p-4 sm:p-6">
          <Link to="/">
            <img src={logoSvg} alt="PochtaHub" className="h-8" />
          </Link>
          <div className="flex items-center gap-1">
            <img src={iconVerify} alt="" className="w-6 h-6" />
            <span className="text-xs text-[#2D2D2D]">
              Агрегатор транспортных компаний
            </span>
          </div>
          <div className="md:ml-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
            <Link
              to="/cabinet"
              className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F4EEE2] text-[#2D2D2D] text-center w-full sm:w-auto"
            >
              Личный кабинет
            </Link>
            <Link
              to="/calculate"
              className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#0077FE] text-white text-center w-full sm:w-auto"
            >
              Новый заказ
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[800px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <Link
            to="/cabinet"
            className="text-[#0077FE] text-sm font-medium hover:underline"
          >
            ← Назад к заказам
          </Link>
        </div>

        <div className="bg-white border border-[#C8C7CC] rounded-2xl p-4 sm:p-6 lg:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 pb-6 border-b border-[#C8C7CC]">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#2D2D2D]">
                  Заказ #{order.id}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusStyle(order.status)}`}
                >
                  {getStatusText(order.status)}
                </span>
              </div>
              <p className="text-[#858585]">{order.transport_company_name}</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-2xl sm:text-3xl font-bold text-[#0077FE]">
                {order.total_price || order.price} ₽
              </div>
              {order.external_order_number && (
                <p className="text-sm text-[#858585] mt-1">
                  CDEK: {order.external_order_number}
                </p>
              )}
            </div>
          </div>

          <div className="bg-[#F9F9F9] rounded-xl p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#858585] uppercase tracking-wide">
                Этапы заказа
              </h3>
              {progressInfo && (
                <span className="text-xs text-[#858585]">
                  {progressInfo.cancelled
                    ? "Осталось 0"
                    : `Этап ${progressInfo.current} из ${progressInfo.total} · Осталось ${progressInfo.remaining}`}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              {stepsToRender.map((step, index) => {
                const isCancelled = step.cancelled;
                const isCompleted =
                  !isCancelled && index < (progressInfo?.currentIndex ?? -1);
                const isCurrent =
                  !isCancelled && index === (progressInfo?.currentIndex ?? -1);
                const lineActive =
                  isCancelled || index <= (progressInfo?.currentIndex ?? -1);
                const isLast = index === stepsToRender.length - 1;
                return (
                  <div key={step.key} className="flex items-start gap-4">
                    <div className="flex flex-col items-center shrink-0">
                      {index > 0 && (
                        <div
                          className={`w-1.5 h-5 ${lineActive ? "bg-[#0077FE]" : "bg-[#F4F2F3]"}`}
                        ></div>
                      )}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {isCancelled ? (
                          <>
                            <circle
                              cx="10"
                              cy="10"
                              r="9"
                              fill="#E55353"
                              stroke="#E55353"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M6.5 6.5L13.5 13.5M13.5 6.5L6.5 13.5"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </>
                        ) : isCompleted ? (
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
                        ) : isCurrent ? (
                          <>
                            <circle
                              cx="10"
                              cy="10"
                              r="8"
                              stroke="#0077FE"
                              strokeWidth="2"
                              fill="white"
                            />
                            <circle cx="10" cy="10" r="3" fill="#0077FE" />
                          </>
                        ) : (
                          <circle
                            cx="10"
                            cy="10"
                            r="8"
                            stroke="#C8C7CC"
                            strokeWidth="2"
                            fill="white"
                          />
                        )}
                      </svg>
                      {!isLast && (
                        <div
                          className={`w-1.5 h-5 ${lineActive ? "bg-[#0077FE]" : "bg-[#F4F2F3]"}`}
                        ></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p
                        className={`text-sm font-bold ${isCancelled ? "text-[#E55353]" : "text-[#2D2D2D]"}`}
                      >
                        {step.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div className="bg-[#F9F9F9] rounded-xl p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-[#858585] uppercase tracking-wide mb-4">
                Отправитель
              </h3>
              <div className="flex flex-col gap-2">
                <p className="text-base font-medium text-[#2D2D2D]">
                  {maskName(order.sender_name)}
                </p>
                <p className="text-sm text-[#2D2D2D]">
                  {maskPhone(order.sender_phone)}
                </p>
                <p className="text-sm text-[#858585]">
                  {shortenAddress(order.sender_address, order.sender_city)}
                </p>
              </div>
            </div>

            <div className="bg-[#F9F9F9] rounded-xl p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-[#858585] uppercase tracking-wide mb-4">
                Получатель
              </h3>
              <div className="flex flex-col gap-2">
                <p className="text-base font-medium text-[#2D2D2D]">
                  {maskName(order.recipient_name)}
                </p>
                <p className="text-sm text-[#2D2D2D]">
                  {maskPhone(order.recipient_phone)}
                </p>
                <p className="text-sm text-[#858585]">
                  {shortenAddress(
                    order.recipient_address,
                    order.recipient_city,
                  )}
                </p>
                {order.recipient_delivery_point_code && (
                  <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-[#E5E5E5]">
                    <p className="text-sm font-medium text-[#2D2D2D]">
                      Пункт выдачи
                    </p>
                    {order.recipient_delivery_point_address ? (
                      <p className="text-sm text-[#858585]">
                        {shortenAddress(
                          order.recipient_delivery_point_address,
                          order.recipient_city,
                        )}
                      </p>
                    ) : (
                      <p className="text-sm text-[#858585]">
                        {order.recipient_city || "—"}
                      </p>
                    )}
                    <p className="text-xs text-[#858585]">
                      Код: {order.recipient_delivery_point_code}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#F9F9F9] rounded-xl p-4 sm:p-6 mb-6">
            <h3 className="text-sm font-semibold text-[#858585] uppercase tracking-wide mb-4">
              Посылка
            </h3>
            <div className="flex flex-col gap-2 text-sm text-[#2D2D2D]">
              <p>
                <span className="text-[#858585]">Габариты:</span>{" "}
                {getDimensionsText(order)}
              </p>
              <p>
                <span className="text-[#858585]">Вес:</span>{" "}
                {order.weight ? `${order.weight} кг` : "—"}
              </p>
            </div>
          </div>

          {order.package_image && (
            <div className="mt-6 pt-6 border-t border-[#C8C7CC]">
              <h3 className="text-sm font-semibold text-[#858585] uppercase tracking-wide mb-4">
                Фото посылки
              </h3>
              <div className="flex justify-center">
                <img
                  src={order.package_image}
                  alt="Фото посылки"
                  className="max-w-full h-auto rounded-lg max-h-96 border border-[#C8C7CC] shadow-sm"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-[#C8C7CC] rounded-2xl p-4 sm:p-6 mb-6">
          <h3 className="text-lg font-bold text-[#2D2D2D] mb-4">Действия</h3>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
            {(order.status === "pending_payment" || order.status === "new") && (
              <button
                onClick={handlePayment}
                disabled={paying}
                className="px-6 py-3 rounded-xl text-base font-semibold bg-[#0077FE] text-white disabled:opacity-50 w-full sm:w-auto"
              >
                {paying ? "Обработка..." : "Оплатить заказ"}
              </button>
            )}

            {order.transport_company_name?.toLowerCase().includes("сдэк") && (
              <>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updatingStatus}
                  className="px-6 py-3 rounded-xl text-base font-semibold bg-[#F4EEE2] text-[#2D2D2D] disabled:opacity-50 w-full sm:w-auto"
                >
                  {updatingStatus ? "Обновление..." : "Обновить статус"}
                </button>
                <button
                  onClick={handleDownloadDocuments}
                  className="px-6 py-3 rounded-xl text-base font-semibold bg-[#F4EEE2] text-[#2D2D2D] w-full sm:w-auto"
                >
                  Скачать накладную
                </button>
                <button
                  onClick={loadTracking}
                  disabled={loadingTracking}
                  className="px-6 py-3 rounded-xl text-base font-semibold bg-[#F4EEE2] text-[#2D2D2D] disabled:opacity-50 w-full sm:w-auto"
                >
                  {loadingTracking ? "Загрузка..." : "История статусов"}
                </button>
              </>
            )}
          </div>
        </div>

        {tracking &&
          tracking.tracking_history &&
          tracking.tracking_history.length > 0 && (
            <div className="bg-white border border-[#C8C7CC] rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg font-bold text-[#2D2D2D] mb-4">
                История статусов
              </h3>
              <div className="flex flex-col gap-4">
                {tracking.tracking_history.map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-3 h-3 mt-1.5 rounded-full bg-[#0077FE] shrink-0"></div>
                    <div className="flex-1 pb-4 border-b border-[#C8C7CC] last:border-0">
                      <p className="text-base font-medium text-[#2D2D2D]">
                        {item.status_name}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 mt-1">
                        <span className="text-sm text-[#858585]">
                          {new Date(item.date_time).toLocaleString("ru-RU")}
                        </span>
                        {item.city && (
                          <span className="text-sm text-[#858585]">
                            {item.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </main>

      <footer className="w-full bg-white border-t border-[#C8C7CC]">
        <div className="w-full max-w-[1128px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 px-4 sm:px-6 py-6 sm:py-8">
          <Link to="/calculate">
            <img src={logoSvg} alt="PochtaHub" className="h-6 opacity-50" />
          </Link>
          <span className="text-sm text-[#858585]">© 2025 PochtaHub</span>
        </div>
      </footer>
    </div>
  );
}

export default ConfirmationPage;
