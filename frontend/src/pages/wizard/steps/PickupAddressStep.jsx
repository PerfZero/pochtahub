import { useState } from "react";
import AddressInput from "../../../components/AddressInput";
import PhoneInput from "../../../components/PhoneInput";
import { isValidFullName } from "../../../utils/validation";
import { hasExplicitHouseNumber } from "../../../utils/address";

function PickupAddressStep({
  pickupAddress,
  onPickupAddressChange,
  pickupSenderName,
  onPickupSenderNameChange,
  senderPhone,
  onSenderPhoneChange,
  fromCity,
  toCity,
  selectedOffer,
  filterCourierDelivery = false,
  onContinue,
}) {
  const [pickupSenderNameFocused, setPickupSenderNameFocused] = useState(false);
  const [hasHouseFromSuggestion, setHasHouseFromSuggestion] = useState(false);

  const trimmedAddress = pickupAddress?.trim() || "";
  const hasHouseNumber =
    hasHouseFromSuggestion || hasExplicitHouseNumber(trimmedAddress);
  const isAddressValid = trimmedAddress.length > 0 && hasHouseNumber;
  const senderNameTrimmed = pickupSenderName?.trim() || "";
  const isSenderNameValid = isValidFullName(senderNameTrimmed);
  const senderPhoneTrimmed = senderPhone?.trim() || "";
  const isSenderPhoneValid = Boolean(senderPhoneTrimmed);
  const isDisabled =
    !isAddressValid || !isSenderNameValid || !isSenderPhoneValid;
  const route = [fromCity, toCity].filter(Boolean).join(" → ");
  const serviceLine = selectedOffer?.company_name
    ? `${selectedOffer.company_name} · ${
        filterCourierDelivery ? "курьер / курьер" : "курьер / пункт выдачи"
      }`
    : "";
  const priceLine =
    selectedOffer?.price !== undefined && selectedOffer?.price !== null
      ? `${Number(selectedOffer.price).toLocaleString("ru-RU")} ₽`
      : "";

  return (
    <div className="mb-8">
      <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
        Кто передаст посылку курьеру?
      </h1>
      <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 text-center px-2">
        Курьер свяжется, чтобы забрать посылку
      </p>

      {selectedOffer && (
        <div className="mb-6 bg-[#F8FAFF] border border-[#DCE8FF] rounded-xl p-4">
          <div className="space-y-2 text-xs md:text-sm text-[#2D2D2D]">
            {route && (
              <p>
                <span className="text-[#858585]">📍 Маршрут:</span> {route}
              </p>
            )}
            {serviceLine && (
              <p>
                <span className="text-[#858585]">📦 Служба доставки:</span>{" "}
                {serviceLine}
              </p>
            )}
            {priceLine && (
              <p>
                <span className="text-[#858585]">💳 Стоимость:</span>{" "}
                {priceLine}{" "}
                <span className="text-[#858585]">· Цена зафиксирована</span>
              </p>
            )}
            <p>
              <span className="text-[#858585]">🚚 Забор посылки:</span> Курьер
              заберёт по адресу отправителя
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="relative">
          <div
            className={`relative border rounded-xl ${
              pickupSenderNameFocused ? "border-[#0077FE]" : "border-[#C8C7CC]"
            }`}
          >
            <input
              type="text"
              value={pickupSenderName}
              onChange={onPickupSenderNameChange}
              onFocus={() => setPickupSenderNameFocused(true)}
              onBlur={() => setPickupSenderNameFocused(false)}
              placeholder=" "
              className="w-full px-4 pt-6 pb-2 border-0 bg-transparent rounded-xl text-base text-[#2D2D2D] focus:outline-none"
            />
            <label
              className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                pickupSenderName || pickupSenderNameFocused
                  ? "top-2 text-xs"
                  : "top-1/2 -translate-y-1/2 text-base"
              } ${pickupSenderNameFocused ? "text-[#0077FE]" : "text-[#858585]"}`}
            >
              ФИО *
            </label>
          </div>
        </div>
        {senderNameTrimmed && !isSenderNameValid && (
          <p className="text-sm text-red-500 mt-2">
            Укажите как минимум имя и фамилию
          </p>
        )}
      </div>

      <div className="mb-6">
        <PhoneInput
          value={senderPhone}
          onChange={onSenderPhoneChange}
          label="Телефон"
        />
      </div>

      <div className="mb-6">
        <AddressInput
          value={pickupAddress}
          onChange={onPickupAddressChange}
          label="Адрес забора"
          required
          city={fromCity}
          onHouseValidation={(hasHouse) => setHasHouseFromSuggestion(hasHouse)}
        />
        {trimmedAddress && !hasHouseNumber && (
          <p className="text-yellow-600 text-sm mt-2">
            Укажите номер дома для более точного адреса
          </p>
        )}
      </div>

      <button
        onClick={() => {
          if (
            typeof window !== "undefined" &&
            typeof window.ym === "function"
          ) {
            window.ym(104664178, "reachGoal", "add_sender");
            window.ym(104664178, "params", { offers: "указал_откуда_забрать" });
          }
          onContinue();
        }}
        disabled={isDisabled}
        className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold hover:bg-[#0066CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Продолжить
      </button>
    </div>
  );
}

export default PickupAddressStep;
