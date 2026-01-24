import { useState } from "react";
import AddressInput from "../../../components/AddressInput";
import { isValidFullName } from "../../../utils/validation";
import { hasExplicitHouseNumber } from "../../../utils/address";

function RecipientAddressStep({
  recipientAddress,
  onRecipientAddressChange,
  recipientFIO,
  onRecipientFIOChange,
  recipientFioFocused,
  onRecipientFioFocus,
  onRecipientFioBlur,
  toCity,
  onContinue,
}) {
  const trimmedAddress = recipientAddress?.trim() || "";
  const [hasHouseFromSuggestion, setHasHouseFromSuggestion] = useState(false);
  const hasHouseNumber =
    hasHouseFromSuggestion || hasExplicitHouseNumber(trimmedAddress);
  const isAddressValid = trimmedAddress.length > 0 && hasHouseNumber;
  const isFioValid = isValidFullName(recipientFIO);
  const isDisabled = !isAddressValid || !isFioValid;

  return (
    <div className="mb-8">
      <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
        Пожалуйста, укажите адрес получателя и ФИО
      </h1>
      <div className="mb-6">
        <AddressInput
          value={recipientAddress}
          onChange={onRecipientAddressChange}
          label="Адрес"
          city={toCity}
          onHouseValidation={(hasHouse) => setHasHouseFromSuggestion(hasHouse)}
        />
        {trimmedAddress && !hasHouseNumber && (
          <p className="text-yellow-600 text-sm mt-2">
            Укажите номер дома для более точного адреса
          </p>
        )}
      </div>
      <div className="mb-6">
        <div className="relative">
          <div
            className={`relative border rounded-xl ${
              recipientFioFocused ? "border-[#0077FE]" : "border-[#C8C7CC]"
            }`}
          >
            <input
              type="text"
              value={recipientFIO}
              onChange={onRecipientFIOChange}
              onFocus={onRecipientFioFocus}
              onBlur={onRecipientFioBlur}
              placeholder=" "
              className="w-full px-4 pt-6 pb-2 border-0 bg-transparent rounded-xl text-base text-[#2D2D2D] focus:outline-none"
            />
            <label
              className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                recipientFIO || recipientFioFocused
                  ? "top-2 text-xs"
                  : "top-1/2 -translate-y-1/2 text-base"
              } ${recipientFioFocused ? "text-[#0077FE]" : "text-[#858585]"}`}
            >
              ФИО
            </label>
          </div>
        </div>
        {recipientFIO?.trim() && !isFioValid && (
          <p className="text-sm text-red-500 mt-2">
            Укажите как минимум имя и фамилию
          </p>
        )}
      </div>
      <button
        onClick={() => {
          if (
            typeof window !== "undefined" &&
            typeof window.ym === "function"
          ) {
            window.ym(104664178, "params", { offers: "указал_куда_доставить" });
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

export default RecipientAddressStep;
