import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Функция для логирования данных визарда
const logWizardStep = (step, data) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    step,
    data: JSON.parse(JSON.stringify(data)), // Глубокое копирование
  };

  // Сохраняем в localStorage
  const existingLogs = JSON.parse(localStorage.getItem("wizard_logs") || "[]");
  existingLogs.push(logEntry);
  localStorage.setItem("wizard_logs", JSON.stringify(existingLogs));

  // Выводим в консоль
  console.log(`📝 [WIZARD LOG] Step: ${step}`, logEntry);

  // Ограничиваем размер (храним последние 100 записей)
  if (existingLogs.length > 100) {
    existingLogs.shift();
    localStorage.setItem("wizard_logs", JSON.stringify(existingLogs));
  }
};

// Функция для экспорта логов в JSON файл
const exportWizardLogs = () => {
  const logs = JSON.parse(localStorage.getItem("wizard_logs") || "[]");
  const dataStr = JSON.stringify(logs, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `wizard_logs_${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  console.log("✅ Логи экспортированы в файл");
};

// Добавляем функцию в window для доступа из консоли
if (typeof window !== "undefined") {
  window.exportWizardLogs = exportWizardLogs;
  window.clearWizardLogs = () => {
    localStorage.removeItem("wizard_logs");
    console.log("🗑️ Логи очищены");
  };
}
import WizardLayout from "../components/wizard/WizardLayout";
import PackageStep from "./wizard/steps/PackageStep";
import ContactPhoneStep from "./wizard/steps/ContactPhoneStep";
import PickupAddressStep from "./wizard/steps/PickupAddressStep";
import RecipientPhoneStep from "./wizard/steps/RecipientPhoneStep";
import PaymentStep from "./wizard/steps/PaymentStep";
import RecipientAddressStep from "./wizard/steps/RecipientAddressStep";
import RecipientFIOStep from "./wizard/steps/RecipientFIOStep";
import DeliveryAddressStep from "./wizard/steps/DeliveryAddressStep";
import RecipientRouteStep from "./wizard/steps/RecipientRouteStep";
import SelectPvzStep from "./wizard/steps/SelectPvzStep";
import OrderCompleteStep from "./wizard/steps/OrderCompleteStep";
import EmailStep from "./wizard/steps/EmailStep";
import RoleSelectStep from "./wizard/steps/RoleSelectStep";
import { authAPI, ordersAPI, tariffsAPI, usersAPI } from "../api";

function WizardPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(location.search);
  const stepFromUrl = urlParams.get("step");

  const validSteps = [
    "role",
    "recipientRoute",
    "package",
    "contactPhone",
    "pickupAddress",
    "recipientPhone",
    "payment",
    "recipientAddress",
    "recipientFIO",
    "deliveryAddress",
    "recipientUserPhone",
    "senderPhone",
    "senderAddress",
    "selectPvz",
    "email",
    "orderComplete",
  ];
  const senderSteps = new Set([
    "contactPhone",
    "pickupAddress",
    "recipientPhone",
    "payment",
    "recipientAddress",
    "selectPvz",
    "email",
    "orderComplete",
  ]);
  const recipientSteps = new Set([
    "recipientRoute",
    "recipientUserPhone",
    "senderAddress",
  ]);

  const getRoleForStep = (step) => {
    if (senderSteps.has(step)) return "sender";
    if (recipientSteps.has(step)) return "recipient";
    return null;
  };
  const initialStep = (() => {
    if (stepFromUrl && validSteps.includes(stepFromUrl)) {
      return stepFromUrl;
    }
    const initialRole = location.state?.wizardData?.selectedRole;
    if (initialRole) {
      return "recipientRoute";
    }
    return "role";
  })();

  const [fromCity, setFromCity] = useState(
    location.state?.fromCity || location.state?.wizardData?.fromCity || "",
  );
  const [toCity, setToCity] = useState(
    location.state?.toCity || location.state?.wizardData?.toCity || "",
  );
  const [selectedRole, setSelectedRole] = useState(
    location.state?.wizardData?.selectedRole || null,
  );
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const stepFromUrl = urlParams.get("step");
    const fallbackStep = selectedRole ? "recipientRoute" : "role";
    if (
      stepFromUrl &&
      validSteps.includes(stepFromUrl) &&
      stepFromUrl !== currentStep
    ) {
      setCurrentStep(stepFromUrl);
    } else if (!stepFromUrl && currentStep !== fallbackStep) {
      navigate(`/wizard?step=${fallbackStep}`, { replace: true });
    }

    const roleForStep = getRoleForStep(stepFromUrl);
    if (!selectedRole && roleForStep) {
      setSelectedRole(roleForStep);
    }
  }, [location.search, currentStep, selectedRole]);

  useEffect(() => {
    const wizardData = location.state?.wizardData;
    const stepFromUrl =
      new URLSearchParams(location.search).get("step") || "package";

    // Логируем загрузку шага
    logWizardStep(`load_${stepFromUrl}`, {
      locationState: location.state,
      wizardData: wizardData,
      urlParams: location.search,
    });

    if (location.state?.fromCity) {
      setFromCity(location.state.fromCity);
    }
    if (location.state?.toCity) {
      setToCity(location.state.toCity);
    }
    if (wizardData) {
      if (wizardData.fromCity) setFromCity(wizardData.fromCity);
      if (wizardData.toCity) setToCity(wizardData.toCity);
      if (wizardData.pickupAddress) setPickupAddress(wizardData.pickupAddress);
      if (wizardData.pickupSenderName)
        setPickupSenderName(wizardData.pickupSenderName);
      if (wizardData.recipientPhone)
        setRecipientPhone(wizardData.recipientPhone);
      if (wizardData.contactPhone) setContactPhone(wizardData.contactPhone);
      if (wizardData.recipientAddress)
        setRecipientAddress(wizardData.recipientAddress);
      if (wizardData.recipientFIO) setRecipientFIO(wizardData.recipientFIO);
      if (wizardData.deliveryAddress)
        setDeliveryAddress(wizardData.deliveryAddress);
      if (wizardData.recipientUserPhone)
        setRecipientUserPhone(wizardData.recipientUserPhone);
      if (wizardData.senderPhone) setSenderPhone(wizardData.senderPhone);
      if (wizardData.senderAddress) setSenderAddress(wizardData.senderAddress);
      if (wizardData.senderFIO) setSenderFIO(wizardData.senderFIO);
      if (wizardData.recipientDeliveryPointCode)
        setRecipientDeliveryPointCode(wizardData.recipientDeliveryPointCode);
      if (wizardData.recipientDeliveryPointAddress)
        setRecipientDeliveryPointAddress(
          wizardData.recipientDeliveryPointAddress,
        );
      if (wizardData.weight) setWeight(wizardData.weight);
      if (wizardData.length) setLength(wizardData.length);
      if (wizardData.width) setWidth(wizardData.width);
      if (wizardData.height) setHeight(wizardData.height);
      if (wizardData.selectedRole) setSelectedRole(wizardData.selectedRole);
      if (wizardData.photoUrl) setPhotoUrl(wizardData.photoUrl);
      if (wizardData.estimatedValue)
        setEstimatedValue(wizardData.estimatedValue);
    }
    if (location.state?.selectedOffer || wizardData?.selectedOffer) {
      setSelectedOffer(
        location.state?.selectedOffer || wizardData?.selectedOffer,
      );
    }
  }, [location.state]);

  // Package data
  const [packageOption, setPackageOption] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState(null);
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [estimatedValue, setEstimatedValue] = useState(
    location.state?.wizardData?.estimatedValue || "",
  );
  const [selectedSize, setSelectedSize] = useState(null);

  // Contact phone data
  const [contactPhone, setContactPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [telegramSent, setTelegramSent] = useState(false);

  // Pickup address data
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupSenderName, setPickupSenderName] = useState("");

  // Recipient phone data
  const [recipientPhone, setRecipientPhone] = useState("");

  // Recipient user phone data (for recipient flow)
  const [recipientUserPhone, setRecipientUserPhone] = useState("");
  const [recipientUserSmsCode, setRecipientUserSmsCode] = useState("");
  const [recipientUserCodeSent, setRecipientUserCodeSent] = useState(false);
  const [recipientUserCodeLoading, setRecipientUserCodeLoading] =
    useState(false);
  const [recipientUserCodeError, setRecipientUserCodeError] = useState("");
  const [recipientUserTelegramSent, setRecipientUserTelegramSent] =
    useState(false);

  // Sender phone data (for recipient flow)
  const [senderPhone, setSenderPhone] = useState("");

  // Sender address data (for recipient flow)
  const [senderAddress, setSenderAddress] = useState("");
  const [senderFIO, setSenderFIO] = useState("");

  // Recipient address data
  const [recipientAddress, setRecipientAddress] = useState("");
  const [recipientFIO, setRecipientFIO] = useState("");
  const [recipientFioFocused, setRecipientFioFocused] = useState(false);

  // Delivery address data (for recipient flow)
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryAddressError, setDeliveryAddressError] = useState("");

  // Delivery point data
  const [recipientDeliveryPointCode, setRecipientDeliveryPointCode] =
    useState(null);
  const [recipientDeliveryPointAddress, setRecipientDeliveryPointAddress] =
    useState("");

  // Payment data
  const [paymentPayer, setPaymentPayer] = useState(null);

  // Email data
  const [email, setEmail] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [agreePersonalData, setAgreePersonalData] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const [selectedOffer, setSelectedOffer] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    let isMounted = true;
    usersAPI
      .getProfile()
      .then((response) => {
        if (isMounted) {
          setProfile(response.data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!profile) return;

    const profileFullName = [profile.first_name, profile.last_name]
      .filter(Boolean)
      .join(" ");
    const profilePhone = profile.phone || "";
    const profileAddress = profile.address || "";
    const profileEmail = profile.email || "";

    if (selectedRole === "sender") {
      if (!contactPhone && profilePhone) setContactPhone(profilePhone);
      if (!pickupSenderName && profileFullName)
        setPickupSenderName(profileFullName);
      if (!senderFIO && profileFullName) setSenderFIO(profileFullName);
      if (!pickupAddress && profileAddress) setPickupAddress(profileAddress);
      if (!senderAddress && profileAddress) setSenderAddress(profileAddress);
      if (!email && profileEmail) setEmail(profileEmail);
    } else if (selectedRole === "recipient") {
      if (!recipientUserPhone && profilePhone)
        setRecipientUserPhone(profilePhone);
      if (!recipientFIO && profileFullName) setRecipientFIO(profileFullName);
      if (!deliveryAddress && profileAddress)
        setDeliveryAddress(profileAddress);
      if (!recipientAddress && profileAddress)
        setRecipientAddress(profileAddress);
      if (!email && profileEmail) setEmail(profileEmail);
    }
  }, [
    profile,
    selectedRole,
    contactPhone,
    pickupSenderName,
    senderFIO,
    pickupAddress,
    senderAddress,
    email,
    recipientUserPhone,
    recipientFIO,
    deliveryAddress,
    recipientAddress,
  ]);

  const handleCalculate = () => {
    if (!fromCity || !toCity) return;
    if (selectedRole === "recipient" && currentStep === "recipientRoute") {
      const existingWizardData = location.state?.wizardData || {};
      navigate("/wizard?step=package", {
        state: {
          wizardData: {
            ...existingWizardData,
            selectedRole: "recipient",
            fromCity: fromCity.trim(),
            toCity: toCity.trim(),
          },
        },
      });
      return;
    }
    const existingWizardData = location.state?.wizardData || {};
    navigate("/offers", {
      state: {
        wizardData: {
          fromCity,
          toCity,
          filterCourierPickup: existingWizardData.filterCourierPickup,
          filterCourierDelivery: existingWizardData.filterCourierDelivery,
        },
      },
    });
  };

  const resolveCityFromInputs = (cityValue, addressValue) => {
    const normalizedCity = (cityValue || "").trim();
    if (normalizedCity) return normalizedCity;

    const firstAddressChunk = (addressValue || "").split(",")[0]?.trim() || "";
    return firstAddressChunk.replace(/^(г\.?|город)\s*/i, "").trim();
  };

  const handleRoleSelect = (role) => {
    const wizardData = {
      ...location.state?.wizardData,
      selectedRole: role,
      fromCity,
      toCity,
    };
    setSelectedRole(role);
    logWizardStep("role", wizardData);
    navigate("/wizard?step=recipientRoute", {
      state: { wizardData },
    });
  };

  const handleRoleToggle = (role) => {
    if (role === selectedRole) return;

    const baseWizardData = {
      ...location.state?.wizardData,
      selectedRole: role,
      fromCity,
      toCity,
    };

    if (role === "recipient") {
      if (contactPhone && !recipientUserPhone) {
        setRecipientUserPhone(contactPhone);
      }
      if (codeSent) {
        setCodeSent(false);
        setSmsCode("");
        setCodeError("");
        setTelegramSent(false);
      }
      const wizardData = {
        ...baseWizardData,
        recipientUserPhone: contactPhone || recipientUserPhone,
      };
      setSelectedRole("recipient");
      navigate("/wizard?step=recipientRoute", {
        state: { wizardData },
      });
      return;
    }

    if (recipientUserPhone && !contactPhone) {
      setContactPhone(recipientUserPhone);
    }
    if (recipientUserCodeSent) {
      setRecipientUserCodeSent(false);
      setRecipientUserSmsCode("");
      setRecipientUserCodeError("");
      setRecipientUserTelegramSent(false);
    }
    const wizardData = {
      ...baseWizardData,
      contactPhone: recipientUserPhone || contactPhone,
    };
    setSelectedRole("sender");
    navigate("/wizard?step=recipientRoute", {
      state: { wizardData },
    });
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError("Файл слишком большой. Максимальный размер 5 МБ.");
        setPhotoPreview(null);
        setPhotoFile(null);
        setPhotoUrl(null);
        setPhotoAnalysis(null);
      } else {
        setPhotoError("");
        setPhotoFile(file);
        setPhotoAnalyzing(true);
        setPhotoAnalysis(null);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result);
        };
        reader.readAsDataURL(file);

        try {
          const formData = new FormData();
          formData.append("image", file);
          const uploadResponse = await ordersAPI.uploadPackageImage(formData);
          if (uploadResponse.data?.success && uploadResponse.data?.image_url) {
            setPhotoUrl(uploadResponse.data.image_url);
          }

          const analyzeFormData = new FormData();
          analyzeFormData.append("image", file);
          const analyzeResponse =
            await tariffsAPI.analyzeImage(analyzeFormData);
          if (analyzeResponse.data) {
            setPhotoAnalysis(analyzeResponse.data);
            if (analyzeResponse.data.length)
              setLength(analyzeResponse.data.length.toString());
            if (analyzeResponse.data.width)
              setWidth(analyzeResponse.data.width.toString());
            if (analyzeResponse.data.height)
              setHeight(analyzeResponse.data.height.toString());
            if (analyzeResponse.data.weight)
              setWeight(analyzeResponse.data.weight.toString());
            if (analyzeResponse.data.declared_value) {
              const declaredValue =
                analyzeResponse.data.declared_value.toString();
              setEstimatedValue(declaredValue);
            }
          }
        } catch (err) {
          console.error("Ошибка обработки изображения:", err);
          setPhotoError(
            err.response?.data?.error || "Ошибка обработки изображения",
          );
        } finally {
          setPhotoAnalyzing(false);
        }
      }
    }
  };

  const handlePhotoRemove = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    setPhotoUrl(null);
    setPhotoAnalysis(null);
    setPhotoAnalyzing(false);
    setPhotoError("");
    const input = document.getElementById("photo-upload");
    if (input) input.value = "";
    const inputReplace = document.getElementById("photo-replace");
    if (inputReplace) inputReplace.value = "";
  };

  const handlePackageContinue = () => {
    const roleToUse = selectedRole || "sender";
    if (!selectedRole) {
      setSelectedRole("sender");
    }

    let finalWeight = weight;
    let finalLength = length;
    let finalWidth = width;
    let finalHeight = height;

    if (packageOption === "unknown" && selectedSize) {
      const sizePresetMap = {
        smartphone: { weight: "1", length: "17", width: "12", height: "9" },
        iron: { weight: "3", length: "21", width: "20", height: "11" },
        shoes: { weight: "7", length: "33", width: "25", height: "15" },
        microwave: { weight: "15", length: "42", width: "35", height: "30" },
      };
      const preset = sizePresetMap[selectedSize];
      if (preset) {
        finalWeight = preset.weight;
        finalLength = preset.length;
        finalWidth = preset.width;
        finalHeight = preset.height;
      }
    }

    const currentWizardData = {
      ...location.state?.wizardData,
      selectedRole: roleToUse,
      weight: finalWeight,
      length: finalLength,
      width: finalWidth,
      height: finalHeight,
      estimatedValue,
      selectedSize,
      packageOption,
      packageDataCompleted: true,
      offerOnlyMode: true,
      photoUrl,
    };
    logWizardStep("package", currentWizardData);

    navigate("/offers", {
      state: {
        wizardData: currentWizardData,
        packageUpdated: true,
        focusOfferSelection: true,
      },
    });
  };

  const handleRecipientRouteContinue = () => {
    if (!fromCity?.trim() || !toCity?.trim()) {
      return;
    }

    const currentWizardData = {
      ...location.state?.wizardData,
      selectedRole: selectedRole || location.state?.wizardData?.selectedRole,
      fromCity: fromCity.trim(),
      toCity: toCity.trim(),
    };

    navigate("/wizard?step=package", {
      state: { wizardData: currentWizardData },
    });
  };

  const handleRecipientFIOContinue = () => {
    const currentWizardData = {
      ...location.state?.wizardData,
      recipientFIO,
    };
    logWizardStep("recipientFIO", currentWizardData);

    if (selectedRole === "recipient") {
      const offer =
        selectedOffer ||
        location.state?.selectedOffer ||
        location.state?.wizardData?.selectedOffer;
      const filterCourierDelivery =
        location.state?.wizardData?.filterCourierDelivery || false;
      const isCDEK =
        offer?.company_name === "CDEK" || offer?.company_code === "cdek";
      const PVZ_TARIFFS = [
        136, 138, 62, 63, 233, 234, 235, 236, 237, 238, 239, 240,
      ];
      const isPvzFlow =
        Boolean(offer) &&
        !filterCourierDelivery &&
        isCDEK &&
        PVZ_TARIFFS.includes(offer?.tariff_code);

      navigate(
        isPvzFlow
          ? "/wizard?step=recipientUserPhone"
          : "/wizard?step=deliveryAddress",
        {
          state: { wizardData: currentWizardData },
        },
      );
    }
  };

  const handleDeliveryAddressContinue = () => {
    const trimmedAddress = deliveryAddress.trim();

    if (!trimmedAddress) {
      setDeliveryAddressError("Укажите адрес доставки");
      return;
    }

    const hasHouseNumber = /\d/.test(trimmedAddress);
    if (!hasHouseNumber) {
      setDeliveryAddressError("Укажите номер дома в адресе");
      return;
    }

    setDeliveryAddressError("");
    const currentWizardData = {
      ...location.state?.wizardData,
      deliveryAddress: trimmedAddress,
    };
    logWizardStep("deliveryAddress", currentWizardData);

    if (selectedRole === "recipient") {
      navigate("/wizard?step=recipientUserPhone", {
        state: { wizardData: currentWizardData },
      });
    }
  };

  const handleRecipientUserSendCode = async (method = "telegram") => {
    if (!recipientUserPhone) {
      setRecipientUserCodeError("Введите номер телефона");
      return;
    }

    setRecipientUserCodeLoading(true);
    setRecipientUserCodeError("");

    const TEST_PHONES = ["+79999999999", "+79991111111", "+79990000000"];
    const TEST_CODE = "1234";

    const cleanPhone = recipientUserPhone.replace(/\D/g, "");
    const isTestPhone = TEST_PHONES.some((testPhone) =>
      cleanPhone.includes(testPhone.replace(/\D/g, "")),
    );

    if (isTestPhone) {
      setTimeout(() => {
        setRecipientUserCodeSent(true);
        if (method === "telegram") {
          setRecipientUserTelegramSent(true);
        }
        setRecipientUserCodeLoading(false);
        console.log(
          "🔧 Тестовый режим: код отправлен для номера",
          recipientUserPhone,
        );
        console.log("🔧 Тестовый код:", TEST_CODE);
      }, 500);
      return;
    }

    try {
      const response = await authAPI.sendCode(recipientUserPhone, method);
      if (response.data?.success || response.data?.telegram_sent) {
        if (response.data?.telegram_sent) {
          setRecipientUserTelegramSent(true);
        }
        setRecipientUserCodeSent(true);
      } else {
        setRecipientUserCodeError(
          response.data?.error || "Ошибка отправки кода",
        );
      }
    } catch (err) {
      const errorData = err.response?.data;
      setRecipientUserCodeError(
        errorData?.error || err.message || "Ошибка отправки кода",
      );
    } finally {
      setRecipientUserCodeLoading(false);
    }
  };

  const completeRecipientFlow = () => {
    const existingWizardData = location.state?.wizardData || {};
    const offer =
      selectedOffer ||
      location.state?.selectedOffer ||
      existingWizardData.selectedOffer;

    if (!offer) {
      navigate("/offers", {
        state: {
          wizardData: {
            ...existingWizardData,
            selectedRole: "recipient",
            fromCity,
            toCity,
          },
        },
      });
      return;
    }

    const filterCourierDelivery =
      existingWizardData.filterCourierDelivery || false;
    const requiresPvzSelection = needsPvzSelection(
      offer,
      filterCourierDelivery,
    );

    const resolvedFromCity = resolveCityFromInputs(fromCity, senderAddress);
    const resolvedToCity = resolveCityFromInputs(
      toCity,
      deliveryAddress || recipientDeliveryPointAddress,
    );

    if (requiresPvzSelection && !recipientDeliveryPointCode) {
      navigate("/wizard?step=selectPvz", {
        state: {
          ...location.state,
          selectedOffer: offer,
          wizardData: {
            ...existingWizardData,
            fromCity: resolvedFromCity || fromCity,
            toCity: resolvedToCity || toCity,
            selectedRole: "recipient",
            selectedOffer: offer,
            senderAddress,
            senderFIO,
            senderPhone,
            pickupSenderName: senderFIO,
            recipientFIO,
            recipientPhone: recipientUserPhone,
            recipientUserPhone,
            contactPhone: recipientUserPhone,
            filterCourierDelivery,
          },
        },
      });
      return;
    }

    const recipientAddressToUse = requiresPvzSelection
      ? recipientDeliveryPointAddress ||
        existingWizardData.recipientDeliveryPointAddress ||
        ""
      : deliveryAddress || existingWizardData.deliveryAddress || "";

    const wizardDataForPayment = {
      ...existingWizardData,
      fromCity: resolvedFromCity || fromCity,
      toCity: resolvedToCity || toCity,
      senderAddress,
      pickupAddress: senderAddress,
      senderFIO,
      senderName: senderFIO,
      pickupSenderName: senderFIO,
      senderPhone,
      recipientFIO,
      recipientName: recipientFIO,
      recipientPhone: recipientUserPhone,
      recipientUserPhone,
      contactPhone: recipientUserPhone,
      deliveryAddress: recipientAddressToUse,
      recipientAddress: recipientAddressToUse,
      recipientDeliveryPointCode: recipientDeliveryPointCode || null,
      recipientDeliveryPointAddress: recipientDeliveryPointAddress || "",
      weight: weight || existingWizardData.weight || "1",
      length: length || existingWizardData.length || "0",
      width: width || existingWizardData.width || "0",
      height: height || existingWizardData.height || "0",
      packageOption: packageOption || existingWizardData.packageOption,
      selectedSize: selectedSize || existingWizardData.selectedSize,
      estimatedValue: estimatedValue || existingWizardData.estimatedValue,
      photoUrl: photoUrl || existingWizardData.photoUrl,
      selectedOffer: offer,
      selectedRole: "recipient",
      paymentPayer: "me",
      filterCourierPickup: existingWizardData.filterCourierPickup,
      filterCourierDelivery,
      needsPackaging: existingWizardData.needsPackaging === true,
    };

    navigate("/payment", {
      state: {
        wizardData: wizardDataForPayment,
        company: offer.company_id,
        companyName: offer.company_name,
        companyCode: offer.company_code,
        companyLogo: offer.company_logo,
        price: offer.price,
        tariffCode: offer.tariff_code,
        tariffName: offer.tariff_name,
        deliveryTime: offer.delivery_time,
        insuranceCost: offer.insurance_cost || null,
      },
    });
  };

  const handleRecipientUserVerifyCode = async (code = null) => {
    const codeToVerify = code || recipientUserSmsCode;
    if (!codeToVerify || codeToVerify.length !== 4) {
      setRecipientUserCodeError("Введите код");
      return;
    }

    setRecipientUserCodeLoading(true);
    setRecipientUserCodeError("");

    const TEST_PHONES = ["+79999999999", "+79991111111", "+79990000000"];
    const TEST_CODE = "1234";

    const cleanPhone = recipientUserPhone.replace(/\D/g, "");
    const isTestPhone = TEST_PHONES.some((testPhone) =>
      cleanPhone.includes(testPhone.replace(/\D/g, "")),
    );

    if (isTestPhone && codeToVerify === TEST_CODE) {
      setTimeout(() => {
        setRecipientUserCodeSent(false);
        setRecipientUserSmsCode("");
        setRecipientUserCodeError("");
        setRecipientUserTelegramSent(false);
        setRecipientUserCodeLoading(false);
        console.log("🔧 Тестовый режим: код верифицирован успешно");
        if (selectedRole === "recipient") {
          completeRecipientFlow();
        }
      }, 500);
      return;
    }

    if (isTestPhone && codeToVerify !== TEST_CODE) {
      setRecipientUserCodeError("Неверный код. Тестовый код: " + TEST_CODE);
      setRecipientUserCodeLoading(false);
      return;
    }

    try {
      await authAPI.verifyCode(recipientUserPhone, codeToVerify);
      setRecipientUserCodeSent(false);
      setRecipientUserSmsCode("");
      setRecipientUserCodeError("");
      setRecipientUserTelegramSent(false);
      if (selectedRole === "recipient") {
        completeRecipientFlow();
      }
    } catch (err) {
      setRecipientUserCodeError(
        err.response?.data?.error || err.message || "Неверный код",
      );
    } finally {
      setRecipientUserCodeLoading(false);
    }
  };

  const handleRecipientUserResendCode = async () => {
    if (recipientUserPhone) {
      await handleRecipientUserSendCode("sms");
    }
  };

  const handleRecipientUserPhoneContinue = () => {
    if (!recipientUserPhone) {
      setRecipientUserCodeError("Введите номер телефона");
      return;
    }
    setRecipientUserCodeError("");
    handleRecipientUserSendCode("sms");
  };

  const handleSenderAddressContinue = () => {
    const trimmedAddress = senderAddress?.trim() || "";
    if (!trimmedAddress) {
      return;
    }

    const hasHouseNumber = /\d/.test(trimmedAddress);
    if (!hasHouseNumber) {
      return;
    }

    const trimmedSenderPhone = senderPhone?.trim() || "";
    if (!trimmedSenderPhone) {
      return;
    }

    if (!senderFIO?.trim()) {
      return;
    }

    const resolvedFromCity = resolveCityFromInputs(fromCity, senderAddress);
    if (!resolvedFromCity) {
      return;
    }

    if (!fromCity && resolvedFromCity) {
      setFromCity(resolvedFromCity);
    }

    if (selectedRole === "recipient") {
      const existingWizardData = location.state?.wizardData || {};
      navigate("/wizard?step=recipientAddress", {
        state: {
          ...location.state,
          wizardData: {
            ...existingWizardData,
            fromCity: resolvedFromCity,
            toCity: toCity || existingWizardData.toCity || "",
            senderAddress,
            senderPhone,
            senderFIO,
            pickupSenderName: senderFIO,
            selectedRole: "recipient",
          },
        },
      });
    }
  };

  // Тестовые номера для разработки (не требуют реальной отправки SMS)
  const TEST_PHONES = ["+79999999999", "+79991111111", "+79990000000"];
  const TEST_CODE = "1234";

  const handleSendCode = async (method = "telegram") => {
    if (!contactPhone) {
      setCodeError("Введите номер телефона");
      return;
    }

    // Проверка на тестовый номер
    const cleanPhone = contactPhone.replace(/\D/g, "");
    const isTestPhone = TEST_PHONES.some((testPhone) =>
      cleanPhone.includes(testPhone.replace(/\D/g, "")),
    );

    if (isTestPhone) {
      // Фейковая отправка кода для тестового номера
      setCodeLoading(true);
      setTimeout(() => {
        setCodeSent(true);
        if (method === "telegram") {
          setTelegramSent(true);
        }
        setCodeLoading(false);
        console.log(
          "🔧 Тестовый режим: код отправлен для номера",
          contactPhone,
        );
        console.log("🔧 Тестовый код:", TEST_CODE);
      }, 500);
      return;
    }

    // Реальная отправка кода
    setCodeLoading(true);
    setCodeError("");
    setTelegramSent(false);
    try {
      const response = await authAPI.sendCode(contactPhone, method);
      if (response.data?.success || response.data?.telegram_sent) {
        if (response.data?.telegram_sent) {
          setTelegramSent(true);
        }
        setCodeSent(true);
      } else {
        setCodeError(response.data?.error || "Ошибка отправки кода");
      }
    } catch (err) {
      const errorData = err.response?.data;
      setCodeError(errorData?.error || err.message || "Ошибка отправки кода");
    } finally {
      setCodeLoading(false);
    }
  };

  const handleVerifyCode = async (code = null) => {
    const codeToVerify = code || smsCode;
    if (!codeToVerify || codeToVerify.length !== 4) {
      setCodeError("Введите код");
      return;
    }

    const inviteRecipient =
      location.state?.inviteRecipient ||
      location.state?.wizardData?.inviteRecipient ||
      false;

    // Проверка на тестовый номер и код
    const cleanPhone = contactPhone.replace(/\D/g, "");
    const isTestPhone = TEST_PHONES.some((testPhone) =>
      cleanPhone.includes(testPhone.replace(/\D/g, "")),
    );

    if (isTestPhone && codeToVerify === TEST_CODE) {
      setCodeLoading(true);
      setTimeout(() => {
        const testAccessToken = "test_access_token_" + Date.now();
        const testRefreshToken = "test_refresh_token_" + Date.now();
        localStorage.setItem("access_token", testAccessToken);
        localStorage.setItem("refresh_token", testRefreshToken);
        console.log(
          "🔧 Тестовый режим: код верифицирован успешно, токены сохранены",
        );
        window.dispatchEvent(new CustomEvent("authChange"));
        setCodeSent(false);
        setSmsCode("");
        setCodeError("");
        setTelegramSent(false);
        setCodeLoading(false);
        if (selectedRole === "sender") {
          if (inviteRecipient) {
            const wizardDataForOrder = {
              fromCity,
              toCity,
              pickupAddress,
              pickupSenderName,
              recipientPhone,
              contactPhone,
              weight: weight || "1",
              length: length || "0",
              width: width || "0",
              height: height || "0",
              packageOption,
              selectedSize,
              estimatedValue,
              selectedRole: "sender",
              inviteRecipient: true,
              photoUrl,
            };
            navigate("/wizard?step=orderComplete", {
              state: {
                wizardData: wizardDataForOrder,
                inviteRecipient: true,
                selectedRole: "sender",
              },
            });
          } else {
            navigate("/wizard?step=pickupAddress");
          }
        }
      }, 500);
      return;
    }

    if (isTestPhone && codeToVerify !== TEST_CODE) {
      setCodeError("Неверный код. Тестовый код: " + TEST_CODE);
      return;
    }

    // Реальная верификация кода
    setCodeLoading(true);
    setCodeError("");
    try {
      console.log("🔐 Начало верификации кода для телефона:", contactPhone);
      const response = await authAPI.verifyCode(contactPhone, codeToVerify);
      console.log("🔐 Ответ от API верификации:", response.data);
      if (response.data && response.data.tokens) {
        console.log("✅ Токены получены:", {
          access: response.data.tokens.access ? "есть" : "нет",
          refresh: response.data.tokens.refresh ? "есть" : "нет",
        });
        localStorage.setItem("access_token", response.data.tokens.access);
        localStorage.setItem("refresh_token", response.data.tokens.refresh);
        const savedToken = localStorage.getItem("access_token");
        console.log(
          "💾 Токен сохранен в localStorage:",
          savedToken ? "ДА (длина: " + savedToken.length + ")" : "НЕТ",
        );
        window.dispatchEvent(new CustomEvent("authChange"));
      } else {
        console.log("⚠️ Токены не получены в ответе");
      }
      setCodeSent(false);
      setSmsCode("");
      setCodeError("");
      setTelegramSent(false);
      if (selectedRole === "sender") {
        if (inviteRecipient) {
          const wizardDataForOrder = {
            fromCity,
            toCity,
            pickupAddress,
            pickupSenderName,
            recipientPhone,
            contactPhone,
            weight: weight || "1",
            length: length || "0",
            width: width || "0",
            height: height || "0",
            packageOption,
            selectedSize,
            estimatedValue,
            selectedRole: "sender",
            inviteRecipient: true,
          };
          navigate("/wizard?step=orderComplete", {
            state: {
              wizardData: wizardDataForOrder,
              inviteRecipient: true,
              selectedRole: "sender",
            },
          });
        } else {
          navigate("/wizard?step=pickupAddress");
        }
      }
    } catch (err) {
      setCodeError(err.response?.data?.error || err.message || "Неверный код");
    } finally {
      setCodeLoading(false);
    }
  };

  const handlePickupAddressContinue = () => {
    const inviteRecipient =
      location.state?.inviteRecipient ||
      location.state?.wizardData?.inviteRecipient ||
      false;
    if (selectedRole === "sender") {
      if (inviteRecipient) {
        navigate("/wizard?step=contactPhone", {
          state: { ...location.state, inviteRecipient: true },
        });
      } else {
        navigate("/wizard?step=recipientAddress");
      }
    }
  };

  const handleRecipientPhoneContinue = () => {
    const inviteRecipient =
      location.state?.inviteRecipient ||
      location.state?.wizardData?.inviteRecipient ||
      false;
    const returnToOffers = location.state?.returnToOffers || false;

    if (selectedRole === "sender") {
      if (inviteRecipient && returnToOffers) {
        const existingWizardData = location.state?.wizardData || {};
        const wizardData = {
          fromCity: fromCity.trim(),
          toCity: toCity.trim(),
          recipientPhone,
          selectedRole: "sender",
          inviteRecipient: true,
          filterCourierPickup: existingWizardData.filterCourierPickup,
          filterCourierDelivery: existingWizardData.filterCourierDelivery,
        };
        navigate("/offers", {
          state: { wizardData, recipientNotified: true },
        });
      } else {
        navigate("/wizard?step=payment");
      }
    }
  };

  const handlePaymentContinue = () => {
    if (paymentPayer === "recipient") {
      const inviteRecipient =
        location.state?.inviteRecipient ||
        location.state?.wizardData?.inviteRecipient ||
        false;
      const existingWizardData = location.state?.wizardData || {};

      const updatedWizardData = {
        ...existingWizardData,
        fromCity,
        toCity,
        pickupAddress: pickupAddress || existingWizardData.pickupAddress,
        senderAddress:
          pickupAddress || senderAddress || existingWizardData.senderAddress,
        pickupSenderName:
          pickupSenderName || existingWizardData.pickupSenderName,
        recipientPhone,
        contactPhone,
        recipientAddress:
          recipientAddress || existingWizardData.recipientAddress || "",
        deliveryAddress:
          recipientAddress ||
          existingWizardData.deliveryAddress ||
          existingWizardData.recipientAddress ||
          "",
        recipientFIO: recipientFIO || existingWizardData.recipientFIO || "",
        weight: weight || existingWizardData.weight || "1",
        length: length || existingWizardData.length || "0",
        width: width || existingWizardData.width || "0",
        height: height || existingWizardData.height || "0",
        packageOption: packageOption || existingWizardData.packageOption,
        selectedSize: selectedSize || existingWizardData.selectedSize,
        estimatedValue: estimatedValue || existingWizardData.estimatedValue,
        selectedRole: "sender",
        paymentPayer: "recipient",
        inviteRecipient,
        filterCourierPickup: existingWizardData.filterCourierPickup,
        filterCourierDelivery: existingWizardData.filterCourierDelivery,
        photoUrl: photoUrl || existingWizardData.photoUrl,
        needsPackaging: existingWizardData.needsPackaging === true,
      };

      console.log("📊 handlePaymentContinue:", {
        paymentPayer,
        inviteRecipient,
        needsPackaging: updatedWizardData.needsPackaging,
        selectedOffer: selectedOffer
          ? {
              company_name: selectedOffer.company_name,
              tariff_code: selectedOffer.tariff_code,
            }
          : null,
      });

      // Когда получатель платит - сразу переходим к завершению, без выбора ПВЗ
      console.log("🚀 Переход на orderComplete (recipient payer)");
      navigate("/wizard?step=orderComplete", {
        state: {
          ...location.state,
          wizardData: updatedWizardData,
        },
      });
    } else if (paymentPayer === "me") {
      const trimmedAddress = recipientAddress?.trim() || "";
      const hasHouseNumber = /\d/.test(trimmedAddress);
      if (!recipientFIO?.trim() || !recipientPhone?.trim()) {
        return;
      }
      const existingWizardData = location.state?.wizardData || {};
      const savedDelivery = localStorage.getItem("filterCourierDelivery");
      const filterCourierDelivery =
        existingWizardData.filterCourierDelivery !== undefined
          ? existingWizardData.filterCourierDelivery
          : savedDelivery !== null
            ? savedDelivery === "true"
            : false;
      const finalSelectedOffer =
        selectedOffer ||
        existingWizardData.selectedOffer ||
        location.state?.selectedOffer;
      const isPvzFlow = needsPvzSelection(
        finalSelectedOffer,
        filterCourierDelivery,
      );
      if (!isPvzFlow && (!trimmedAddress || !hasHouseNumber)) {
        return;
      }

      const resolvedFromCity = resolveCityFromInputs(
        fromCity,
        pickupAddress || senderAddress,
      );
      const resolvedToCity = resolveCityFromInputs(
        toCity,
        recipientAddress ||
          recipientDeliveryPointAddress ||
          deliveryAddress ||
          toCity,
      );

      if (!resolvedFromCity || !resolvedToCity) {
        return;
      }

      if (!fromCity && resolvedFromCity) {
        setFromCity(resolvedFromCity);
      }
      if (!toCity && resolvedToCity) {
        setToCity(resolvedToCity);
      }

      const wizardDataForOffers = {
        fromCity: resolvedFromCity,
        toCity: resolvedToCity,
        senderAddress: pickupAddress,
        pickupAddress: pickupAddress,
        deliveryAddress: isPvzFlow
          ? recipientDeliveryPointAddress || ""
          : recipientAddress,
        recipientAddress: isPvzFlow
          ? recipientDeliveryPointAddress || ""
          : recipientAddress,
        recipientDeliveryPointCode: recipientDeliveryPointCode || null,
        recipientDeliveryPointAddress: recipientDeliveryPointAddress || "",
        weight: weight || "1",
        length: length || "0",
        width: width || "0",
        height: height || "0",
        packageOption,
        selectedSize,
        estimatedValue,
        recipientPhone,
        contactPhone,
        recipientFIO,
        pickupSenderName,
        paymentPayer: "me",
        selectedRole: "sender",
        photoUrl,
        selectedOffer: finalSelectedOffer,
        returnToPayment: true,
        filterCourierPickup: existingWizardData.filterCourierPickup,
        filterCourierDelivery: filterCourierDelivery,
        needsPackaging: existingWizardData.needsPackaging === true,
      };

      navigate("/offers", {
        state: { wizardData: wizardDataForOffers },
      });
    }
  };

  const needsPvzSelection = (offer, filterCourierDelivery = false) => {
    console.log("🔍 WizardPage needsPvzSelection check:", {
      offer: offer
        ? {
            company_name: offer.company_name,
            company_code: offer.company_code,
            tariff_code: offer.tariff_code,
          }
        : null,
      filterCourierDelivery,
    });

    if (!offer) {
      console.log("❌ ПВЗ не нужен: нет оффера");
      return false;
    }

    if (filterCourierDelivery) {
      console.log("❌ ПВЗ не нужен: filterCourierDelivery = true");
      return false;
    }

    const isCDEK =
      offer.company_name === "CDEK" || offer.company_code === "cdek";
    if (!isCDEK) {
      console.log("❌ ПВЗ не нужен: не CDEK");
      return false;
    }

    const tariffCode = offer.tariff_code;
    if (!tariffCode) {
      console.log("❌ ПВЗ не нужен: нет tariff_code");
      return false;
    }

    const PVZ_TARIFFS = [
      136, 138, 62, 63, 233, 234, 235, 236, 237, 238, 239, 240,
    ];
    const needsPvz = PVZ_TARIFFS.includes(tariffCode);

    if (needsPvz) {
      console.log("✅ ПВЗ нужен: тариф", tariffCode, "в списке ПВЗ тарифов");
    } else {
      console.log(
        "❌ ПВЗ не нужен: тариф",
        tariffCode,
        "не в списке ПВЗ тарифов",
      );
    }

    return needsPvz;
  };

  const handleSelectPvzContinue = () => {
    if (!recipientDeliveryPointCode) {
      alert("Пожалуйста, выберите пункт выдачи");
      return;
    }
    if (selectedRole === "recipient") {
      completeRecipientFlow();
      return;
    }
    const existingWizardData = location.state?.wizardData || {};
    navigate("/wizard?step=email", {
      state: {
        ...location.state,
        wizardData: {
          ...existingWizardData,
          recipientDeliveryPointCode,
          recipientDeliveryPointAddress,
          needsPackaging: existingWizardData.needsPackaging === true,
        },
      },
    });
  };

  const handleEmailContinue = () => {
    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      alert("Пожалуйста, введите корректный email адрес");
      return;
    }

    if (!agreePersonalData) {
      alert(
        "Пожалуйста, согласитесь с условиями обработки персональных данных",
      );
      return;
    }

    const existingWizardData = location.state?.wizardData || {};
    const existingWizardDataForPayment = {
      ...existingWizardData,
      needsPackaging: existingWizardData.needsPackaging === true,
    };
    if (!selectedOffer) {
      console.error("Оффер не выбран");
      return;
    }

    let wizardDataForPayment;

    if (selectedRole === "recipient") {
      const recipientPhoneToUse =
        recipientUserPhone ||
        location.state?.wizardData?.recipientUserPhone ||
        location.state?.wizardData?.recipientPhone;
      const senderPhoneToUse =
        senderPhone || location.state?.wizardData?.senderPhone;
      const senderFIOToUse = senderFIO || location.state?.wizardData?.senderFIO;
      const recipientFIOToUse =
        recipientFIO || location.state?.wizardData?.recipientFIO;
      const senderAddressToUse =
        senderAddress || location.state?.wizardData?.senderAddress;
      const deliveryAddressToUse =
        deliveryAddress || location.state?.wizardData?.deliveryAddress;

      const existingWizardDataRecipient = location.state?.wizardData || {};
      wizardDataForPayment = {
        fromCity,
        toCity,
        senderAddress: senderAddressToUse,
        deliveryAddress: deliveryAddressToUse,
        recipientAddress: deliveryAddressToUse,
        weight: weight || "1",
        length: length || "0",
        width: width || "0",
        height: height || "0",
        packageOption,
        selectedSize,
        estimatedValue,
        recipientPhone: recipientPhoneToUse,
        recipientUserPhone: recipientPhoneToUse,
        contactPhone: recipientPhoneToUse,
        senderPhone: senderPhoneToUse,
        recipientFIO: recipientFIOToUse,
        senderFIO: senderFIOToUse,
        senderName: senderFIOToUse,
        pickupSenderName: senderFIOToUse,
        recipientName: recipientFIOToUse,
        email,
        agreePersonalData,
        agreeMarketing,
        selectedOffer,
        recipientDeliveryPointCode,
        recipientDeliveryPointAddress,
        paymentPayer: "me",
        selectedRole: "recipient",
        photoUrl,
        needsPackaging: existingWizardDataRecipient.needsPackaging === true,
      };
      console.log("📦 Формирование wizardDataForPayment (recipient):", {
        needsPackagingFromState: existingWizardDataRecipient.needsPackaging,
        finalNeedsPackaging: wizardDataForPayment.needsPackaging,
      });
    } else {
      wizardDataForPayment = {
        fromCity,
        toCity,
        senderAddress: pickupAddress,
        deliveryAddress: recipientAddress,
        weight: weight || "1",
        length: length || "0",
        width: width || "0",
        height: height || "0",
        packageOption,
        selectedSize,
        estimatedValue,
        recipientPhone,
        contactPhone,
        recipientFIO,
        pickupSenderName,
        senderFIO: pickupSenderName,
        senderName: pickupSenderName,
        senderPhone: contactPhone,
        recipientName: recipientFIO,
        email,
        agreePersonalData,
        agreeMarketing,
        selectedOffer,
        recipientDeliveryPointCode,
        recipientDeliveryPointAddress,
        photoUrl,
        needsPackaging: existingWizardDataForPayment.needsPackaging === true,
      };
      console.log("📦 Формирование wizardDataForPayment (sender):", {
        needsPackagingFromState: existingWizardDataForPayment.needsPackaging,
        finalNeedsPackaging: wizardDataForPayment.needsPackaging,
      });
    }

    navigate("/payment", {
      state: {
        wizardData: wizardDataForPayment,
        company: selectedOffer.company_id,
        companyName: selectedOffer.company_name,
        companyCode: selectedOffer.company_code,
        companyLogo: selectedOffer.company_logo,
        price: selectedOffer.price,
        tariffCode: selectedOffer.tariff_code,
        tariffName: selectedOffer.tariff_name,
        deliveryTime: selectedOffer.delivery_time,
        insuranceCost: selectedOffer.insurance_cost || null,
      },
    });
  };

  const handleRecipientAddressContinue = () => {
    const trimmedAddress = recipientAddress?.trim() || "";
    const hasHouseNumber = /\d/.test(trimmedAddress);
    const existingWizardData = location.state?.wizardData || {};
    const savedDelivery = localStorage.getItem("filterCourierDelivery");
    const filterCourierDelivery =
      existingWizardData.filterCourierDelivery !== undefined
        ? existingWizardData.filterCourierDelivery
        : savedDelivery !== null
          ? savedDelivery === "true"
          : false;
    const finalSelectedOffer =
      selectedOffer ||
      existingWizardData.selectedOffer ||
      location.state?.selectedOffer;
    const isPvzFlow = needsPvzSelection(
      finalSelectedOffer,
      filterCourierDelivery,
    );

    if (!recipientFIO?.trim() || !recipientPhone?.trim()) {
      return;
    }

    if (!isPvzFlow && (!trimmedAddress || !hasHouseNumber)) {
      return;
    }

    const resolvedFromCity = resolveCityFromInputs(
      fromCity,
      pickupAddress || senderAddress,
    );
    const resolvedToCity = resolveCityFromInputs(
      toCity,
      recipientAddress || recipientDeliveryPointAddress || deliveryAddress,
    );

    if (!resolvedFromCity || !resolvedToCity) {
      return;
    }

    if (!fromCity && resolvedFromCity) {
      setFromCity(resolvedFromCity);
    }
    if (!toCity && resolvedToCity) {
      setToCity(resolvedToCity);
    }

    navigate("/wizard?step=payment", {
      state: {
        ...location.state,
        wizardData: {
          ...existingWizardData,
          fromCity: resolvedFromCity,
          toCity: resolvedToCity,
          senderAddress: pickupAddress || senderAddress,
          pickupAddress: pickupAddress || senderAddress,
          deliveryAddress: isPvzFlow
            ? recipientDeliveryPointAddress || ""
            : recipientAddress,
          recipientAddress: isPvzFlow
            ? recipientDeliveryPointAddress || ""
            : recipientAddress,
          recipientDeliveryPointCode: recipientDeliveryPointCode || null,
          recipientDeliveryPointAddress: recipientDeliveryPointAddress || "",
          recipientPhone,
          recipientFIO,
          contactPhone,
          pickupSenderName,
          paymentPayer: paymentPayer || null,
          selectedRole: "sender",
          selectedOffer: finalSelectedOffer,
          filterCourierPickup: existingWizardData.filterCourierPickup,
          filterCourierDelivery,
          needsPackaging: existingWizardData.needsPackaging === true,
        },
      },
    });
  };

  const handleRecipientDataContinue = () => {
    const trimmedAddress = deliveryAddress?.trim() || "";
    const hasHouseNumber = /\d/.test(trimmedAddress);
    const existingWizardData = location.state?.wizardData || {};
    const savedDelivery = localStorage.getItem("filterCourierDelivery");
    const filterCourierDelivery =
      existingWizardData.filterCourierDelivery !== undefined
        ? existingWizardData.filterCourierDelivery
        : savedDelivery !== null
          ? savedDelivery === "true"
          : false;
    const finalSelectedOffer =
      selectedOffer ||
      existingWizardData.selectedOffer ||
      location.state?.selectedOffer;
    const isPvzFlow = needsPvzSelection(
      finalSelectedOffer,
      filterCourierDelivery,
    );

    if (!recipientFIO?.trim() || !recipientUserPhone?.trim()) {
      return;
    }

    if (!isPvzFlow && (!trimmedAddress || !hasHouseNumber)) {
      return;
    }

    const resolvedFromCity = resolveCityFromInputs(fromCity, senderAddress);
    const resolvedToCity = resolveCityFromInputs(
      toCity,
      isPvzFlow ? recipientDeliveryPointAddress || toCity : deliveryAddress,
    );

    if (!resolvedFromCity || !resolvedToCity) {
      return;
    }

    if (!fromCity && resolvedFromCity) {
      setFromCity(resolvedFromCity);
    }
    if (!toCity && resolvedToCity) {
      setToCity(resolvedToCity);
    }

    // После ввода данных получателя сразу показываем шаг ввода кода,
    // без дополнительного экрана "только номер телефона".
    setRecipientUserCodeSent(true);
    setRecipientUserSmsCode("");
    setRecipientUserCodeError("");
    setRecipientUserTelegramSent(false);
    void handleRecipientUserSendCode("sms");

    navigate("/wizard?step=recipientUserPhone", {
      state: {
        ...location.state,
        wizardData: {
          ...existingWizardData,
          fromCity: resolvedFromCity,
          toCity: resolvedToCity,
          senderAddress,
          senderPhone,
          senderFIO,
          pickupSenderName: senderFIO,
          deliveryAddress: isPvzFlow
            ? recipientDeliveryPointAddress || ""
            : deliveryAddress,
          recipientAddress: isPvzFlow
            ? recipientDeliveryPointAddress || ""
            : deliveryAddress,
          recipientDeliveryPointCode: recipientDeliveryPointCode || null,
          recipientDeliveryPointAddress: recipientDeliveryPointAddress || "",
          recipientPhone: recipientUserPhone,
          recipientUserPhone,
          contactPhone: recipientUserPhone,
          recipientFIO,
          selectedRole: "recipient",
          selectedOffer: finalSelectedOffer,
          filterCourierPickup: existingWizardData.filterCourierPickup,
          filterCourierDelivery,
        },
      },
    });
  };

  const handleResendCode = async () => {
    if (contactPhone) {
      await handleSendCode("telegram");
    }
  };

  const handleContactPhoneContinue = async () => {
    if (!contactPhone) {
      setCodeError("Введите номер телефона");
      return;
    }

    setCodeError("");
    setTelegramSent(false);

    setCodeSent(false);
    setSmsCode("");
    setTelegramSent(false);

    const inviteRecipient =
      location.state?.inviteRecipient ||
      location.state?.wizardData?.inviteRecipient ||
      false;

    if (selectedRole === "sender") {
      if (inviteRecipient) {
        const wizardDataForOrder = {
          fromCity,
          toCity,
          pickupAddress,
          pickupSenderName,
          recipientPhone,
          contactPhone,
          weight: weight || "1",
          length: length || "0",
          width: width || "0",
          height: height || "0",
          packageOption,
          selectedSize,
          estimatedValue,
          selectedRole: "sender",
          inviteRecipient: true,
          photoUrl,
        };
        navigate("/wizard?step=orderComplete", {
          state: {
            wizardData: wizardDataForOrder,
            inviteRecipient: true,
            selectedRole: "sender",
          },
        });
      } else {
        navigate("/wizard?step=pickupAddress");
      }
    }
  };

  const authObj = {
    codeSent,
    codeLoading,
    codeError,
    telegramSent,
    smsCode,
    setSmsCode: (code) => setSmsCode(code),
    resetCodeState: () => {
      setCodeSent(false);
      setSmsCode("");
      setCodeError("");
      setTelegramSent(false);
    },
    handleSendCode: handleSendCode,
  };

  const getProgress = () => {
    if (selectedRole === "recipient") {
      const recipientStepOrder = [
        "recipientRoute",
        "package",
        "recipientAddress",
        "recipientUserPhone",
      ];
      const stepIndex = recipientStepOrder.indexOf(currentStep);
      if (stepIndex !== -1) {
        return Math.round(((stepIndex + 1) / recipientStepOrder.length) * 100);
      }
    }

    if (currentStep === "orderComplete") return 100;
    if (currentStep === "recipientAddress") return 75;
    if (currentStep === "payment") return 85;
    if (currentStep === "recipientPhone") return 70;
    if (currentStep === "pickupAddress") return 60;
    if (currentStep === "contactPhone") return 75;
    if (currentStep === "email") return 95;
    if (currentStep === "selectPvz") return 90;
    if (currentStep === "recipientRoute") return 20;
    if (currentStep === "senderAddress") return 60;
    if (currentStep === "recipientUserPhone") return 100;
    if (currentStep === "package") return 30;
    if (selectedRole) return 20;
    return 0;
  };

  const getProgressText = () => {
    if (currentStep === "orderComplete") return "Готово";
    if (currentStep === "email") return "Электронный адрес";
    if (currentStep === "selectPvz") return "Выбор пункта выдачи";
    if (currentStep === "recipientAddress") return "Данные получателя";
    if (currentStep === "recipientRoute") return "";
    if (currentStep === "senderAddress") return "Данные отправителя";
    if (currentStep === "recipientUserPhone") return "Подтвердите телефон";
    if (currentStep === "payment") return "Кто оплатит доставку?";
    if (currentStep === "recipientPhone") return "Телефон получателя";
    if (currentStep === "pickupAddress") return "Данные отправителя";
    if (currentStep === "contactPhone") {
      const inviteRecipient =
        location.state?.inviteRecipient ||
        location.state?.wizardData?.inviteRecipient ||
        false;
      return inviteRecipient ? "Ваш телефон" : "Как с вами связаться?";
    }
    if (currentStep === "package") return "Расскажите о посылке";
    if (selectedRole) return "Выбрана роль";
    return "Начните заполнение формы";
  };

  const getStepLabel = () => {
    const isInviteRecipientFlow =
      location.state?.inviteRecipient ||
      location.state?.wizardData?.inviteRecipient ||
      false;

    if (currentStep === "contactPhone") {
      return "Шаг 3 из 4";
    }

    let stepOrder = [];

    if (!selectedRole || currentStep === "role") {
      stepOrder = ["role", "package"];
    } else if (selectedRole === "recipient") {
      stepOrder = [
        "recipientRoute",
        "package",
        "recipientAddress",
        "recipientUserPhone",
      ];
    } else if (isInviteRecipientFlow) {
      stepOrder = ["package", "pickupAddress", "contactPhone", "orderComplete"];
    } else {
      stepOrder = [
        "recipientRoute",
        "package",
        "pickupAddress",
        "recipientAddress",
        "payment",
        "selectPvz",
        "email",
        "orderComplete",
      ];
    }

    const stepIndex = stepOrder.indexOf(currentStep);
    if (stepIndex === -1) return "";
    return `Шаг ${stepIndex + 1} из ${stepOrder.length}`;
  };

  const handleBack = () => {
    const inviteRecipient =
      location.state?.inviteRecipient ||
      location.state?.wizardData?.inviteRecipient ||
      false;

    if (currentStep === "orderComplete") {
      if (inviteRecipient) {
        navigate("/wizard?step=contactPhone", {
          state: { ...location.state, inviteRecipient: true },
        });
      } else if (paymentPayer === "recipient") {
        navigate("/wizard?step=payment");
      } else {
        navigate("/wizard?step=recipientAddress");
      }
    } else if (currentStep === "contactPhone" && inviteRecipient) {
      navigate("/wizard?step=pickupAddress", {
        state: { ...location.state, inviteRecipient: true },
      });
    } else if (currentStep === "pickupAddress" && inviteRecipient) {
      const existingWizardData = location.state?.wizardData || {};
      navigate("/offers", {
        state: {
          wizardData: {
            fromCity,
            toCity,
            recipientPhone,
            selectedRole: "sender",
            inviteRecipient: true,
            photoUrl,
            filterCourierPickup: existingWizardData.filterCourierPickup,
            filterCourierDelivery: existingWizardData.filterCourierDelivery,
          },
          recipientNotified: true,
        },
      });
    } else if (currentStep === "selectPvz") {
      const existingWizardData = location.state?.wizardData || {};
      navigate("/offers", {
        state: {
          wizardData: {
            fromCity,
            toCity,
            senderAddress: pickupAddress || senderAddress,
            deliveryAddress: recipientAddress || deliveryAddress,
            weight,
            length,
            width,
            height,
            packageOption,
            selectedSize,
            recipientPhone,
            contactPhone,
            recipientFIO,
            pickupSenderName,
            selectedOffer: selectedOffer || existingWizardData.selectedOffer,
            photoUrl,
            returnToPayment: true,
            needsPackaging: existingWizardData.needsPackaging === true,
            filterCourierPickup: existingWizardData.filterCourierPickup,
            filterCourierDelivery: existingWizardData.filterCourierDelivery,
          },
        },
      });
    } else if (currentStep === "email") {
      const existingWizardData = location.state?.wizardData || {};
      navigate("/offers", {
        state: {
          wizardData: {
            fromCity,
            toCity,
            senderAddress: pickupAddress,
            deliveryAddress: recipientAddress,
            weight,
            length,
            width,
            height,
            packageOption,
            selectedSize,
            recipientPhone,
            contactPhone,
            recipientFIO,
            pickupSenderName,
            selectedOffer: selectedOffer || existingWizardData.selectedOffer,
            photoUrl,
            returnToPayment: true,
            needsPackaging: existingWizardData.needsPackaging === true,
            filterCourierPickup: existingWizardData.filterCourierPickup,
            filterCourierDelivery: existingWizardData.filterCourierDelivery,
          },
        },
      });
    } else if (currentStep === "recipientAddress") {
      if (selectedRole === "recipient") {
        const existingWizardData = location.state?.wizardData || {};
        navigate("/offers", {
          state: {
            wizardData: {
              ...existingWizardData,
              fromCity,
              toCity,
              selectedRole: "recipient",
              deliveryAddress: deliveryAddress || existingWizardData.deliveryAddress,
              recipientAddress:
                deliveryAddress || existingWizardData.recipientAddress,
              recipientFIO: recipientFIO || existingWizardData.recipientFIO,
              recipientUserPhone:
                recipientUserPhone || existingWizardData.recipientUserPhone,
              recipientPhone:
                recipientUserPhone ||
                existingWizardData.recipientPhone ||
                existingWizardData.recipientUserPhone,
              recipientDeliveryPointCode:
                recipientDeliveryPointCode ||
                existingWizardData.recipientDeliveryPointCode ||
                null,
              recipientDeliveryPointAddress:
                recipientDeliveryPointAddress ||
                existingWizardData.recipientDeliveryPointAddress ||
                "",
              contactPhone:
                recipientUserPhone ||
                existingWizardData.contactPhone ||
                existingWizardData.recipientUserPhone,
              selectedOffer:
                selectedOffer || existingWizardData.selectedOffer || null,
              weight: weight || existingWizardData.weight,
              length: length || existingWizardData.length,
              width: width || existingWizardData.width,
              height: height || existingWizardData.height,
              packageOption: packageOption || existingWizardData.packageOption,
              selectedSize: selectedSize || existingWizardData.selectedSize,
              estimatedValue:
                estimatedValue || existingWizardData.estimatedValue,
              photoUrl: photoUrl || existingWizardData.photoUrl,
              filterCourierPickup: existingWizardData.filterCourierPickup,
              filterCourierDelivery: existingWizardData.filterCourierDelivery,
            },
          },
        });
      } else {
        navigate("/wizard?step=pickupAddress");
      }
    } else if (currentStep === "payment") {
      navigate("/wizard?step=recipientAddress");
    } else if (currentStep === "recipientPhone") {
      navigate("/wizard?step=pickupAddress");
    } else if (currentStep === "pickupAddress") {
      const existingWizardData = location.state?.wizardData || {};
      navigate("/offers", {
        state: {
          wizardData: {
            ...existingWizardData,
            fromCity,
            toCity,
            selectedRole: "sender",
            senderAddress: pickupAddress || existingWizardData.senderAddress,
            pickupAddress: pickupAddress || existingWizardData.pickupAddress,
            pickupSenderName:
              pickupSenderName || existingWizardData.pickupSenderName,
            contactPhone: contactPhone || existingWizardData.contactPhone,
            recipientPhone: recipientPhone || existingWizardData.recipientPhone,
            weight: weight || existingWizardData.weight,
            length: length || existingWizardData.length,
            width: width || existingWizardData.width,
            height: height || existingWizardData.height,
            packageOption: packageOption || existingWizardData.packageOption,
            selectedSize: selectedSize || existingWizardData.selectedSize,
            estimatedValue: estimatedValue || existingWizardData.estimatedValue,
            photoUrl: photoUrl || existingWizardData.photoUrl,
            selectedOffer:
              selectedOffer || existingWizardData.selectedOffer || null,
            filterCourierPickup: existingWizardData.filterCourierPickup,
            filterCourierDelivery: existingWizardData.filterCourierDelivery,
          },
        },
      });
    } else if (currentStep === "contactPhone") {
      navigate("/wizard?step=package");
      if (codeSent) {
        setCodeSent(false);
        setSmsCode("");
        setCodeError("");
        setTelegramSent(false);
      }
    } else if (currentStep === "recipientRoute") {
      navigate("/calculate");
    } else if (currentStep === "senderPhone") {
      navigate("/wizard?step=senderAddress");
    } else if (currentStep === "senderAddress") {
      const existingWizardData = location.state?.wizardData || {};
      navigate("/offers", {
        state: {
          wizardData: {
            ...existingWizardData,
            fromCity,
            toCity,
            selectedRole: "recipient",
            senderAddress: senderAddress || existingWizardData.senderAddress,
            senderPhone: senderPhone || existingWizardData.senderPhone,
            senderFIO: senderFIO || existingWizardData.senderFIO,
            pickupSenderName:
              senderFIO ||
              existingWizardData.pickupSenderName ||
              existingWizardData.senderFIO,
            deliveryAddress:
              deliveryAddress || existingWizardData.deliveryAddress,
            recipientAddress:
              deliveryAddress || existingWizardData.recipientAddress,
            recipientFIO: recipientFIO || existingWizardData.recipientFIO,
            recipientUserPhone:
              recipientUserPhone || existingWizardData.recipientUserPhone,
            recipientPhone:
              recipientUserPhone ||
              existingWizardData.recipientPhone ||
              existingWizardData.recipientUserPhone,
            contactPhone:
              recipientUserPhone ||
              existingWizardData.contactPhone ||
              existingWizardData.recipientUserPhone,
            weight: weight || existingWizardData.weight,
            length: length || existingWizardData.length,
            width: width || existingWizardData.width,
            height: height || existingWizardData.height,
            packageOption: packageOption || existingWizardData.packageOption,
            selectedSize: selectedSize || existingWizardData.selectedSize,
            estimatedValue: estimatedValue || existingWizardData.estimatedValue,
            photoUrl: photoUrl || existingWizardData.photoUrl,
            selectedOffer:
              selectedOffer || existingWizardData.selectedOffer || null,
            filterCourierPickup: existingWizardData.filterCourierPickup,
            filterCourierDelivery: existingWizardData.filterCourierDelivery,
          },
        },
      });
    } else if (currentStep === "recipientUserPhone") {
      if (recipientUserCodeSent) {
        setRecipientUserCodeSent(false);
        setRecipientUserSmsCode("");
        setRecipientUserCodeError("");
        setRecipientUserTelegramSent(false);
      }
      navigate("/wizard?step=recipientAddress");
    } else if (currentStep === "package") {
      if (selectedRole) {
        navigate("/wizard?step=recipientRoute");
      } else {
        navigate("/calculate");
      }
    } else {
      navigate("/calculate");
    }
  };

  const inviteRecipient =
    location.state?.inviteRecipient ||
    location.state?.wizardData?.inviteRecipient ||
    false;
  const senderSelectedOffer =
    selectedOffer ||
    location.state?.selectedOffer ||
    location.state?.wizardData?.selectedOffer ||
    null;
  const senderFilterCourierDelivery =
    location.state?.wizardData?.filterCourierDelivery || false;
  const senderPvzFlow = needsPvzSelection(
    senderSelectedOffer,
    senderFilterCourierDelivery,
  );

  return (
    <WizardLayout
      fromCity={fromCity}
      toCity={toCity}
      onFromCityChange={(e) => setFromCity(e.target.value)}
      onToCityChange={(e) => setToCity(e.target.value)}
      onCalculate={handleCalculate}
      progress={getProgress()}
      progressText={getProgressText()}
      stepLabel={getStepLabel()}
      onBack={handleBack}
    >
      {currentStep === "role" ? (
        <RoleSelectStep
          selectedRole={selectedRole}
          onRoleSelect={handleRoleSelect}
        />
      ) : currentStep === "recipientRoute" && selectedRole ? (
        <RecipientRouteStep
          fromCity={fromCity}
          toCity={toCity}
          onFromCityChange={(e) => setFromCity(e.target.value)}
          onToCityChange={(e) => setToCity(e.target.value)}
          onContinue={handleRecipientRouteContinue}
        />
      ) : currentStep === "package" ? (
        <PackageStep
          packageOption={packageOption}
          onPackageOptionChange={setPackageOption}
          photoPreview={photoPreview}
          photoError={photoError}
          photoAnalyzing={photoAnalyzing}
          photoAnalysis={photoAnalysis}
          onPhotoChange={handlePhotoChange}
          onPhotoRemove={handlePhotoRemove}
          length={length}
          onLengthChange={(e) => setLength(e.target.value)}
          width={width}
          onWidthChange={(e) => setWidth(e.target.value)}
          height={height}
          onHeightChange={(e) => setHeight(e.target.value)}
          weight={weight}
          onWeightChange={(e) => setWeight(e.target.value)}
          estimatedValue={estimatedValue}
          onEstimatedValueChange={(e) => setEstimatedValue(e.target.value)}
          selectedSize={selectedSize}
          onSelectedSizeChange={setSelectedSize}
          onContinue={handlePackageContinue}
        />
      ) : currentStep === "contactPhone" && selectedRole === "sender" ? (
        <ContactPhoneStep
          phone={contactPhone}
          onPhoneChange={(e) => setContactPhone(e.target.value)}
          auth={authObj}
          selectedRole={selectedRole}
          fromCity={fromCity}
          toCity={toCity}
          length={length}
          width={width}
          height={height}
          weight={weight}
          title={
            location.state?.inviteRecipient ||
            location.state?.wizardData?.inviteRecipient
              ? "Ваш телефон"
              : undefined
          }
          description={
            location.state?.inviteRecipient ||
            location.state?.wizardData?.inviteRecipient
              ? "Это необходимо для оформления заказа"
              : undefined
          }
          onVerifyCode={handleVerifyCode}
          onResendCode={handleResendCode}
          onRoleChange={inviteRecipient ? undefined : handleRoleToggle}
          skipCode
          onContinue={handleContactPhoneContinue}
        />
      ) : currentStep === "pickupAddress" && selectedRole === "sender" ? (
        <PickupAddressStep
          pickupAddress={pickupAddress}
          onPickupAddressChange={(e) => setPickupAddress(e.target.value)}
          pickupSenderName={pickupSenderName}
          onPickupSenderNameChange={(e) => setPickupSenderName(e.target.value)}
          senderPhone={contactPhone}
          onSenderPhoneChange={(e) => setContactPhone(e.target.value)}
          fromCity={fromCity}
          toCity={toCity}
          selectedOffer={senderSelectedOffer}
          filterCourierDelivery={senderFilterCourierDelivery}
          onContinue={handlePickupAddressContinue}
        />
      ) : currentStep === "recipientPhone" && selectedRole === "sender" ? (
        <RecipientPhoneStep
          recipientPhone={recipientPhone}
          onRecipientPhoneChange={(e) => setRecipientPhone(e.target.value)}
          onContinue={handleRecipientPhoneContinue}
        />
      ) : currentStep === "payment" && selectedRole === "sender" ? (
        <PaymentStep
          paymentPayer={paymentPayer}
          onPaymentPayerChange={setPaymentPayer}
          selectedRole={selectedRole}
          onContinue={handlePaymentContinue}
        />
      ) : currentStep === "recipientFIO" && selectedRole === "recipient" ? (
        <RecipientFIOStep
          recipientFIO={recipientFIO}
          onRecipientFIOChange={(e) => setRecipientFIO(e.target.value)}
          recipientFioFocused={recipientFioFocused}
          onRecipientFioFocus={() => setRecipientFioFocused(true)}
          onRecipientFioBlur={() => setRecipientFioFocused(false)}
          onContinue={handleRecipientFIOContinue}
        />
      ) : currentStep === "deliveryAddress" && selectedRole === "recipient" ? (
        <DeliveryAddressStep
          deliveryAddress={deliveryAddress}
          onDeliveryAddressChange={(e) => {
            setDeliveryAddress(e.target.value);
            if (deliveryAddressError) {
              setDeliveryAddressError("");
            }
          }}
          toCity={toCity}
          onContinue={handleDeliveryAddressContinue}
          error={deliveryAddressError}
        />
      ) : currentStep === "recipientUserPhone" &&
        selectedRole === "recipient" ? (
        <ContactPhoneStep
          phone={recipientUserPhone}
          onPhoneChange={(e) => setRecipientUserPhone(e.target.value)}
          selectedRole={selectedRole}
          title="Подтвердите телефон получателя"
          description="Нужен код из SMS для подтверждения оформления"
          phoneLocked
          auth={{
            codeSent: recipientUserCodeSent,
            codeLoading: recipientUserCodeLoading,
            codeError: recipientUserCodeError,
            smsCode: recipientUserSmsCode,
            setSmsCode: setRecipientUserSmsCode,
            telegramSent: recipientUserTelegramSent,
            resetCodeState: () => {
              setRecipientUserCodeSent(false);
              setRecipientUserSmsCode("");
              setRecipientUserCodeError("");
              setRecipientUserTelegramSent(false);
            },
            handleSendCode: handleRecipientUserSendCode,
          }}
          onVerifyCode={handleRecipientUserVerifyCode}
          onResendCode={handleRecipientUserResendCode}
          onContinue={handleRecipientUserPhoneContinue}
          onRoleChange={handleRoleToggle}
        />
      ) : currentStep === "senderAddress" && selectedRole === "recipient" ? (
        <PickupAddressStep
          pickupAddress={senderAddress}
          onPickupAddressChange={(e) => setSenderAddress(e.target.value)}
          pickupSenderName={senderFIO}
          onPickupSenderNameChange={(e) => setSenderFIO(e.target.value)}
          senderPhone={senderPhone}
          onSenderPhoneChange={(e) => setSenderPhone(e.target.value)}
          fromCity={fromCity}
          toCity={toCity}
          selectedOffer={senderSelectedOffer}
          filterCourierDelivery={senderFilterCourierDelivery}
          onContinue={handleSenderAddressContinue}
        />
      ) : currentStep === "recipientAddress" &&
        (selectedRole === "sender" || selectedRole === "recipient") ? (
        <RecipientAddressStep
          recipientAddress={
            selectedRole === "recipient" ? deliveryAddress : recipientAddress
          }
          onRecipientAddressChange={(e) =>
            selectedRole === "recipient"
              ? setDeliveryAddress(e.target.value)
              : setRecipientAddress(e.target.value)
          }
          recipientPhone={
            selectedRole === "recipient" ? recipientUserPhone : recipientPhone
          }
          onRecipientPhoneChange={(e) =>
            selectedRole === "recipient"
              ? setRecipientUserPhone(e.target.value)
              : setRecipientPhone(e.target.value)
          }
          recipientFIO={recipientFIO}
          onRecipientFIOChange={(e) => setRecipientFIO(e.target.value)}
          recipientFioFocused={recipientFioFocused}
          onRecipientFioFocus={() => setRecipientFioFocused(true)}
          onRecipientFioBlur={() => setRecipientFioFocused(false)}
          fromCity={fromCity}
          toCity={toCity}
          selectedOffer={senderSelectedOffer}
          filterCourierDelivery={senderFilterCourierDelivery}
          isPvzFlow={senderPvzFlow}
          selectedPvzAddress={recipientDeliveryPointAddress}
          onContinue={
            selectedRole === "recipient"
              ? handleRecipientDataContinue
              : handleRecipientAddressContinue
          }
        />
      ) : currentStep === "selectPvz" &&
        selectedOffer &&
        needsPvzSelection(
          selectedOffer,
          location.state?.wizardData?.filterCourierDelivery || false,
        ) &&
        paymentPayer !== "recipient" ? (
        <SelectPvzStep
          toCity={toCity}
          fromCity={fromCity}
          recipientAddress={recipientAddress || deliveryAddress}
          senderAddress={pickupAddress || senderAddress}
          selectedOffer={selectedOffer}
          weight={weight}
          length={length}
          width={width}
          height={height}
          recipientDeliveryPointCode={recipientDeliveryPointCode}
          onSelect={(point) => {
            setRecipientDeliveryPointCode(point.code);
            setRecipientDeliveryPointAddress(point.address);
          }}
          onContinue={handleSelectPvzContinue}
        />
      ) : currentStep === "email" ? (
        <EmailStep
          email={email}
          onEmailChange={(e) => setEmail(e.target.value)}
          emailFocused={emailFocused}
          onEmailFocus={() => setEmailFocused(true)}
          onEmailBlur={() => setEmailFocused(false)}
          agreePersonalData={agreePersonalData}
          onAgreePersonalDataChange={(e) =>
            setAgreePersonalData(e.target.checked)
          }
          agreeMarketing={agreeMarketing}
          onAgreeMarketingChange={(e) => setAgreeMarketing(e.target.checked)}
          loadingOffers={false}
          onContinue={handleEmailContinue}
        />
      ) : currentStep === "orderComplete" && selectedRole === "sender" ? (
        (() => {
          const inviteRecipient =
            location.state?.inviteRecipient ||
            location.state?.wizardData?.inviteRecipient ||
            false;
          const filterCourierDelivery =
            location.state?.wizardData?.filterCourierDelivery || false;
          if (inviteRecipient) {
            return <OrderCompleteStep />;
          }
          // Если получатель платит - не показываем выбор ПВЗ, сразу завершение
          if (paymentPayer === "recipient") {
            return <OrderCompleteStep />;
          }
          if (
            selectedOffer &&
            needsPvzSelection(selectedOffer, filterCourierDelivery)
          ) {
            return (
              <SelectPvzStep
                toCity={toCity}
                fromCity={fromCity}
                recipientAddress={recipientAddress || deliveryAddress}
                senderAddress={pickupAddress || senderAddress}
                selectedOffer={selectedOffer}
                weight={weight}
                length={length}
                width={width}
                height={height}
                recipientDeliveryPointCode={recipientDeliveryPointCode}
                onSelect={(point) => {
                  setRecipientDeliveryPointCode(point.code);
                  setRecipientDeliveryPointAddress(point.address);
                }}
                onContinue={handleSelectPvzContinue}
              />
            );
          }
          return <OrderCompleteStep />;
        })()
      ) : null}
    </WizardLayout>
  );
}

export default WizardPage;
