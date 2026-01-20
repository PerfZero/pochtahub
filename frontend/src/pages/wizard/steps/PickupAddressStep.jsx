import { useState } from "react";
import SeparatedAddressInput from "../../../components/SeparatedAddressInput";

function PickupAddressStep({
  pickupAddress,
  onPickupAddressChange,
  pickupSenderName,
  onPickupSenderNameChange,
  fromCity,
  onContinue,
}) {
  const [pickupSenderNameFocused, setPickupSenderNameFocused] = useState(false);

  // Простая функция для базового разделения адреса (только для ручного ввода)
  const parseAddress = (address) => {
    if (!address) return { street: address || "", house: "", apartment: "" };

    // Если есть запятые, пытаемся разделить
    const parts = address.split(",");

    if (parts.length === 1) {
      // Простая улица без дома и квартиры
      return { street: address.trim(), house: "", apartment: "" };
    }

    // Ищем квартиру
    let apartment = "";
    let streetAndHouse = parts.slice(0, -1).join(",");

    const lastPart = parts[parts.length - 1].trim();
    if (lastPart.match(/^(кв|квартира|офис|оф)\s*/i)) {
      apartment = lastPart.replace(/^(кв|квартира|офис|оф)\s*/i, "").trim();
    } else {
      streetAndHouse = address;
    }

    // Ищем дом в streetAndHouse
    const houseMatch = streetAndHouse.match(
      /,\s*(?:д|дом|влд|владение|стр|строение)\s*([0-9а-яА-Я\/-]+)/i,
    );
    const house = houseMatch ? houseMatch[1] : "";
    const street = houseMatch
      ? streetAndHouse
          .replace(
            /,\s*(?:д|дом|влд|владение|стр|строение)\s*[0-9а-яА-Я\/-]+/i,
            "",
          )
          .trim()
      : streetAndHouse.trim();

    return { street, house, apartment };
  };

  const { street, house, apartment } = parseAddress(pickupAddress);

  const isAddressValid = street.trim();
  const isDisabled = !isAddressValid || !pickupSenderName?.trim();

  const handleStreetChange = (e) => {
    const newStreet = e.target.value;
    const newAddress = `${newStreet}${house ? `, д ${house}` : ""}${apartment ? `, кв ${apartment}` : ""}`;
    onPickupAddressChange({ target: { value: newAddress } });
  };

  const handleHouseChange = (e) => {
    const newHouse = e.target.value;
    const newAddress = `${street}${newHouse ? `, д ${newHouse}` : ""}${apartment ? `, кв ${apartment}` : ""}`;
    onPickupAddressChange({ target: { value: newAddress } });
  };

  const handleApartmentChange = (e) => {
    const newApartment = e.target.value;
    const newAddress = `${street}${house ? `, д ${house}` : ""}${newApartment ? `, кв ${newApartment}` : ""}`;
    onPickupAddressChange({ target: { value: newAddress } });
  };

  return (
    <div className="mb-8">
      <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
        Где забрать посылку?
      </h1>
      <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 text-center px-2">
        Осталось указать адрес, откуда забрать посылку, и имя отправителя —
        чтобы мы могли оформить забор.
      </p>

      <div className="mb-6">
        <SeparatedAddressInput
          street={street}
          house={house}
          apartment={apartment}
          onStreetChange={handleStreetChange}
          onHouseChange={handleHouseChange}
          onApartmentChange={handleApartmentChange}
          label="Адрес забора"
          required
          city={fromCity}
        />
        {street && !house && (
          <p className="text-yellow-600 text-sm mt-2">
            Укажите номер дома для более точного адреса
          </p>
        )}
      </div>

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
              Имя отправителя *
            </label>
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          if (
            typeof window !== "undefined" &&
            typeof window.ym === "function"
          ) {
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
