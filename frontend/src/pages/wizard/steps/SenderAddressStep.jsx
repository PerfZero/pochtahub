import { useState } from "react";
import AddressInput from "../../../components/AddressInput";
import { hasExplicitHouseNumber } from "../../../utils/address";

function SenderAddressStep({
  senderAddress,
  onSenderAddressChange,
  fromCity,
  onContinue,
}) {
  const trimmedAddress = senderAddress?.trim() || "";
  const [hasHouseFromSuggestion, setHasHouseFromSuggestion] = useState(false);
  const hasHouseNumber =
    hasHouseFromSuggestion || hasExplicitHouseNumber(trimmedAddress);
  const isAddressValid = trimmedAddress.length > 0 && hasHouseNumber;
  const isDisabled = !isAddressValid;

  return (
    <div className="mb-8">
      <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
        Откуда забрать посылку?
      </h1>
      <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 text-center px-2">
        Укажите полный адрес отправителя с номером дома
      </p>
      <div className="mb-6">
        <AddressInput
          value={senderAddress}
          onChange={onSenderAddressChange}
          label="Полный адрес отправителя"
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
        onClick={onContinue}
        disabled={isDisabled}
        className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold hover:bg-[#0066CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Продолжить
      </button>
    </div>
  );
}

export default SenderAddressStep;
