import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ordersAPI, paymentAPI } from "../api";
import PhoneInput from "../components/PhoneInput";
import AddressInput from "../components/AddressInput";
import CityInput from "../components/CityInput";
import DeliveryPointInput from "../components/DeliveryPointInput";
import logoSvg from "../assets/images/logo.svg";
import iconVerify from "../assets/images/icon-verify.svg";
import { isValidFullName } from "../utils/validation";

function OrderPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const orderData = location.state?.orderData || location.state || {};
  const [company, setCompany] = useState(orderData.company || null);
  const [weight, setWeight] = useState(orderData.weight || "");
  const [fromAddress, setFromAddress] = useState(orderData.fromAddress || "");
  const [toAddress, setToAddress] = useState(orderData.toAddress || "");
  const [fromCity, setFromCity] = useState(orderData.fromCity || "");
  const [toCity, setToCity] = useState(orderData.toCity || "");
  const [courierPickup, setCourierPickup] = useState(
    orderData.courier_pickup !== undefined ? orderData.courier_pickup : true,
  );
  const [courierDelivery, setCourierDelivery] = useState(
    orderData.courier_delivery !== undefined
      ? orderData.courier_delivery
      : false,
  );

  useEffect(() => {
    if (location.state?.orderData) {
      const data = location.state.orderData;
      if (data.company) {
        setCompany(data.company);
      }
      if (data.weight) {
        setWeight(data.weight);
      }
      if (data.fromAddress) {
        setFromAddress(data.fromAddress);
      }
      if (data.toAddress) {
        setToAddress(data.toAddress);
      }
      if (data.fromCity) {
        setFromCity(data.fromCity);
      }
      if (data.toCity) {
        setToCity(data.toCity);
      }
      if (data.courier_pickup !== undefined) {
        setCourierPickup(data.courier_pickup);
      }
      if (data.courier_delivery !== undefined) {
        setCourierDelivery(data.courier_delivery);
      }
    }
    if (location.state?.courier_pickup !== undefined) {
      setCourierPickup(location.state.courier_pickup);
    }
    if (location.state?.courier_delivery !== undefined) {
      setCourierDelivery(location.state.courier_delivery);
    }
  }, [location.state]);

  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderAddress, setSenderAddress] = useState(fromAddress);
  const [senderCity, setSenderCity] = useState(fromCity);
  const [senderCompany, setSenderCompany] = useState("");
  const [senderTin, setSenderTin] = useState("");
  const [senderContragentType, setSenderContragentType] = useState("");

  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState(toAddress);
  const [recipientCity, setRecipientCity] = useState(toCity);
  const [recipientDeliveryPointCode, setRecipientDeliveryPointCode] =
    useState("");
  const [senderDeliveryPointCode, setSenderDeliveryPointCode] = useState("");

  const trimmedSenderAddress = (senderAddress || "").trim();
  const trimmedRecipientAddress = (recipientAddress || "").trim();
  const senderHasHouseNumber = /\d/.test(trimmedSenderAddress);
  const recipientHasHouseNumber = /\d/.test(trimmedRecipientAddress);
  const isSenderHouseInvalid = trimmedSenderAddress && !senderHasHouseNumber;
  const isRecipientHouseInvalid =
    trimmedRecipientAddress && !recipientHasHouseNumber;
  const isSenderNameValid = isValidFullName(senderName);
  const isRecipientNameValid = isValidFullName(recipientName);

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const currentCompany = location.state?.orderData?.company || company;
    if (!currentCompany) {
      navigate("/calculate");
      return;
    }
    setCheckingAuth(false);
  }, [location.state, company, navigate]);

  useEffect(() => {
    if (fromAddress) {
      setSenderAddress(fromAddress);
    }
    if (toAddress) {
      setRecipientAddress(toAddress);
    }
    if (fromCity) {
      setSenderCity(fromCity);
    }
    if (toCity) {
      setRecipientCity(toCity);
    }
  }, [fromAddress, toAddress, fromCity, toCity]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const currentCompany = location.state?.orderData?.company || company;
      if (!currentCompany || !currentCompany.company_id) {
        alert("Ошибка: данные компании не найдены");
        setLoading(false);
        return;
      }

      const orderData = {
        sender_name: senderName,
        sender_phone: senderPhone,
        sender_address: senderAddress,
        sender_city: senderCity,
        sender_company: senderCompany || null,
        sender_tin: senderTin || null,
        sender_contragent_type: senderContragentType || null,
        sender_delivery_point_code: senderDeliveryPointCode || null,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        recipient_address: recipientAddress,
        recipient_city: recipientCity,
        recipient_delivery_point_code: recipientDeliveryPointCode || null,
        weight: parseFloat(parseFloat(weight).toFixed(2)),
        transport_company_id: currentCompany.company_id,
        transport_company_name: currentCompany.company_name,
        price: currentCompany.price,
        tariff_code: currentCompany.tariff_code,
        tariff_name: currentCompany.tariff_name,
      };
      const response = await ordersAPI.createOrder(orderData);

      const orderId = response.data?.id || response.data?.pk;

      if (orderId) {
        try {
          const paymentResponse = await paymentAPI.createPayment(orderId);
          const confirmationUrl = paymentResponse?.data?.confirmation_url;
          if (confirmationUrl) {
            window.location.href = confirmationUrl;
            return;
          }
        } catch (paymentError) {
          alert(
            `Ошибка создания платежа: ${paymentError.response?.data?.error || paymentError.message}`,
          );
        }
        navigate(`/confirmation/${orderId}`);
      } else {
        alert("Ошибка: ID заказа не получен");
        setLoading(false);
      }
    } catch (error) {
      alert(
        `Ошибка создания заказа: ${error.response?.data?.detail || error.message}`,
      );
      setLoading(false);
    }
  };

  if (checkingAuth || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-[#F4EEE2] border-t-[#0077FE] rounded-full animate-spin"></div>
          <p className="text-[#2D2D2D]">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F9]">
      <header className="w-full bg-white border-b border-[#C8C7CC]">
        <div className="w-full max-w-[1128px] mx-auto flex items-center gap-6 p-6">
          <Link to="/calculate">
            <img src={logoSvg} alt="PochtaHub" className="h-8" />
          </Link>
          <div className="flex items-center gap-1">
            <img src={iconVerify} alt="" className="w-6 h-6" />
            <span className="text-xs text-[#2D2D2D]">
              Агрегатор транспортных компаний
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link
              to="/cabinet"
              className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F4EEE2] text-[#2D2D2D]"
            >
              Личный кабинет
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1128px] mx-auto px-6 py-8">
        <div className="mb-6">
          <Link
            to="/calculate"
            className="text-[#0077FE] text-sm font-medium hover:underline"
          >
            ← Назад к расчёту
          </Link>
        </div>

        <div className="bg-white border border-[#C8C7CC] rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#2D2D2D] mb-2">
                Оформление заказа
              </h1>
              <p className="text-[#858585]">
                {(location.state?.orderData?.company || company)
                  ?.company_name || ""}{" "}
                {(location.state?.orderData?.company || company)?.tariff_name &&
                  `• ${(location.state?.orderData?.company || company).tariff_name}`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#0077FE]">
                {(location.state?.orderData?.company || company)?.price || 0} ₽
              </div>
              <p className="text-sm text-[#858585]">
                Вес: {location.state?.orderData?.weight || weight} кг
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white border border-[#C8C7CC] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-[#2D2D2D] mb-6">
                Данные отправителя
              </h2>

              <div className="flex flex-col gap-4">
                <div className="relative">
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE] placeholder-transparent"
                    placeholder="ФИО"
                    required
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858585] text-base transition-all duration-200 pointer-events-none peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#0077FE] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs">
                    ФИО отправителя *
                  </label>
                </div>
                {senderName?.trim() && !isSenderNameValid && (
                  <p className="text-red-500 text-sm mt-2">
                    Укажите как минимум имя и фамилию
                  </p>
                )}

                <PhoneInput
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  label="Телефон"
                  required
                />

                <CityInput
                  value={senderCity}
                  onChange={(e) => setSenderCity(e.target.value)}
                  label="Город"
                  required
                />

                <AddressInput
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                  onCityChange={(e) => setSenderCity(e.target.value)}
                  label="Адрес"
                  required
                />
                {isSenderHouseInvalid && (
                  <p className="text-red-500 text-sm mt-2">
                    Укажите номер дома в адресе
                  </p>
                )}

                {!courierPickup &&
                  ((location.state?.orderData?.company || company)
                    ?.company_code === "cdek" ||
                    (
                      location.state?.orderData?.company || company
                    )?.company_name
                      ?.toLowerCase()
                      .includes("cdek")) && (
                    <DeliveryPointInput
                      city={senderCity}
                      transportCompanyId={
                        (location.state?.orderData?.company || company)
                          ?.company_id
                      }
                      value={senderDeliveryPointCode}
                      onChange={(e) => {
                        const value = e?.target?.value || e?.value || "";
                        setSenderDeliveryPointCode(value);
                      }}
                      label="ПВЗ (Пункт выдачи)"
                    />
                  )}

                <div className="relative">
                  <select
                    value={senderContragentType}
                    onChange={(e) => setSenderContragentType(e.target.value)}
                    className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE] bg-white appearance-none"
                  >
                    <option value=""></option>
                    <option value="INDIVIDUAL">Физическое лицо</option>
                    <option value="LEGAL_ENTITY">Юридическое лицо</option>
                  </select>
                  <label
                    className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                      senderContragentType
                        ? "top-3 text-xs text-[#858585]"
                        : "top-1/2 -translate-y-1/2 text-base text-[#858585]"
                    }`}
                  >
                    Тип контрагента
                  </label>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                      <path
                        d="M1 1.5L6 6.5L11 1.5"
                        stroke="#858585"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={senderCompany}
                    onChange={(e) => setSenderCompany(e.target.value)}
                    className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE] placeholder-transparent"
                    placeholder="Название компании"
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858585] text-base transition-all duration-200 pointer-events-none peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#0077FE] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs">
                    Название компании
                  </label>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={senderTin}
                    onChange={(e) => setSenderTin(e.target.value)}
                    className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE] placeholder-transparent"
                    placeholder="ИНН"
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858585] text-base transition-all duration-200 pointer-events-none peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#0077FE] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs">
                    ИНН
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#C8C7CC] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-[#2D2D2D] mb-6">
                Данные получателя
              </h2>

              <div className="flex flex-col gap-4">
                <div className="relative">
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE] placeholder-transparent"
                    placeholder="ФИО"
                    required
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858585] text-base transition-all duration-200 pointer-events-none peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#0077FE] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs">
                    ФИО получателя *
                  </label>
                </div>
                {recipientName?.trim() && !isRecipientNameValid && (
                  <p className="text-red-500 text-sm mt-2">
                    Укажите как минимум имя и фамилию
                  </p>
                )}

                <PhoneInput
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  label="Телефон"
                  required
                />

                <CityInput
                  value={recipientCity}
                  onChange={(e) => setRecipientCity(e.target.value)}
                  label="Город"
                  required
                />

                <AddressInput
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  onCityChange={(e) => setRecipientCity(e.target.value)}
                  label="Адрес"
                  required
                />
                {isRecipientHouseInvalid && (
                  <p className="text-red-500 text-sm mt-2">
                    Укажите номер дома в адресе
                  </p>
                )}

                {!courierDelivery &&
                  ((location.state?.orderData?.company || company)
                    ?.company_code === "cdek" ||
                    (
                      location.state?.orderData?.company || company
                    )?.company_name
                      ?.toLowerCase()
                      .includes("cdek")) && (
                    <DeliveryPointInput
                      city={recipientCity}
                      transportCompanyId={
                        (location.state?.orderData?.company || company)
                          ?.company_id
                      }
                      value={recipientDeliveryPointCode}
                      onChange={(e) => {
                        const value = e?.target?.value || e?.value || "";
                        setRecipientDeliveryPointCode(value);
                      }}
                      label="ПВЗ (Пункт выдачи)"
                    />
                  )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              !isSenderNameValid ||
              !isRecipientNameValid ||
              !trimmedSenderAddress ||
              !senderHasHouseNumber ||
              !trimmedRecipientAddress ||
              !recipientHasHouseNumber
            }
            className="w-full py-4 rounded-xl text-base font-semibold bg-[#0077FE] text-white disabled:opacity-50"
          >
            {loading ? "Создание заказа..." : "Создать заказ"}
          </button>
        </form>
      </main>

      <footer className="w-full bg-white border-t border-[#C8C7CC]">
        <div className="w-full max-w-[1128px] mx-auto flex items-center justify-center gap-6 px-6 py-8">
          <Link to="/calculate">
            <img src={logoSvg} alt="PochtaHub" className="h-6 opacity-50" />
          </Link>
          <span className="text-sm text-[#858585]">© 2025 PochtaHub</span>
        </div>
      </footer>
    </div>
  );
}

export default OrderPage;
