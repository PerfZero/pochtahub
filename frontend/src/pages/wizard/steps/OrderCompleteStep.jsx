import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { encodeInviteData } from "../../../utils/recipientInvite";
import { ordersAPI } from "../../../api";

function OrderCompleteStep({ wizardData: wizardDataProp = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [copySuccess, setCopySuccess] = useState(false);
  const [shortLink, setShortLink] = useState("");
  const [smsStatus, setSmsStatus] = useState("idle");
  const [inviteToken, setInviteToken] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("unknown");
  const inviteSentRef = useRef(false);
  const wizardData = wizardDataProp || location.state?.wizardData || {};

  const invitePayload = useMemo(() => {
    if (typeof window === "undefined") return null;

    const senderPhone =
      wizardData.contactPhone || wizardData.senderPhone || wizardData.userPhone;
    const senderName =
      wizardData.pickupSenderName ||
      wizardData.senderFIO ||
      wizardData.senderName;

    const invitePayload = {
      fromCity: wizardData.fromCity,
      toCity: wizardData.toCity,
      weight: wizardData.weight || "1",
      length: wizardData.length || "0",
      width: wizardData.width || "0",
      height: wizardData.height || "0",
      packageOption: wizardData.packageOption || null,
      selectedSize: wizardData.selectedSize || null,
      estimatedValue: wizardData.estimatedValue || null,
      photoUrl: wizardData.photoUrl || null,
      pickupAddress: wizardData.pickupAddress || wizardData.senderAddress,
      senderAddress: wizardData.pickupAddress || wizardData.senderAddress,
      pickupSenderName: senderName || null,
      senderFIO: senderName || null,
      senderName: senderName || null,
      senderPhone: senderPhone || null,
      recipientPhone: wizardData.recipientPhone || null,
      filterCourierPickup: wizardData.filterCourierPickup,
      filterCourierDelivery: wizardData.filterCourierDelivery,
      needsPackaging: wizardData.needsPackaging === true,
      selectedRole: "recipient",
      paymentPayer: "me",
      inviteRecipient: true,
    };
    return invitePayload;
  }, [wizardData]);

  const inviteLink = useMemo(() => {
    if (shortLink) return shortLink;
    if (!invitePayload || typeof window === "undefined") return "";
    const encoded = encodeInviteData(invitePayload);
    if (!encoded) return "";
    return `${window.location.origin}/recipient?data=${encoded}`;
  }, [invitePayload, shortLink]);

  const showInviteLink = Boolean(inviteLink);

  useEffect(() => {
    let isMounted = true;
    if (!invitePayload) return () => {};
    if (inviteToken) return () => {};

    ordersAPI
      .createInviteLink(invitePayload)
      .then((response) => {
        const url = response?.data?.short_url;
        const token = response?.data?.token;
        if (isMounted && url) {
          setShortLink(url);
        }
        if (isMounted && token) {
          setInviteToken(token);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [invitePayload, inviteToken]);

  useEffect(() => {
    let isMounted = true;
    if (!invitePayload) return () => {};
    if (!inviteToken) return () => {};
    if (inviteSentRef.current) return () => {};
    inviteSentRef.current = true;

    const phone = invitePayload.recipientPhone;
    if (!phone) {
      setSmsStatus("failed");
      return () => {
        isMounted = false;
      };
    }

    setSmsStatus("sending");
    ordersAPI
      .sendInviteSms(phone, invitePayload, inviteToken)
      .then((response) => {
        const url = response?.data?.short_url;
        if (isMounted && url) {
          setShortLink(url);
        }
        if (isMounted) {
          setSmsStatus("sent");
        }
      })
      .catch((error) => {
        const url = error?.response?.data?.short_url;
        if (isMounted && url) {
          setShortLink(url);
        }
        if (isMounted) {
          setSmsStatus("failed");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [invitePayload, inviteToken]);

  useEffect(() => {
    if (!inviteToken || smsStatus !== "sent") return;
    let attempts = 0;
    const intervalId = setInterval(() => {
      attempts += 1;
      ordersAPI
        .getInviteStatus(inviteToken)
        .then((response) => {
          const status = response?.data?.status;
          if (status) {
            setDeliveryStatus(status);
          }
          if (status === "delivered") {
            clearInterval(intervalId);
          }
          if (["undeliverable", "expired"].includes(status)) {
            clearInterval(intervalId);
          }
        })
        .catch(() => {});

      if (attempts >= 6) {
        clearInterval(intervalId);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [inviteToken, smsStatus]);

  useEffect(() => {
    if (!invitePayload || shortLink || !inviteToken) return;
    if (typeof window !== "undefined") {
      setShortLink(`${window.location.origin}/o/${inviteToken}`);
    }
  }, [invitePayload, shortLink, inviteToken]);

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (error) {
      console.error("Ошибка копирования ссылки:", error);
    }
  };

  return (
    <div className="mb-8">
      <div className="text-center mb-6 md:mb-8">
        <div className="text-4xl md:text-6xl mb-3 md:mb-4">👍</div>
        <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-3 md:mb-4 px-2">
          Готово 👍 Отправление создано
        </h1>
        <p className="text-sm md:text-base text-[#2D2D2D] mb-4 px-2">
          Мы отправили получателю приглашение. Он сам укажет адрес доставки,
          выберет способ доставки и оплатит доставку. Курьер приедет за посылкой
          к вам — мы сообщим время.
        </p>
        <div className="bg-white rounded-2xl border border-[#E5E5E5] px-4 md:px-6 py-5 md:py-6 mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 text-[#2D2D2D]">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-[#F0F7FF] text-2xl flex items-center justify-center">
                🧭
              </div>
              <p className="text-sm md:text-base font-semibold text-center">
                Получатель выбирает
              </p>
            </div>
            <div className="text-xl text-[#C8C7CC] hidden md:block">→</div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-[#F0F7FF] text-2xl flex items-center justify-center">
                💳
              </div>
              <p className="text-sm md:text-base font-semibold text-center">
                Оплачивает
              </p>
            </div>
            <div className="text-xl text-[#C8C7CC] hidden md:block">→</div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-[#F0F7FF] text-2xl flex items-center justify-center">
                🚚
              </div>
              <p className="text-sm md:text-base font-semibold text-center">
                Курьер забирает
              </p>
            </div>
          </div>
        </div>
        {showInviteLink && (
          <div className="bg-white rounded-2xl border border-[#E5E5E5] p-4 md:p-6 text-left mb-6 md:mb-8">
            <p className="text-sm md:text-base text-[#2D2D2D] mb-3">
              {smsStatus === "failed" ||
              ["undeliverable", "expired"].includes(deliveryStatus)
                ? "Не удалось отправить SMS. Скопируйте ссылку и отправьте вручную."
                : "Если сообщение не дошло — отправьте ссылку вручную."}
            </p>
            <p className="text-xs md:text-sm text-[#858585] mb-4">
              Статус SMS:{" "}
              <span className="text-[#2D2D2D] font-semibold">
                {smsStatus === "sending"
                  ? "Отправляем"
                  : smsStatus === "failed"
                    ? "Не отправлено"
                    : deliveryStatus === "delivered"
                      ? "Доставлено"
                      : ["undeliverable", "expired"].includes(deliveryStatus)
                        ? "Не доставлено"
                        : deliveryStatus === "unknown"
                          ? "Статус неизвестен"
                          : "Отправлено"}
              </span>
            </p>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-4 py-3 border border-[#E5E5E5] rounded-xl text-sm md:text-base text-[#2D2D2D] bg-[#F9F9F9]"
              />
              <button
                onClick={handleCopyLink}
                className="bg-[#0077FE] text-white px-5 py-3 rounded-xl text-sm md:text-base font-semibold hover:bg-[#0066CC] transition-colors"
              >
                {copySuccess ? "Скопировано" : "Скопировать ссылку"}
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => {
            if (
              typeof window !== "undefined" &&
              typeof window.ym === "function"
            ) {
              window.ym(104664178, "params", {
                offers: "отправитель_передал_заказ!",
              });
            }
            navigate("/cabinet");
          }}
          className="bg-[#0077FE] text-white px-6 md:px-8 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold hover:bg-[#0066CC] transition-colors"
        >
          Понятно
        </button>
      </div>
    </div>
  );
}

export default OrderCompleteStep;
