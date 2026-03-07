import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import logoSvg from "../assets/whitelogo.svg";
import cdekIcon from "../assets/images/cdek.svg";
import CityInput from "../components/CityInput";
import NumberInput from "../components/NumberInput";
import { tariffsAPI, ordersAPI } from "../api";

const API_URL = import.meta.env.VITE_API_URL || "/api";
const getMediaUrl = (path) => {
  if (path.startsWith("http")) return path;
  if (path.startsWith("/media")) {
    if (API_URL.startsWith("http")) {
      // Если API_URL полный URL (например, http://127.0.0.1:8000/api), используем его базовый URL
      return `${API_URL.replace("/api", "")}${path}`;
    }
    // Если API_URL относительный (/api), определяем базовый URL
    // Для локальной разработки обычно бэкенд на 127.0.0.1:8000
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
import iconPhone from "../assets/images/icon-phone.svg";
import iconIron from "../assets/images/icon-iron.svg";
import iconShoes from "../assets/images/icon-shoes.svg";
import iconMicrowave from "../assets/images/icon-microwave.svg";

function OffersPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const getUrlWizardData = () => {
    const urlParams = new URLSearchParams(location.search);
    const encoded = urlParams.get("data");

    if (encoded) {
      try {
        const decodedBase64 = decodeURIComponent(encoded);
        const binaryString = atob(decodedBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const decoded = new TextDecoder("utf-8").decode(bytes);
        return JSON.parse(decoded);
      } catch (err) {
        return {};
      }
    }

    return {};
  };

  const [wizardData, setWizardData] = useState(() => {
    return location.state?.wizardData || getUrlWizardData();
  });

  const [fromCity, setFromCity] = useState(wizardData.fromCity || "");
  const [toCity, setToCity] = useState(wizardData.toCity || "");
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [error, setError] = useState("");
  const [filterCourierPickup, setFilterCourierPickup] = useState(true);
  const [filterCourierDelivery, setFilterCourierDelivery] = useState(() => {
    const fromWizardData =
      wizardData.filterCourierDelivery !== undefined
        ? wizardData.filterCourierDelivery
        : null;
    const fromStorage = localStorage.getItem("filterCourierDelivery");
    if (fromWizardData !== null) return fromWizardData;
    if (fromStorage !== null) return fromStorage === "true";
    return false;
  });
  const [sortBy, setSortBy] = useState("price");
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isRouteEditing, setIsRouteEditing] = useState(false);
  const [showCourierPickupCta, setShowCourierPickupCta] = useState(true);
  const [showAssistant, setShowAssistant] = useState(() => {
    const isRecipientFlow = wizardData.selectedRole === "recipient";
    const isFromUrlCheck =
      !location.state?.wizardData && location.search.includes("data=");
    const skippedAssistant =
      wizardData.selectedRole === "sender" &&
      !wizardData.inviteRecipient &&
      !location.state?.inviteRecipient &&
      location.state?.wizardData &&
      !isFromUrlCheck;
    const hasCompletedPackageStep = Boolean(wizardData.packageDataCompleted);
    return !skippedAssistant && !isRecipientFlow && !hasCompletedPackageStep;
  });
  const [typedText, setTypedText] = useState("");
  const [assistantStep, setAssistantStep] = useState("initial");
  const [isThinking, setIsThinking] = useState(true);
  const [showPackagePopup, setShowPackagePopup] = useState(false);
  const [packageOption, setPackageOption] = useState(null);
  const [selectedPackageOption, setSelectedPackageOption] = useState(
    wizardData.packageOption || null,
  );
  const [recalculating, setRecalculating] = useState(false);
  const [showPackagingPopup, setShowPackagingPopup] = useState(false);
  const [pendingOfferNavigation, setPendingOfferNavigation] = useState(null);
  const [packagingPrice, setPackagingPrice] = useState(200);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(wizardData.photoUrl || null);
  const [photoError, setPhotoError] = useState("");
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState(null);
  const photoRequestIdRef = useRef(0);
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [estimatedValue, setEstimatedValue] = useState(
    wizardData.estimatedValue || "10",
  );
  const [selectedSize, setSelectedSize] = useState(null);
  const [deliveryName, setDeliveryName] = useState(
    wizardData.deliveryName || "",
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/orders/settings/`);
        if (response.ok) {
          const data = await response.json();
          if (data?.packaging_price !== undefined) {
            setPackagingPrice(data.packaging_price);
          }
        }
      } catch (error) {
      }
    };
    fetchSettings();
  }, []);

  const assistantMessageInitial =
    "Привет! Я виртуальный ассистент Саша. Я помогу оформить доставку без лишних действий. Хотите, чтобы получатель сам выбрал доставку и указал точный адрес?";
  const assistantMessageSecond =
    "Я помогу быстро отправить или получить посылку. Представленный расчёт ниже, сейчас ориентировочный. Хотите сделать его точнее?";
  const assistantMessageSuccess =
    "Отлично! Теперь мы можем посчитать точную стоимость вашей посылки. Выберите наиболее подходящее предложение ниже.";
  const assistantMessageAfterRecipient =
    "Получатель уже получил уведомление. Чтобы мы точно рассчитали доставку, давайте уточним размеры посылки.";

  const [recipientNotified, setRecipientNotified] = useState(
    location.state?.recipientNotified || false,
  );

  const isRecipientFlow = wizardData.selectedRole === "recipient";
  const isOfferOnlyMode = Boolean(
    location.state?.focusOfferSelection || wizardData.offerOnlyMode,
  );
  const isPositivePackageValue = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0;
  };
  const hasPackageDimensions =
    isPositivePackageValue(wizardData.length) ||
    isPositivePackageValue(wizardData.width) ||
    isPositivePackageValue(wizardData.height);
  const hasPackageParams =
    Boolean(wizardData.packageDataCompleted) ||
    (Boolean(wizardData.packageOption) &&
      (Boolean(wizardData.selectedSize) || hasPackageDimensions));

  const getCurrentMessage = () => {
    if (selectedPackageOption) {
      return assistantMessageSuccess;
    }
    if (recipientNotified) {
      return assistantMessageAfterRecipient;
    }
    return assistantStep === "initial"
      ? assistantMessageInitial
      : assistantMessageSecond;
  };

  const currentMessage = getCurrentMessage();

  const sizeOptions = [
    {
      id: "smartphone",
      name: "Как коробка от смартфона",
      dimensions: "17х12х9 см",
      weight: "до 1 кг",
      icon: iconPhone,
    },
    {
      id: "iron",
      name: "Как коробка от утюга",
      dimensions: "21х20х11 см",
      weight: "до 3 кг",
      icon: iconIron,
    },
    {
      id: "shoes",
      name: "Как коробка от обуви",
      dimensions: "33х25х15 см",
      weight: "до 7 кг",
      icon: iconShoes,
    },
    {
      id: "microwave",
      name: "Как коробка от микроволновки",
      dimensions: "42х35х30 см",
      weight: "до 15кг",
      icon: iconMicrowave,
    },
  ];

  const handlePackageContinue = async () => {
    setRecalculating(true);
    setShowPackagePopup(false);

    if (packageOption === "photo" && photoPreview) {
      let finalWeight = "1";
      let finalLength = "";
      let finalWidth = "";
      let finalHeight = "";

      if (photoFile) {
        try {
          const formData = new FormData();
          formData.append("image", photoFile);
          const response = await tariffsAPI.analyzeImage(formData);
          if (response.data) {
            finalWeight = response.data.weight || "1";
            finalLength = response.data.length || "";
            finalWidth = response.data.width || "";
            finalHeight = response.data.height || "";
          }
        } catch (err) {
        }
      }

      const updatedWizardData = {
        ...wizardData,
        weight: finalWeight,
        length: finalLength,
        width: finalWidth,
        height: finalHeight,
        packageOption: "photo",
        packageDataCompleted: true,
        photoFile,
        photoUrl,
      };

      setWizardData(updatedWizardData);
      setSelectedPackageOption("photo");

      try {
        const response = await tariffsAPI.calculate({
          weight: parseFloat(parseFloat(finalWeight).toFixed(2)),
          length: parseFloat(finalLength) || 0,
          width: parseFloat(finalWidth) || 0,
          height: parseFloat(finalHeight) || 0,
          from_city: updatedWizardData.fromCity,
          to_city: updatedWizardData.toCity,
          from_address:
            updatedWizardData.senderAddress || updatedWizardData.fromCity,
          to_address:
            updatedWizardData.deliveryAddress || updatedWizardData.toCity,
          courier_pickup: filterCourierPickup,
          courier_delivery: filterCourierDelivery,
          declared_value:
            estimatedValue && estimatedValue.trim()
              ? parseFloat(estimatedValue)
              : 10,
        });

        if (response.data && response.data.options) {
          setOffers(response.data.options);
          setError("");
        } else {
          setError("Не удалось получить предложения");
        }
      } catch (err) {
        setError(err.response?.data?.error || "Ошибка при пересчете офферов");
      } finally {
        setRecalculating(false);
      }
    } else if (
      packageOption === "manual" &&
      length &&
      width &&
      height &&
      weight
    ) {
      const updatedWizardData = {
        ...wizardData,
        weight,
        length,
        width,
        height,
        packageOption: "manual",
        packageDataCompleted: true,
      };

      setWizardData(updatedWizardData);
      setSelectedPackageOption("manual");

      try {
        const response = await tariffsAPI.calculate({
          weight: parseFloat(parseFloat(weight).toFixed(2)),
          length: parseFloat(length),
          width: parseFloat(width),
          height: parseFloat(height),
          from_city: updatedWizardData.fromCity,
          to_city: updatedWizardData.toCity,
          from_address:
            updatedWizardData.senderAddress || updatedWizardData.fromCity,
          to_address:
            updatedWizardData.deliveryAddress || updatedWizardData.toCity,
          courier_pickup: filterCourierPickup,
          courier_delivery: filterCourierDelivery,
          declared_value:
            estimatedValue && estimatedValue.trim()
              ? parseFloat(estimatedValue)
              : 10,
        });

        if (response.data && response.data.options) {
          setOffers(response.data.options);
          setError("");
        } else {
          setError("Не удалось получить предложения");
        }
      } catch (err) {
        setError(err.response?.data?.error || "Ошибка при пересчете офферов");
      } finally {
        setRecalculating(false);
      }
    } else if (packageOption === "unknown" && selectedSize) {
      const sizeOption = sizeOptions.find((opt) => opt.id === selectedSize);
      let finalWeight = "1";
      let finalLength = "";
      let finalWidth = "";
      let finalHeight = "";

      if (sizeOption) {
        const weightMatch = sizeOption.weight.match(/(\d+)/);
        finalWeight = weightMatch ? weightMatch[1] : "5";
        const dimMatch = sizeOption.dimensions.match(/(\d+)х(\d+)х(\d+)/);
        if (dimMatch) {
          finalLength = dimMatch[1];
          finalWidth = dimMatch[2];
          finalHeight = dimMatch[3];
        }
      }

      const updatedWizardData = {
        ...wizardData,
        weight: finalWeight,
        length: finalLength,
        width: finalWidth,
        height: finalHeight,
        selectedSize,
        packageOption: "unknown",
        packageDataCompleted: true,
      };

      setWizardData(updatedWizardData);
      setSelectedPackageOption("unknown");

      try {
        const response = await tariffsAPI.calculate({
          weight: parseFloat(parseFloat(finalWeight).toFixed(2)),
          length: parseFloat(finalLength),
          width: parseFloat(finalWidth),
          height: parseFloat(finalHeight),
          from_city: updatedWizardData.fromCity,
          to_city: updatedWizardData.toCity,
          from_address:
            updatedWizardData.senderAddress || updatedWizardData.fromCity,
          to_address:
            updatedWizardData.deliveryAddress || updatedWizardData.toCity,
          courier_pickup: filterCourierPickup,
          courier_delivery: filterCourierDelivery,
          declared_value:
            estimatedValue && estimatedValue.trim()
              ? parseFloat(estimatedValue)
              : 10,
        });

        if (response.data && response.data.options) {
          setOffers(response.data.options);
          setError("");
        } else {
          setError("Не удалось получить предложения");
        }
      } catch (err) {
        setError(err.response?.data?.error || "Ошибка при пересчете офферов");
      } finally {
        setRecalculating(false);
      }
    } else {
      setRecalculating(false);
    }
  };

  const isPhotoValid = packageOption === "photo" && photoPreview;
  const isManualValid =
    packageOption === "manual" && length && width && height && weight;
  const isUnknownValid = packageOption === "unknown" && selectedSize;
  const isContinueDisabled =
    photoAnalyzing || (!isPhotoValid && !isManualValid && !isUnknownValid);

  const processPhotoFile = async (file) => {
    if (!file) return;

    const requestId = ++photoRequestIdRef.current;

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Файл слишком большой. Максимальный размер 5 МБ.");
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoUrl(null);
      setPhotoAnalysis(null);
      setPhotoAnalyzing(false);
      return;
    }

    setPhotoFile(file);
    setPhotoError("");
    setPhotoAnalyzing(true);
    setPhotoAnalysis(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (requestId !== photoRequestIdRef.current) return;
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("image", file);

      try {
        const uploadResponse = await ordersAPI.uploadPackageImage(formData);
        if (requestId !== photoRequestIdRef.current) return;
        if (uploadResponse.data?.success && uploadResponse.data?.image_url) {
          setPhotoUrl(uploadResponse.data.image_url);
        }
      } catch (uploadError) {
      }

      const analyzeFormData = new FormData();
      analyzeFormData.append("image", file);
      const analyzeResponse = await tariffsAPI.analyzeImage(analyzeFormData);
      if (requestId !== photoRequestIdRef.current) return;

      if (analyzeResponse.data) {
        setPhotoError("");
        setPhotoAnalysis(analyzeResponse.data);
        if (analyzeResponse.data.length)
          setLength(analyzeResponse.data.length.toString());
        if (analyzeResponse.data.width)
          setWidth(analyzeResponse.data.width.toString());
        if (analyzeResponse.data.height)
          setHeight(analyzeResponse.data.height.toString());
        if (analyzeResponse.data.weight)
          setWeight(analyzeResponse.data.weight.toString());
        if (analyzeResponse.data.declared_value)
          setEstimatedValue(analyzeResponse.data.declared_value.toString());
      }
    } catch (err) {
      if (requestId !== photoRequestIdRef.current) return;
      setPhotoError(
        err.response?.data?.error || "Ошибка обработки изображения",
      );
    } finally {
      if (requestId === photoRequestIdRef.current) {
        setPhotoAnalyzing(false);
      }
    }
  };

  const isFromUrl =
    !location.state?.wizardData && location.search.includes("data=");

  useEffect(() => {
    if (showAssistant) {
      setIsThinking(true);
      setTypedText("");

      const thinkingTimeout = setTimeout(() => {
        setIsThinking(false);
      }, 1000);

      return () => clearTimeout(thinkingTimeout);
    }
  }, [showAssistant, assistantStep, selectedPackageOption]);

  useEffect(() => {
    if (
      showAssistant &&
      !isThinking &&
      typedText.length < currentMessage.length
    ) {
      const timeout = setTimeout(() => {
        setTypedText(currentMessage.slice(0, typedText.length + 1));
      }, 15);
      return () => clearTimeout(timeout);
    }
  }, [showAssistant, typedText, currentMessage, isThinking]);

  useEffect(() => {
    if (fromCity || toCity) {
      setWizardData((prev) => ({
        ...prev,
        fromCity,
        toCity,
      }));
    }
  }, [fromCity, toCity]);

  useEffect(() => {
    let currentWizardData = wizardData;

    if (location.state?.wizardData) {
      currentWizardData = location.state.wizardData;
      setWizardData(currentWizardData);
      setFromCity(currentWizardData.fromCity || "");
      setToCity(currentWizardData.toCity || "");
      setDeliveryName(currentWizardData.deliveryName || "");
      setEstimatedValue(currentWizardData.estimatedValue || "10");
      if (currentWizardData.packageOption) {
        setSelectedPackageOption(currentWizardData.packageOption);
      }
      setFilterCourierPickup(true);
      if (currentWizardData.filterCourierDelivery !== undefined) {
        const value = currentWizardData.filterCourierDelivery;
        setFilterCourierDelivery(value);
        localStorage.setItem("filterCourierDelivery", String(value));
      } else {
        const saved = localStorage.getItem("filterCourierDelivery");
        if (saved !== null) {
          const value = saved === "true";
          setFilterCourierDelivery(value);
        } else {
        }
      }
    } else if (location.search) {
      const urlData = getUrlWizardData();
      if (urlData.fromCity || urlData.toCity) {
        currentWizardData = urlData;
        setWizardData(urlData);
        setFromCity(urlData.fromCity || "");
        setToCity(urlData.toCity || "");
        setDeliveryName(urlData.deliveryName || "");
        if (urlData.packageOption) {
          setSelectedPackageOption(urlData.packageOption);
        }
        setFilterCourierPickup(true);
        if (urlData.filterCourierDelivery !== undefined) {
          const value = urlData.filterCourierDelivery;
          setFilterCourierDelivery(value);
          localStorage.setItem("filterCourierDelivery", String(value));
        } else {
          const saved = localStorage.getItem("filterCourierDelivery");
          if (saved !== null) {
            const value = saved === "true";
            setFilterCourierDelivery(value);
          } else {
          }
        }
      }
    }

    const loadOffers = async () => {
      if (!currentWizardData.fromCity || !currentWizardData.toCity) {
        if (!recipientNotified) {
          setError("Недостаточно данных для расчета");
        }
        setLoading(false);
        return;
      }

      const weightToUse = currentWizardData.weight || "1";
      const lengthToUse = currentWizardData.length || "0";
      const widthToUse = currentWizardData.width || "0";
      const heightToUse = currentWizardData.height || "0";

      if (
        !currentWizardData.weight &&
        !recipientNotified &&
        offers.length > 0
      ) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const dimensions = {
          length: parseFloat(lengthToUse) || 0,
          width: parseFloat(widthToUse) || 0,
          height: parseFloat(heightToUse) || 0,
        };

        const response = await tariffsAPI.calculate({
          weight: parseFloat(parseFloat(weightToUse).toFixed(2)),
          ...dimensions,
          from_city: currentWizardData.fromCity,
          to_city: currentWizardData.toCity,
          from_address:
            currentWizardData.senderAddress || currentWizardData.fromCity,
          to_address:
            currentWizardData.deliveryAddress || currentWizardData.toCity,
          courier_pickup: filterCourierPickup,
          courier_delivery: filterCourierDelivery,
          declared_value:
            currentWizardData.estimatedValue &&
            currentWizardData.estimatedValue.trim()
              ? parseFloat(currentWizardData.estimatedValue)
              : 10,
        });

        if (response.data && response.data.options) {
          setOffers(response.data.options);
        } else {
          setError("Не удалось получить предложения");
        }
      } catch (err) {
        setError(err.response?.data?.error || "Ошибка загрузки предложений");
      } finally {
        setLoading(false);
      }
    };

    loadOffers();
  }, [location.search, location.state]);

  useEffect(() => {
    const isFromUrlCheck =
      !location.state?.wizardData && location.search.includes("data=");
    const skippedAssistant =
      wizardData.selectedRole === "sender" &&
      !wizardData.inviteRecipient &&
      !location.state?.inviteRecipient &&
      location.state?.wizardData &&
      !isFromUrlCheck;
    const hasCompletedPackageStep = Boolean(wizardData.packageDataCompleted);
    setShowAssistant(
      !skippedAssistant && !hasCompletedPackageStep && !isRecipientFlow,
    );
  }, [
    wizardData,
    location.state,
    location.search,
    selectedPackageOption,
    isRecipientFlow,
  ]);

  // Обновляем recipientNotified при возврате с WizardPage
  useEffect(() => {
    if (location.state?.recipientNotified) {
      setRecipientNotified(true);
    }
    if (location.state?.wizardData) {
      const newWizardData = location.state.wizardData;
      setWizardData(newWizardData);
      if (newWizardData.recipientPhone) {
        setRecipientNotified(true);
      }
      if (newWizardData.packageOption) {
        setSelectedPackageOption(newWizardData.packageOption);
      }
    }
  }, [location.state]);

  const getCompanyInitial = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const getCompanyColor = (index) => {
    const colors = [
      "bg-green-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-orange-500",
      "bg-blue-500",
    ];
    return colors[index % colors.length];
  };

  const sortedOffers = [...offers].sort((a, b) => {
    if (sortBy === "price") {
      return (a.price || 0) - (b.price || 0);
    } else if (sortBy === "delivery_time") {
      return (a.delivery_time || 0) - (b.delivery_time || 0);
    }
    return 0;
  });

  const cheapestOffer = sortedOffers.length > 0 ? sortedOffers[0] : null;
  const fastestOffer = [...offers].sort(
    (a, b) => (a.delivery_time || 999) - (b.delivery_time || 999),
  )[0];

  const handleCourierPickupCtaClick = () => {
    setShowCourierPickupCta(false);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        const offersListElement = document.getElementById("offers-list");
        if (offersListElement) {
          offersListElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });
    }
  };

  const handleNavigateToRecipientPhone = () => {
    const updatedWizardData = {
      ...wizardData,
      fromCity: wizardData.fromCity || fromCity,
      toCity: wizardData.toCity || toCity,
      deliveryName: deliveryName,
      selectedRole: "sender", // Устанавливаем роль отправителя
    };

    // Если получатель уже получил уведомление, переходим на package
    const targetStep = recipientNotified ? "package" : "recipientPhone";
    const returnToOffers = !recipientNotified; // returnToOffers только при первом переходе

    // Сохраняем данные в URL для надежности
    try {
      const jsonString = JSON.stringify(updatedWizardData);
      const encoded = btoa(unescape(encodeURIComponent(jsonString)));
      navigate(
        `/wizard?data=${encodeURIComponent(encoded)}&step=${targetStep}`,
        {
          state: {
            wizardData: updatedWizardData,
            returnToOffers: returnToOffers,
            currentStep: targetStep,
            selectedRole: "sender",
            inviteRecipient: true,
          },
        },
      );
    } catch (err) {
      navigate(`/wizard?step=${targetStep}`, {
        state: {
          wizardData: updatedWizardData,
          returnToOffers: returnToOffers,
          currentStep: targetStep,
          selectedRole: "sender",
          inviteRecipient: true,
        },
      });
    }
  };

  const needsPvzSelection = (offer, filterCourierDelivery = false) => {
    if (!offer) {
      return false;
    }

    if (filterCourierDelivery) {
      return false;
    }

    const isCDEK =
      offer.company_name === "CDEK" || offer.company_code === "cdek";
    if (!isCDEK) {
      return false;
    }

    const tariffCode = offer.tariff_code;
    if (!tariffCode) {
      return false;
    }

    const PVZ_TARIFFS = [
      136, 138, 62, 63, 233, 234, 235, 236, 237, 238, 239, 240,
    ];
    return PVZ_TARIFFS.includes(tariffCode);
  };

  const handleSelectOffer = (offer) => {
    if (typeof window !== "undefined" && typeof window.ym === "function") {
      window.ym(104664178, "reachGoal", "star");
      window.ym(104664178, "params", { offers: "выбрал_ТК" });
    }
    const updatedWizardData = {
      ...wizardData,
      fromCity: wizardData.fromCity || fromCity,
      toCity: wizardData.toCity || toCity,
      deliveryName: deliveryName,
      selectedRole: wizardData.selectedRole || null,
      packageDataCompleted: Boolean(wizardData.packageDataCompleted),
      offerOnlyMode: false,
      estimatedValue: estimatedValue || wizardData.estimatedValue || "10", // Сохраняем estimatedValue
      selectedOffer: {
        company_id: offer.company_id,
        company_name: offer.company_name,
        company_code: offer.company_code,
        company_logo: offer.company_logo,
        price: offer.price,
        tariff_code: offer.tariff_code,
        tariff_name: offer.tariff_name,
        delivery_time: offer.delivery_time,
        insurance_cost: offer.insurance_cost || null,
      },
      returnToPayment: wizardData.returnToPayment || false,
      filterCourierDelivery: filterCourierDelivery,
    };
    const selectedOfferData = {
      company_id: offer.company_id,
      company_name: offer.company_name,
      company_code: offer.company_code,
      company_logo: offer.company_logo,
      price: offer.price,
      tariff_code: offer.tariff_code,
      tariff_name: offer.tariff_name,
      delivery_time: offer.delivery_time,
      insurance_cost: offer.insurance_cost || null,
    };
    const selectedOfferNeedsPvz = needsPvzSelection(
      selectedOfferData,
      filterCourierDelivery,
    );

    const isAssistantFlow =
      wizardData.inviteRecipient &&
      wizardData.recipientPhone &&
      wizardData.selectedRole === "sender";
    const hasCompletedRecipientFlow =
      wizardData.selectedRole === "recipient" &&
      (wizardData.recipientPhone || wizardData.recipientUserPhone) &&
      wizardData.recipientFIO &&
      wizardData.paymentPayer &&
      (wizardData.recipientAddress ||
        wizardData.deliveryAddress ||
        selectedOfferNeedsPvz);
    const hasCompletedSenderFlow =
      (wizardData.pickupAddress || wizardData.senderAddress) &&
      wizardData.recipientPhone &&
      wizardData.recipientFIO &&
      wizardData.paymentPayer &&
      (wizardData.recipientAddress ||
        wizardData.deliveryAddress ||
        selectedOfferNeedsPvz);
    const hasCompletedFlow =
      hasCompletedRecipientFlow || hasCompletedSenderFlow;

    const navigateState = {
      wizardData: updatedWizardData,
      selectedOffer: selectedOfferData,
    };

    let navigationPath = "";
    let navigationState = navigateState;

    if (isAssistantFlow) {
      navigationState.inviteRecipient = true;
      navigationState.selectedRole = "sender";
      navigationPath = "/wizard?step=pickupAddress";
    } else if (hasCompletedFlow) {
      const needsPvz = needsPvzSelection(
        selectedOfferData,
        filterCourierDelivery,
      );
      if (needsPvz) {
        navigationPath = "/wizard?step=selectPvz";
      } else {
        navigationPath = "/wizard?step=email";
      }
    } else {
      if (!updatedWizardData.selectedRole) {
        navigationPath = "/wizard?step=role";
      } else if (!updatedWizardData.packageDataCompleted) {
        navigationPath = "/wizard?step=package";
      } else if (updatedWizardData.selectedRole === "recipient") {
        navigationPath = "/wizard?step=recipientAddress";
      } else {
        navigationPath = "/wizard?step=pickupAddress";
      }
    }

    const shouldShowPackagingPopup =
      hasCompletedFlow || wizardData.returnToPayment === true;

    if (shouldShowPackagingPopup) {
      setPendingOfferNavigation({
        path: navigationPath,
        state: navigationState,
      });
      setShowPackagingPopup(true);
    } else {
      navigate(navigationPath, { state: navigationState });
    }
  };

  const handlePackagingChoice = (needsPackaging) => {
    setShowPackagingPopup(false);
    if (pendingOfferNavigation) {
      const updatedWizardData = {
        ...pendingOfferNavigation.state.wizardData,
        needsPackaging: needsPackaging === true,
        packagingPopupShown: true,
        estimatedValue:
          estimatedValue ||
          pendingOfferNavigation.state.wizardData.estimatedValue ||
          "10", // Сохраняем estimatedValue
      };
      navigate(pendingOfferNavigation.path, {
        state: {
          ...pendingOfferNavigation.state,
          wizardData: updatedWizardData,
        },
      });
      setPendingOfferNavigation(null);
    }
  };

  const handleCalculate = useCallback(async () => {
    if (!fromCity || !toCity || !wizardData.weight) {
      return;
    }
    if (typeof window !== "undefined" && typeof window.ym === "function") {
      window.ym(104664178, "params", { offers: "рассчитал" });
    }

    try {
      setLoading(true);
      setError("");

      const updatedWizardData = {
        ...wizardData,
        fromCity,
        toCity,
        estimatedValue: estimatedValue, // Сохраняем estimatedValue в wizardData
      };

      setWizardData(updatedWizardData);

      const dimensions = {
        length: updatedWizardData.length || 0,
        width: updatedWizardData.width || 0,
        height: updatedWizardData.height || 0,
      };

      const response = await tariffsAPI.calculate({
        weight: parseFloat(parseFloat(updatedWizardData.weight).toFixed(2)),
        ...dimensions,
        from_city: fromCity,
        to_city: toCity,
        from_address: updatedWizardData.senderAddress || fromCity,
        to_address: updatedWizardData.deliveryAddress || toCity,
        courier_pickup: filterCourierPickup,
        courier_delivery: filterCourierDelivery,
        declared_value:
          estimatedValue && estimatedValue.trim()
            ? parseFloat(estimatedValue)
            : null,
      });

      if (response.data && response.data.options) {
        setOffers(response.data.options);
      } else {
        setError("Не удалось получить предложения");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка загрузки предложений");
    } finally {
      setLoading(false);
    }
  }, [
    fromCity,
    toCity,
    wizardData,
    filterCourierPickup,
    filterCourierDelivery,
  ]);

  // Пересчет тарифов при изменении фильтров доставки
  useEffect(() => {
    if (!wizardData?.weight || !fromCity || !toCity || offers.length === 0) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsRecalculating(true);
        setError("");

        const dimensions = {
          length: wizardData.length || 0,
          width: wizardData.width || 0,
          height: wizardData.height || 0,
        };

        const response = await tariffsAPI.calculate({
          weight: parseFloat(parseFloat(wizardData.weight).toFixed(2)),
          ...dimensions,
          from_city: fromCity,
          to_city: toCity,
          from_address: wizardData.senderAddress || fromCity,
          to_address: wizardData.deliveryAddress || toCity,
          courier_pickup: filterCourierPickup,
          courier_delivery: filterCourierDelivery,
          declared_value:
            estimatedValue && estimatedValue.trim()
              ? parseFloat(estimatedValue)
              : 10,
        });

        if (response.data && response.data.options) {
          setOffers(response.data.options);
        } else {
          setError("Не удалось получить предложения");
        }
      } catch (err) {
        setError(err.response?.data?.error || "Ошибка загрузки предложений");
      } finally {
        setIsRecalculating(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCourierPickup, filterCourierDelivery]);

  const handleShare = async () => {
    try {
      if (typeof window !== "undefined" && typeof window.ym === "function") {
        window.ym(104664178, "params", { offers: "поделился_расчетом" });
      }
      const shareData = {
        fromCity: wizardData.fromCity || fromCity,
        toCity: wizardData.toCity || toCity,
        weight: wizardData.weight || "",
        length: wizardData.length || "",
        width: wizardData.width || "",
        height: wizardData.height || "",
        senderAddress: wizardData.senderAddress || "",
        deliveryAddress: wizardData.deliveryAddress || "",
      };

      const jsonString = JSON.stringify(shareData);
      const bytes = new TextEncoder().encode(jsonString);
      let binaryString = "";
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binaryString);
      const encoded = encodeURIComponent(base64);
      const url = `${window.location.origin}${window.location.pathname}?data=${encoded}`;
      await navigator.clipboard.writeText(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch (err) {
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="w-full bg-[#0077FE] flex flex-col items-center px-4 md:px-6 py-4 md:py-6 gap-4 md:gap-6">
        <Link to="/calculate">
          <img src={logoSvg} alt="PochtaHub" className="h-6 md:h-8" />
        </Link>
        {isRouteEditing ? (
          <div className="w-full max-w-[720px] bg-white rounded-2xl flex flex-row md:flex-row items-stretch p-2 gap-2 md:gap-0">
            <div className="flex-1 px-4 md:px-6 py-2 border-b md:border-b-0 md:border-r border-[#E5E5E5]">
              <CityInput
                placeholder="Откуда"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                variant="hero"
                label="Откуда"
              />
            </div>
            <div className="flex-1 px-4 md:px-6 py-2 border-b md:border-b-0 md:border-r border-[#E5E5E5]">
              <CityInput
                placeholder="Куда"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                variant="hero"
                label="Куда"
              />
            </div>
            <button
              onClick={() => {
                handleCalculate();
                setIsRouteEditing(false);
              }}
              disabled={!fromCity || !toCity || !wizardData.weight || loading}
              className="bg-[#0077FE] text-white px-4 py-3 md:py-2 text-sm md:text-base font-semibold whitespace-nowrap rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Расчет..." : "Рассчитать стоимость"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsRouteEditing(true)}
            className="w-full max-w-[720px] bg-white rounded-2xl px-4 md:px-6 py-3 md:py-4 flex items-center justify-between text-left shadow-sm"
          >
            <span className="text-sm md:text-base font-semibold text-[#2D2D2D]">
              {fromCity || "Откуда"} → {toCity || "Куда"}
            </span>
            <span className="text-sm md:text-base font-semibold text-[#0077FE]">
              Изменить
            </span>
          </button>
        )}
      </header>

      {showPackagingPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 md:p-6">
          <div className="bg-white rounded-2xl max-w-[468px] w-full relative">
            <button
              onClick={() => {
                if (pendingOfferNavigation) {
                  handlePackagingChoice(false);
                } else {
                  setShowPackagingPopup(false);
                  const updatedWizardData = {
                    ...wizardData,
                    packagingPopupShown: true,
                  };
                  setWizardData(updatedWizardData);
                }
              }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[#2D2D2D] hover:bg-[#F5F5F5] rounded-full transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
            <div className="p-4 md:p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-[#2D2D2D] mb-4 md:mb-6 text-center">
                Добавим упаковку?
              </h2>
              <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 text-center">
                Мы заметили вам понадобится упаковка
              </p>
              <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 text-center">
                Упаковка — {Number(packagingPrice).toLocaleString("ru-RU")} ₽
              </p>
              <div className="flex flex-col gap-3 md:gap-4">
                <button
                  onClick={() => handlePackagingChoice(false)}
                  className="w-full bg-[#F5F5F5] text-[#2D2D2D] px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold hover:bg-[#E5E5E5] transition-colors"
                >
                  Упакую сам
                </button>
                <button
                  onClick={() => handlePackagingChoice(true)}
                  className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold hover:bg-[#0066CC] transition-colors"
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPackagePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 md:p-6">
          <div className="bg-white rounded-2xl max-w-[468px] w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => {
                photoRequestIdRef.current += 1;
                setShowPackagePopup(false);
                setPackageOption(null);
                setPhotoFile(null);
                setPhotoPreview(null);
                setPhotoUrl(null);
                setPhotoError("");
                setLength("");
                setWidth("");
                setHeight("");
                setWeight("");
                setSelectedSize(null);
              }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[#2D2D2D] hover:bg-[#F5F5F5] rounded-full transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>

            {packageOption === "photo" && (
              <div className="p-4 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold text-[#2D2D2D] mb-6 md:mb-8 text-center">
                  Загрузить фото
                </h2>

                <div className="mb-6">
                  <div className="border-2 border-dashed border-[#0077FE] rounded-xl p-4 md:p-8 mb-6">
                    {!photoPreview ? (
                      <div className="flex flex-col items-center gap-3 md:gap-4">
                        <p className="text-xs md:text-sm text-[#2D2D2D] text-center">
                          Фотография весом не более 5 мб.
                        </p>
                        <input
                          type="file"
                          id="photo-upload-popup"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              await processPhotoFile(file);
                            }
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor="photo-upload-popup"
                          className="px-6 py-3 bg-[#0077FE] text-white rounded-xl text-base font-semibold cursor-pointer hover:bg-[#0066CC] transition-colors"
                        >
                          Загрузить фото
                        </label>
                        {photoError && (
                          <p className="text-sm text-red-500">{photoError}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="relative inline-block w-full">
                          <img
                            src={photoPreview}
                            alt="Загруженное фото"
                            className="max-w-full h-auto rounded-lg max-h-48 md:max-h-64"
                          />
                          <button
                            onClick={() => {
                              photoRequestIdRef.current += 1;
                              setPhotoFile(null);
                              setPhotoPreview(null);
                              setPhotoUrl(null);
                              setPhotoAnalysis(null);
                              setPhotoAnalyzing(false);
                              setPhotoError("");
                              const input =
                                document.getElementById("photo-upload-popup");
                              if (input) input.value = "";
                            }}
                            className="absolute top-2 right-2 w-7 h-7 md:w-8 md:h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
                          >
                            <span className="text-[#2D2D2D] text-base md:text-lg font-bold">
                              ×
                            </span>
                          </button>
                        </div>

                        {photoAnalyzing && (
                          <div className="mt-3 md:mt-4 text-center">
                            <p className="text-xs md:text-sm text-[#0077FE]">
                              Анализируем изображение...
                            </p>
                          </div>
                        )}

                        {photoAnalysis && !photoAnalyzing && (
                          <div className="mt-4 w-full bg-[#F0F7FF] rounded-xl p-3 md:p-4 border border-[#0077FE]">
                            <h3 className="text-sm md:text-base font-semibold text-[#2D2D2D] mb-2 md:mb-3 text-center">
                              Результаты анализа
                            </h3>
                            <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3">
                              <div className="bg-white rounded-lg p-2 md:p-3">
                                <p className="text-xs text-[#666] mb-1">
                                  Длина
                                </p>
                                <p className="text-sm md:text-base font-semibold text-[#2D2D2D]">
                                  {photoAnalysis.length
                                    ? `${Math.round(photoAnalysis.length)} см`
                                    : "—"}
                                </p>
                              </div>
                              <div className="bg-white rounded-lg p-2 md:p-3">
                                <p className="text-xs text-[#666] mb-1">
                                  Ширина
                                </p>
                                <p className="text-sm md:text-base font-semibold text-[#2D2D2D]">
                                  {photoAnalysis.width
                                    ? `${Math.round(photoAnalysis.width)} см`
                                    : "—"}
                                </p>
                              </div>
                              <div className="bg-white rounded-lg p-2 md:p-3">
                                <p className="text-xs text-[#666] mb-1">
                                  Высота
                                </p>
                                <p className="text-sm md:text-base font-semibold text-[#2D2D2D]">
                                  {photoAnalysis.height
                                    ? `${Math.round(photoAnalysis.height)} см`
                                    : "—"}
                                </p>
                              </div>
                              <div className="bg-white rounded-lg p-2 md:p-3">
                                <p className="text-xs text-[#666] mb-1">Вес</p>
                                <p className="text-sm md:text-base font-semibold text-[#2D2D2D]">
                                  {photoAnalysis.weight
                                    ? `${photoAnalysis.weight.toFixed(2)} кг`
                                    : "—"}
                                </p>
                              </div>
                            </div>
                            {photoAnalysis.object_count > 0 && (
                              <div className="bg-white rounded-lg p-3 mb-3">
                                <p className="text-xs text-[#666] mb-1">
                                  Обнаружено объектов:{" "}
                                  {photoAnalysis.object_count}
                                </p>
                                {photoAnalysis.object_names &&
                                  photoAnalysis.object_names.length > 0 && (
                                    <p className="text-sm text-[#2D2D2D]">
                                      {photoAnalysis.object_names.join(", ")}
                                    </p>
                                  )}
                              </div>
                            )}
                            {photoAnalysis.declared_value > 0 && (
                              <div className="bg-white rounded-lg p-3">
                                <p className="text-xs text-[#666] mb-1">
                                  Оценочная стоимость
                                </p>
                                <p className="text-base font-semibold text-[#2D2D2D]">
                                  {Math.round(photoAnalysis.declared_value)} ₽
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-4 text-center">
                          <input
                            type="file"
                            id="photo-replace-popup"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                await processPhotoFile(file);
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="photo-replace-popup"
                            className="text-sm text-[#0077FE] cursor-pointer hover:underline"
                          >
                            Загрузить другое фото
                          </label>
                        </div>
                        {photoError && (
                          <p className="text-sm text-red-500 mt-2 text-center">
                            {photoError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handlePackageContinue}
                    disabled={isContinueDisabled}
                    className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold hover:bg-[#0066CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0077FE]"
                  >
                    Продолжить
                  </button>
                </div>
              </div>
            )}

            {packageOption === "manual" && (
              <div className="p-4 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold text-[#2D2D2D] mb-6 md:mb-8">
                  Указать точные размеры
                </h2>

                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
                  <NumberInput
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    label="Длина, см"
                  />
                  <NumberInput
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    label="Высота, см"
                  />
                  <NumberInput
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    label="Ширина, см"
                  />
                  <NumberInput
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    label="Вес, кг"
                  />
                </div>

                <div className="mb-6">
                  <NumberInput
                    value={estimatedValue}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEstimatedValue(value);
                      // Сохраняем в wizardData при изменении
                      setWizardData({
                        ...wizardData,
                        estimatedValue: value,
                      });
                    }}
                    label="Оценочная стоимость"
                  />
                </div>

                <div className="mb-6">
                  <p className="text-sm md:text-base font-semibold text-[#2D2D2D] mb-3">
                    Шаблоны размеров
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {sizeOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          const dimensionsMatch =
                            option.dimensions.match(/(\d+)х(\d+)х(\d+)/);
                          const weightMatch = option.weight.match(/(\d+)/);

                          setSelectedSize(option.id);
                          if (dimensionsMatch) {
                            setLength(dimensionsMatch[1]);
                            setWidth(dimensionsMatch[2]);
                            setHeight(dimensionsMatch[3]);
                          }
                          if (weightMatch) {
                            setWeight(weightMatch[1]);
                          }
                        }}
                        className={`p-3 md:p-4 rounded-xl border transition-all ${
                          selectedSize === option.id
                            ? "border-[#0077FE] bg-[#F0F7FF]"
                            : "border-[#E5E5E5] bg-white hover:border-[#0077FE]"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2 md:gap-3">
                          <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                            <img
                              src={option.icon}
                              alt=""
                              className="w-full h-full"
                            />
                          </div>
                          <div className="text-center">
                            <p className="text-xs md:text-sm font-semibold text-[#2D2D2D] mb-1">
                              {option.name}
                            </p>
                            <p className="text-xs text-[#2D2D2D]">
                              {option.dimensions}
                            </p>
                            <p className="text-xs text-[#2D2D2D]">
                              {option.weight}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handlePackageContinue}
                  disabled={isContinueDisabled}
                  className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold hover:bg-[#0066CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0077FE]"
                >
                  Продолжить
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-center pt-6 md:pt-12 pb-8">
        <div className="w-full max-w-[720px] mx-4 md:mx-6">
          {isOfferOnlyMode && (
            <div className="relative overflow-hidden bg-white border border-[#D8E8FF] rounded-2xl px-4 py-5 md:px-6 md:py-6 mb-4 md:mb-6 shadow-[0_8px_24px_rgba(0,119,254,0.08)]">
              <div className="absolute -top-20 -right-10 w-44 h-44 bg-[#EAF4FF] rounded-full blur-2xl pointer-events-none" />

              <p className="text-xs md:text-sm font-semibold text-[#5F7EA6] uppercase tracking-wide mb-3">
                Сводка оформления
              </p>

              <div className="space-y-1 mb-4">
                <p className="text-sm md:text-base text-[#2D2D2D]">
                  ✔️ Маршрут указан
                </p>
                <p className="text-sm md:text-base text-[#2D2D2D]">
                  ✔️ Параметры посылки учтены
                </p>
                <p className="text-sm md:text-base text-[#2D2D2D]">
                  → Выберите способ доставки
                </p>
              </div>

              <button
                type="button"
                onClick={handleCourierPickupCtaClick}
                className="text-sm md:text-base text-[#0077FE] hover:underline"
              >
                выбрать вариант доставки
              </button>
            </div>
          )}
          {!isOfferOnlyMode && !isRecipientFlow && showCourierPickupCta && (
            <div className="bg-white border border-[#E5E5E5] rounded-2xl px-4 py-5 md:px-6 md:py-6 mb-4 md:mb-6">
              <h2 className="text-lg md:text-2xl font-bold text-[#2D2D2D] mb-1">
                {hasPackageParams
                  ? "Параметры посылки учтены. Осталось оформить забор курьером."
                  : "Оформим доставку по фото"}
              </h2>
              <p className="text-xs md:text-sm text-[#2D2D2D] mb-4">
                {hasPackageParams
                  ? "Это займёт 1–2 шага"
                  : "Не нужно никуда идти — курьер приедет сам"}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (
                    typeof window !== "undefined" &&
                    typeof window.ym === "function"
                  ) {
                    window.ym(104664178, "params", {
                      offers: "оформить_отправку",
                    });
                  }
                  handleCourierPickupCtaClick();
                }}
                className="w-full bg-[#0077FE] text-white rounded-2xl px-4 py-3 md:py-4 text-base md:text-lg font-semibold hover:bg-[#0065D6] transition-colors"
              >
                👉 Оформить доставку
              </button>
            </div>
          )}
          {!isOfferOnlyMode && showAssistant && (
            <div className="bg-white border border-[#E5E5E5] rounded-2xl px-4 py-5 md:px-6 md:py-6 mb-4 md:mb-6">
              <h2 className="text-lg md:text-2xl font-bold text-[#2D2D2D] mb-1">
                Что отправляете?
              </h2>
              <p className="text-sm md:text-base text-[#2D2D2D] mb-4">
                Добавьте фото посылки — чтобы точнее подобрать доставку
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      typeof window !== "undefined" &&
                      typeof window.ym === "function"
                    ) {
                      window.ym(104664178, "params", {
                        offers: "габарит_по_фото",
                      });
                    }
                    const updatedWizardData = {
                      ...wizardData,
                      packageOption: "photo",
                      packageDataCompleted: false,
                    };
                    setWizardData(updatedWizardData);
                    navigate("/wizard?step=package", {
                      state: {
                        wizardData: updatedWizardData,
                        currentStep: "package",
                        returnToOffers: true,
                      },
                    });
                  }}
                  className="w-full bg-[#F5F5F5] text-[#2D2D2D] rounded-2xl px-4 py-3 md:py-4 text-base md:text-lg font-semibold hover:bg-[#E5E5E5] transition-colors"
                >
                  Добавить фото посылки
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      typeof window !== "undefined" &&
                      typeof window.ym === "function"
                    ) {
                      window.ym(104664178, "params", {
                        offers: "габарит_указал",
                      });
                    }
                    const updatedWizardData = {
                      ...wizardData,
                      packageOption: "manual",
                      packageDataCompleted: false,
                    };
                    setWizardData(updatedWizardData);
                    navigate("/wizard?step=package", {
                      state: {
                        wizardData: updatedWizardData,
                        currentStep: "package",
                        returnToOffers: true,
                      },
                    });
                  }}
                  className="text-sm md:text-base text-[#0077FE] hover:underline text-left"
                >
                  Указать размеры вручную
                </button>
              </div>
            </div>
          )}
          <div className="rounded-2xl mb-4 md:mb-6" id="offers-list">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-xl md:text-3xl text-center font-bold text-[#2D2D2D] px-2">
                Предложения по вашим параметрам 🔥
              </h1>
            </div>
            <p className="text-sm md:text-base text-center text-[#2D2D2D] mb-4 md:mb-6 px-2">
              Выберите наиболее подходящий вариант доставки 👇
            </p>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 mb-4 md:mb-2">
              <div className="grid grid-cols-2 gap-3 md:flex md:gap-4">
                <div className="flex flex-col gap-2">
                  <label
                    className="flex items-center justify-between md:justify-start gap-3 cursor-not-allowed bg-white border border-[#C8C7CC] rounded-full px-4 py-2 transition-shadow opacity-30  select-none"
                    style={{ cursor: "not-allowed" }}
                  >
                    <span className="text-xs md:text-sm text-[#2D2D2D] flex items-center gap-1">
                      Курьер забирает
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled={true}
                        readOnly={true}
                        className="sr-only"
                      />
                      <div className="w-11 h-6 rounded-full transition-colors duration-200 bg-[#0077FE]">
                        <div className="w-5 h-5 bg-white rounded-full transition-transform duration-200 mt-0.5 translate-y-0.5 translate-x-5"></div>
                      </div>
                    </div>
                  </label>
                </div>
                <label className="flex items-center justify-between md:justify-start gap-3 cursor-pointer bg-white border border-[#C8C7CC] rounded-full px-4 py-2 transition-shadow">
                  <span className="text-xs md:text-sm text-[#2D2D2D]">
                    Курьер привезет
                  </span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={filterCourierDelivery}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        if (
                          newValue &&
                          typeof window !== "undefined" &&
                          typeof window.ym === "function"
                        ) {
                          window.ym(104664178, "params", { offers: "курьер" });
                        }
                        setFilterCourierDelivery(newValue);
                        localStorage.setItem(
                          "filterCourierDelivery",
                          String(newValue),
                        );
                        setWizardData((prev) => {
                          const updated = {
                            ...prev,
                            filterCourierDelivery: newValue,
                          };
                          return updated;
                        });
                      }}
                      className="sr-only"
                    />
                    <div
                      className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                        filterCourierDelivery ? "bg-[#0077FE]" : "bg-[#E5E5E5]"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 mt-0.5 translate-y-0.5 ${
                          filterCourierDelivery
                            ? "translate-x-5"
                            : "translate-x-0.5"
                        }`}
                      ></div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
            <div className="bg-white border border-[#E5E5E5] rounded-2xl px-4 py-3 text-[#2D2D2D]">
              <div className="text-xs md:text-sm font-semibold">
                🚚 Курьер заберёт посылку бесплатно
              </div>
              <div className="text-xs md:text-sm text-[#858585]">
                от двери отправителя — включено в Pochtahub
              </div>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-auto md:ml-auto mt-2 md:mt-3 px-4 py-2 border border-[#C8C7CC] rounded-xl text-xs md:text-sm text-[#2D2D2D] focus:outline-none focus:border-[#0077FE]"
            >
              <option value="price">По наилучшей цене</option>
              <option value="delivery_time">По скорости доставки</option>
            </select>

            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="relative flex items-center justify-between flex-row rounded-xl p-6 border-b-4 border-[#add3ff] rounded-b-2xl bg-white animate-pulse"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                      <div>
                        <div className="h-6 w-24 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="h-10 w-40 bg-gray-200 rounded-xl"></div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
              </div>
            )}

            {!loading && !error && sortedOffers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#858585]">Предложения не найдены</p>
              </div>
            )}

            {!loading && !error && sortedOffers.length > 0 && (
              <div className="relative pt-4">
                {isRecalculating && (
                  <div className="absolute inset-0 top-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center rounded-xl">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-[#0077FE] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-[#858585]">Пересчитываем...</p>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  {sortedOffers.map((offer, index) => {
                    const isCheapest = offer === cheapestOffer;
                    const isFastest = offer === fastestOffer;
                    const isCDEK =
                      offer.company_name === "CDEK" ||
                      offer.company_code === "cdek";

                    return (
                      <div
                        key={`${offer.company_id}-${offer.tariff_code || index}`}
                        className="relative flex flex-col md:flex-row md:items-center md:justify-between rounded-xl p-4 md:p-6 hover:shadow-lg transition-shadow border-b-4 border-[#add3ff] rounded-b-2xl bg-white gap-3 md:gap-4"
                      >
                        {(isCheapest || isFastest) && (
                          <div className="absolute -top-3 left-3 md:left-4 z-10">
                            {isCheapest && (
                              <span className="px-2 md:px-3 py-1 bg-[#35c353] text-white rounded-full text-xs font-semibold">
                                Самый дешевый
                              </span>
                            )}
                            {isFastest && !isCheapest && (
                              <span className="px-2 md:px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold shadow-md">
                                Самый быстрый
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-3 md:gap-4 flex-1">
                          {offer.company_logo ? (
                            <img
                              src={getMediaUrl(offer.company_logo)}
                              alt={offer.company_name}
                              className="w-10 h-10 md:w-12 md:h-12 object-contain"
                            />
                          ) : isCDEK ? (
                            <img
                              src={cdekIcon}
                              alt="CDEK"
                              className="w-10 h-10 md:w-12 md:h-12"
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 md:w-12 md:h-12 rounded-full ${getCompanyColor(index)} flex items-center justify-center text-white text-base md:text-lg font-bold`}
                            >
                              {getCompanyInitial(offer.company_name)}
                            </div>
                          )}
                          <div>
                            <p className="text-base md:text-lg font-bold text-[#2D2D2D]">
                              {offer.price
                                ? Number(offer.price).toLocaleString("ru-RU")
                                : "?"}
                              ₽
                            </p>
                            <p className="text-xs md:text-sm text-[#858585]">
                              {offer.delivery_time_min &&
                              offer.delivery_time_max
                                ? `Доставка за ${offer.delivery_time_min}-${offer.delivery_time_max} дн.`
                                : offer.delivery_time
                                  ? `Доставка за ${offer.delivery_time} ${offer.delivery_time === 1 ? "дн." : "дн."}`
                                  : "Срок доставки уточняется"}
                            </p>
                            {(deliveryName || offer.company_name) && (
                              <p className="text-xs md:text-sm text-[#2D2D2D] mt-1 font-medium">
                                {deliveryName || offer.company_name}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4">
                          {filterCourierPickup && (
                            <span className="text-xs text-[#2D2D2D] flex items-center gap-1 whitespace-nowrap">
                              <span className="text-green-500">✓</span> Курьер
                              забирает
                            </span>
                          )}
                          {filterCourierDelivery && (
                            <span className="text-xs text-[#2D2D2D] flex items-center gap-1 whitespace-nowrap">
                              <span className="text-green-500">✓</span> Курьер
                              привезет
                            </span>
                          )}
                        </div>

                        {!isFromUrl && (
                          <button
                            onClick={() => handleSelectOffer(offer)}
                            className={`w-full md:w-auto px-4 md:px-3 py-3 md:py-3 rounded-xl font-semibold transition-colors text-sm whitespace-nowrap
 ${
   isCheapest || isFastest
     ? "bg-[#0077FE] text-white hover:bg-[#0066CC]"
     : "bg-[#F5F5F5] text-[#2D2D2D] hover:bg-[#E5E5E5]"
 }`}
                          >
                            Выбрать этот вариант
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {!isFromUrl && (
            <div className="bg-white rounded-2xl p-4 md:p-8 relative">
              <h2 className="text-xl md:text-2xl font-bold text-[#2D2D2D] mb-2">
                Сомневаешься что выбрать?
              </h2>
              <p className="text-sm md:text-base text-[#2D2D2D] mb-4 md:mb-6">
                Поделись расчётом с получателем, он сам выберет
              </p>
              <button
                onClick={handleShare}
                className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold hover:bg-[#0066CC] transition-colors"
              >
                {shareSuccess ? "Ссылка скопирована!" : "Поделиться расчётом"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OffersPage;
