import { useState } from "react";
import AddressInput from "../../../components/AddressInput";
import { hasExplicitHouseNumber } from "../../../utils/address";

function DeliveryAddressStep({
  deliveryAddress,
  onDeliveryAddressChange,
  toCity,
  onContinue,
  error,
}) {
  const [hasHouseFromSuggestion, setHasHouseFromSuggestion] = useState(false);
  const trimmedAddress = deliveryAddress?.trim() || "";
  const hasHouseNumber =
    hasHouseFromSuggestion || hasExplicitHouseNumber(trimmedAddress);
  const isAddressValid = trimmedAddress.length > 0 && hasHouseNumber;
  const isDisabled = !isAddressValid;

  return (
    <div className="mb-8">
      <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
        Куда доставить посылку?
      </h1>
      <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 text-center px-2">
        Укажите точный адрес доставки с номером дома
      </p>
      <div className="mb-6">
        <AddressInput
          value={deliveryAddress}
          onChange={onDeliveryAddressChange}
          label="Адрес"
          city={toCity}
          onHouseValidation={(hasHouse) => setHasHouseFromSuggestion(hasHouse)}
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {trimmedAddress && !hasHouseNumber && !error && (
          <p className="text-yellow-600 text-sm mt-2">
            Укажите номер дома для более точного адреса
          </p>
        )}
      </div>
      <button
        onClick={onContinue}
        disabled={isDisabled}
        className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Продолжить
      </button>
    </div>
  );
}

export default DeliveryAddressStep;
