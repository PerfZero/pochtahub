export const parseSeparatedAddress = (address) => {
  if (!address) {
    return { street: "", house: "", apartment: "" };
  }

  const parts = address.split(",");
  let apartment = "";
  let streetAndHouse =
    parts.length === 1 ? address.trim() : parts.slice(0, -1).join(",").trim();

  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1].trim();
    if (lastPart.match(/^(кв|квартира|офис|оф)\s*/i)) {
      apartment = lastPart.replace(/^(кв|квартира|офис|оф)\s*/i, "").trim();
    } else {
      streetAndHouse = address.trim();
    }
  }

  let street = streetAndHouse;
  let house = "";

  const houseMatch = streetAndHouse.match(
    /,\s*(?:д|дом|влд|владение|стр|строение)\s*([0-9а-яА-Я/-]+)/i,
  );
  if (houseMatch) {
    house = houseMatch[1].trim();
    street = streetAndHouse
      .replace(/,\s*(?:д|дом|влд|владение|стр|строение)\s*[0-9а-яА-Я/-]+/i, "")
      .trim();
  } else {
    const trailingHouse = streetAndHouse.match(/(.+?)\s+(\d+[0-9а-яА-Я/-]*)$/);
    if (trailingHouse) {
      street = trailingHouse[1].trim();
      house = trailingHouse[2].trim();
    }
  }

  street = street.replace(/[,\\s]+$/, "").trim();

  return { street, house, apartment };
};

export const hasExplicitHouseNumber = (address) => {
  if (!address) return false;
  const normalized = address.trim();
  if (!normalized) return false;

  if (
    /\b(д|дом|влд|владение|стр|строение|корп|корпус|к|лит|соор)\.?\s*\d+/i.test(
      normalized,
    )
  ) {
    return true;
  }

  return /(?:^|[\\s,])\\d+[0-9а-яa-z/-]*\\s*$/i.test(normalized);
};
