import { useState, useCallback, useEffect, useRef } from "react";
import axios from "axios";
import { parseSeparatedAddress } from "../utils/address";

const DADATA_API_URL =
  "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address";
const DADATA_TOKEN = import.meta.env.VITE_DADATA_TOKEN || "";

function SeparatedAddressInput({
  street = "",
  house = "",
  apartment = "",
  onStreetChange,
  onHouseChange,
  onApartmentChange,
  label = "Адрес",
  required = false,
  city = null,
}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const [inputValue, setInputValue] = useState(street);

  const hasValue = inputValue && inputValue.length > 0;
  const isFloating = isFocused || hasValue;

  const removeCityFromAddress = useCallback((address, cityName) => {
    if (!cityName) return address;
    const cityPatterns = [
      new RegExp(`^г\.?\\s*${cityName}[,\\s]`, "i"),
      new RegExp(`^${cityName}[,\\s]`, "i"),
      new RegExp(
        `^г\.?\\s*${cityName.replace(/[а-яё]/gi, "[а-яё]")}[,\\s]`,
        "i",
      ),
    ];
    let result = address;
    for (const pattern of cityPatterns) {
      result = result.replace(pattern, "").trim();
    }
    return result || address;
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadSuggestions = useCallback(
    async (query) => {
      if (!query || query.length < 3 || !DADATA_TOKEN) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const cleanCity = city ? city.replace(/^г\.?\s*/i, "").trim() : null;

        const response = await axios.post(
          DADATA_API_URL,
          {
            query,
            count: 10,
            ...(cleanCity ? { locations: [{ city: cleanCity }] } : {}),
            restrict_value: cleanCity ? true : false,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${DADATA_TOKEN}`,
            },
          },
        );

        const suggestions = response.data.suggestions
          .filter((item) => {
            if (!cleanCity) return true;
            const itemCity = (item.data.city || item.data.settlement || "")
              .replace(/^г\.?\s*/i, "")
              .trim()
              .toLowerCase();
            return itemCity === cleanCity.toLowerCase();
          })
          .map((item) => {
            const fullAddress = item.value;
            const addressWithoutCity = city
              ? removeCityFromAddress(fullAddress, city)
              : fullAddress;

            // Извлекаем квартиру из полного адреса
            const apartmentMatch = fullAddress.match(
              /,?\s*(?:кв|квартира|офис|оф)\s*([0-9а-яА-Я\/-]+)/i,
            );
            const apartment = apartmentMatch ? apartmentMatch[1] : "";

            return {
              value: addressWithoutCity,
              fullValue: fullAddress,
              label: addressWithoutCity,
              city: item.data.city || item.data.settlement || "",
              house: item.data.house || "",
              street: item.data.street_with_type || "",
              apartment: apartment,
              hasHouse: !!item.data.house,
            };
          });

        setOptions(suggestions);
        setIsOpen(suggestions.length > 0);
      } catch (error) {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [city, removeCityFromAddress],
  );

  useEffect(() => {
    setInputValue(street);
  }, [street]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    onStreetChange({ target: { value: val } });
    if (val && val.length >= 3) {
      loadSuggestions(val);
    } else {
      setOptions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (option) => {
    setInputValue(option.street);
    onStreetChange({ target: { value: option.street } });
    if (option.house) {
      onHouseChange({ target: { value: option.house } });
    }
    if (option.apartment) {
      onApartmentChange({ target: { value: option.apartment } });
    }
    setIsOpen(false);
    setOptions([]);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (options.length > 0) setIsOpen(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (inputValue) {
      const parsed = parseSeparatedAddress(inputValue);
      const nextStreet = parsed.street || inputValue;
      if (nextStreet !== inputValue) {
        setInputValue(nextStreet);
        onStreetChange({ target: { value: nextStreet } });
      }
      if (parsed.house && parsed.house !== house) {
        onHouseChange({ target: { value: parsed.house } });
      }
      if (parsed.apartment && parsed.apartment !== apartment) {
        onApartmentChange({ target: { value: parsed.apartment } });
      }
    }
  };

  const handleHouseChange = (e) => {
    onHouseChange(e);
  };

  const handleApartmentChange = (e) => {
    onApartmentChange(e);
  };

  if (!DADATA_TOKEN) {
    return (
      <div className="space-y-4">
        <div className="relative w-full">
          <input
            type="text"
            value={street}
            onChange={onStreetChange}
            placeholder=" "
            className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE]"
          />
          <label
            className={`absolute left-4 transition-all duration-200 pointer-events-none ${
              street ? "top-3 text-xs" : "top-1/2 -translate-y-1/2 text-base"
            } text-[#858585]`}
          >
            Улица{required ? " *" : ""}
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative w-full">
            <input
              type="text"
              value={house}
              onChange={onHouseChange}
              placeholder=" "
              className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE]"
            />
            <label
              className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                house ? "top-3 text-xs" : "top-1/2 -translate-y-1/2 text-base"
              } text-[#858585]`}
            >
              Дом{required ? " *" : ""}
            </label>
          </div>
          <div className="relative w-full">
            <input
              type="text"
              value={apartment}
              onChange={onApartmentChange}
              placeholder=" "
              className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE]"
            />
            <label
              className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                apartment
                  ? "top-3 text-xs"
                  : "top-1/2 -translate-y-1/2 text-base"
              } text-[#858585]`}
            >
              Квартира
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div ref={wrapperRef} className="relative w-full">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder=" "
            className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE]"
          />
          <label
            className={`absolute left-4 transition-all duration-200 pointer-events-none ${
              isFloating
                ? "top-3 text-xs"
                : "top-1/2 -translate-y-1/2 text-base"
            } ${isFocused ? "text-[#0077FE]" : "text-[#858585]"}`}
          >
            Улица{required ? " *" : ""}
          </label>
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-[#C8C7CC] border-t-[#0077FE] rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        {isOpen && options.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#C8C7CC] rounded-xl shadow-lg z-50 max-h-60 overflow-auto">
            {options.map((option, idx) => (
              <div
                key={idx}
                onClick={() => handleSelect(option)}
                className="px-4 py-3 text-sm text-[#2D2D2D] cursor-pointer hover:bg-[#F4EEE2] first:rounded-t-xl last:rounded-b-xl"
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
        {isOpen &&
          inputValue &&
          inputValue.length >= 3 &&
          options.length === 0 &&
          !loading && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#C8C7CC] rounded-xl shadow-lg z-50">
              <div
                onClick={() => {
                  const addressWithoutCity = city
                    ? removeCityFromAddress(inputValue, city)
                    : inputValue;
                  handleSelect({
                    value: addressWithoutCity,
                    label: addressWithoutCity,
                    city: "",
                  });
                }}
                className="px-4 py-3 text-sm text-[#0077FE] cursor-pointer hover:bg-[#F4EEE2] rounded-xl"
              >
                Использовать "
                {city ? removeCityFromAddress(inputValue, city) : inputValue}"
              </div>
            </div>
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative w-full">
          <input
            type="text"
            value={house}
            onChange={handleHouseChange}
            placeholder=" "
            className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE]"
          />
          <label
            className={`absolute left-4 transition-all duration-200 pointer-events-none ${
              house ? "top-3 text-xs" : "top-1/2 -translate-y-1/2 text-base"
            } text-[#858585]`}
          >
            Дом{required ? " *" : ""}
          </label>
        </div>

        <div className="relative w-full">
          <input
            type="text"
            value={apartment}
            onChange={handleApartmentChange}
            placeholder=" "
            className="peer w-full px-4 pt-6 pb-2 border border-[#C8C7CC] rounded-xl text-base text-[#2D2D2D] focus:outline-none focus:border-[#0077FE]"
          />
          <label
            className={`absolute left-4 transition-all duration-200 pointer-events-none ${
              apartment ? "top-3 text-xs" : "top-1/2 -translate-y-1/2 text-base"
            } text-[#858585]`}
          >
            Квартира
          </label>
        </div>
      </div>
    </div>
  );
}

export default SeparatedAddressInput;
