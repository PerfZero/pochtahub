import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logoSvg from "../assets/whitelogo.svg";
import ContactPhoneStep from "./wizard/steps/ContactPhoneStep";
import RecipientAddressStep from "./wizard/steps/RecipientAddressStep";
import { useWizardAuth } from "../hooks/useWizardAuth";
import { decodeInviteData } from "../utils/recipientInvite";

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
  return path;
};

const maskPhone = (phone) => {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  const masked = digits.replace(/\d(?=\d{2})/g, "*");
  return `+${masked}`;
};

function RecipientInvitePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useWizardAuth();

  const [inviteData, setInviteData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [step, setStep] = useState("auth");

  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [recipientFIO, setRecipientFIO] = useState("");
  const [recipientFioFocused, setRecipientFioFocused] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const encoded = params.get("data");
    const decoded = decodeInviteData(encoded);
    if (!decoded) {
      setLoadError("Ссылка на отправление недействительна или устарела.");
      return;
    }
    setInviteData(decoded);
    setRecipientPhone(decoded.recipientPhone || "");
  }, [location.search]);

  const phoneLocked = useMemo(() => {
    return Boolean(inviteData?.recipientPhone);
  }, [inviteData]);

  const handleVerifyCode = async (code) => {
    const success = await auth.handleVerifyCode(recipientPhone, code);
    if (success) {
      setStep("address");
    }
  };

  const handleResendCode = async () => {
    if (!recipientPhone) return;
    await auth.handleSendCode(recipientPhone, "telegram");
  };

  const handleAddressContinue = () => {
    if (!inviteData?.fromCity || !inviteData?.toCity) {
      setLoadError("В данных отправления отсутствуют города маршрута.");
      return;
    }

    const senderName =
      inviteData.pickupSenderName ||
      inviteData.senderFIO ||
      inviteData.senderName ||
      "";
    const senderPhone = inviteData.senderPhone || inviteData.contactPhone || "";
    const senderAddress =
      inviteData.pickupAddress ||
      inviteData.senderAddress ||
      inviteData.fromCity;

    const wizardData = {
      fromCity: inviteData.fromCity,
      toCity: inviteData.toCity,
      weight: inviteData.weight || "1",
      length: inviteData.length || "0",
      width: inviteData.width || "0",
      height: inviteData.height || "0",
      packageOption: inviteData.packageOption || null,
      selectedSize: inviteData.selectedSize || null,
      estimatedValue: inviteData.estimatedValue || null,
      photoUrl: inviteData.photoUrl || null,
      pickupAddress: senderAddress,
      senderAddress: senderAddress,
      pickupSenderName: senderName || null,
      senderFIO: senderName || null,
      senderName: senderName || null,
      senderPhone: senderPhone || null,
      recipientPhone: recipientPhone,
      recipientUserPhone: recipientPhone,
      contactPhone: recipientPhone,
      recipientAddress: recipientAddress,
      deliveryAddress: recipientAddress,
      recipientFIO: recipientFIO,
      selectedRole: "recipient",
      paymentPayer: "me",
      filterCourierPickup:
        inviteData.filterCourierPickup !== undefined
          ? inviteData.filterCourierPickup
          : true,
      filterCourierDelivery:
        inviteData.filterCourierDelivery !== undefined
          ? inviteData.filterCourierDelivery
          : false,
      needsPackaging: inviteData.needsPackaging === true,
      inviteRecipient: true,
    };

    navigate("/offers", { state: { wizardData } });
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-[520px] w-full">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-[#2D2D2D] mb-3">
            Не удалось открыть отправление
          </h1>
          <p className="text-sm text-[#858585] mb-6">{loadError}</p>
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

  const photoUrl = getMediaUrl(inviteData?.photoUrl || "");
  const dimensions = inviteData
    ? `${inviteData.length || "—"} × ${inviteData.width || "—"} × ${inviteData.height || "—"} см`
    : "";
  const weight = inviteData?.weight ? `${inviteData.weight} кг` : "—";

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="w-full bg-[#0077FE] flex flex-col items-center px-4 md:px-6 py-4 md:py-6 gap-4 md:gap-6">
        <Link to="/calculate">
          <img src={logoSvg} alt="PochtaHub" className="h-6 md:h-8" />
        </Link>
      </header>

      <main className="flex justify-center pt-10 pb-12 px-4">
        <div className="w-full max-w-[720px]">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0077FE] text-white flex items-center justify-center text-xl font-bold">
                PH
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#2D2D2D] mb-2">
                  Для вас подготовлено отправление
                </h1>
                <p className="text-sm md:text-base text-[#858585]">
                  Отправитель уже оформил посылку в PochtaHub. Осталось выбрать
                  доставку и оплатить.
                </p>
              </div>
            </div>
          </div>

          {inviteData && (
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-[#2D2D2D] mb-4">
                Данные отправления
              </h2>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-3 text-sm md:text-base text-[#2D2D2D]">
                  <p>
                    <strong>Отправитель:</strong>{" "}
                    {inviteData.pickupSenderName ||
                      inviteData.senderFIO ||
                      inviteData.senderName ||
                      "—"}
                  </p>
                  <p>
                    <strong>Телефон:</strong>{" "}
                    {inviteData.senderPhone || inviteData.contactPhone
                      ? maskPhone(
                          inviteData.senderPhone || inviteData.contactPhone,
                        )
                      : "—"}
                  </p>
                  <p>
                    <strong>Город отправления:</strong>{" "}
                    {inviteData.fromCity || "—"}
                  </p>
                  <p>
                    <strong>Город назначения:</strong>{" "}
                    {inviteData.toCity || "—"}
                  </p>
                  <p>
                    <strong>Габариты:</strong> {dimensions}
                  </p>
                  <p>
                    <strong>Вес:</strong> {weight}
                  </p>
                </div>
                {photoUrl && (
                  <div className="w-full md:w-[200px]">
                    <img
                      src={photoUrl}
                      alt="Посылка"
                      className="w-full h-[140px] object-cover rounded-xl border border-[#E5E5E5]"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
            {step === "auth" ? (
              <ContactPhoneStep
                phone={recipientPhone}
                onPhoneChange={(e) => setRecipientPhone(e.target.value)}
                auth={auth}
                selectedRole="recipient"
                title="Подтвердите телефон в Telegram"
                description="Отправим код в Telegram, чтобы открыть отправление."
                onVerifyCode={handleVerifyCode}
                onResendCode={handleResendCode}
                phoneLocked={phoneLocked}
                onSendCode={(method) =>
                  auth.handleSendCode(recipientPhone, method)
                }
              />
            ) : (
              <RecipientAddressStep
                recipientAddress={recipientAddress}
                onRecipientAddressChange={(e) =>
                  setRecipientAddress(e.target.value)
                }
                recipientFIO={recipientFIO}
                onRecipientFIOChange={(e) => setRecipientFIO(e.target.value)}
                recipientFioFocused={recipientFioFocused}
                onRecipientFioFocus={() => setRecipientFioFocused(true)}
                onRecipientFioBlur={() => setRecipientFioFocused(false)}
                toCity={inviteData?.toCity || ""}
                onContinue={handleAddressContinue}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default RecipientInvitePage;
