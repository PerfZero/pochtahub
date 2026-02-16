// SenderWizard - компонент для отправителя
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useWizardData } from "../../hooks/useWizardData";
import { useWizardAuth } from "../../hooks/useWizardAuth";
import { PVZ_REQUIRED_TARIFFS, isValidStep } from "../../hooks/useWizardData";
import WizardLayout from "../../components/wizard/WizardLayout";
import PackageStep from "./steps/PackageStep";
import ContactPhoneStep from "./steps/ContactPhoneStep";
import PickupAddressStep from "./steps/PickupAddressStep";
import RecipientPhoneStep from "./steps/RecipientPhoneStep";
import PaymentStep from "./steps/PaymentStep";
import { tariffsAPI } from "../../api";
import iconPhone from "../../assets/images/icon-phone.svg";
import iconIron from "../../assets/images/icon-iron.svg";
import iconShoes from "../../assets/images/icon-shoes.svg";
import iconMicrowave from "../../assets/images/icon-microwave.svg";

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

function SenderWizard() {
  const location = useLocation();
  const navigate = useNavigate();
  const wizardData = useWizardData();
  const auth = useWizardAuth();

  const {
    fromCity,
    setFromCity,
    toCity,
    setToCity,
    packageOption,
    setPackageOption,
    length,
    setLength,
    width,
    setWidth,
    height,
    setHeight,
    weight,
    setWeight,
    estimatedValue,
    setEstimatedValue,
    photoFile,
    setPhotoFile,
    photoPreview,
    setPhotoPreview,
    photoError,
    setPhotoError,
    selectedSize,
    setSelectedSize,
    packageDataCompleted,
    setPackageDataCompleted,
    senderPhone,
    setSenderPhone,
    senderFIO,
    setSenderFIO,
    senderAddress,
    setSenderAddress,
    fioFocused,
    setFioFocused,
    deliveryAddress,
    setDeliveryAddress,
    deliveryMethod,
    setDeliveryMethod,
    userPhone,
    setUserPhone,
    contactPhone,
    setContactPhone,
    recipientPhone,
    setRecipientPhone,
    recipientAddress,
    setRecipientAddress,
    recipientFIO,
    setRecipientFIO,
    recipientFioFocused,
    setRecipientFioFocused,
    email,
    setEmail,
    emailFocused,
    setEmailFocused,
    agreePersonalData,
    setAgreePersonalData,
    agreeMarketing,
    setAgreeMarketing,
    paymentPayer,
    setPaymentPayer,
    selectedOffer,
    setSelectedOffer,
    recipientDeliveryPointCode,
    setRecipientDeliveryPointCode,
    recipientDeliveryPointAddress,
    setRecipientDeliveryPointAddress,
    pickupAddress,
    setPickupAddress,
    pickupSenderName,
    setPickupSenderName,
    pickupSenderNameFocused,
    setPickupSenderNameFocused,
  } = wizardData;

  const [currentStep, setCurrentStep] = useState(() => {
    const urlParams = new URLSearchParams(location.search);
    const stepParam = urlParams.get("step");
    if (stepParam && isValidStep(stepParam)) {
      return stepParam;
    }
    if (location.state?.currentStep) {
      return location.state.currentStep;
    }
    if (packageDataCompleted) {
      return "contactPhone";
    }
    return "package";
  });

  const [loadingOffers, setLoadingOffers] = useState(false);

  // Флоу для отправителя:
  // package → contactPhone → deliveryAddress → senderFIO → deliveryMethod → recipientPhone → payment → recipientAddress → email → selectPvz → orderComplete

  const handleContinue = () => {
    if (currentStep === "package") {
      if (packageOption === "photo" && photoPreview) {
        setPackageDataCompleted(true);
        setCurrentStep("contactPhone");
      } else if (
        packageOption === "manual" &&
        length &&
        width &&
        height &&
        weight
      ) {
        setPackageDataCompleted(true);
        setCurrentStep("contactPhone");
      } else if (packageOption === "unknown" && selectedSize) {
        setPackageDataCompleted(true);
        setCurrentStep("contactPhone");
      }
    } else if (
      currentStep === "contactPhone" &&
      contactPhone &&
      !auth.codeSent
    ) {
      auth.handleSendCode(contactPhone, "sms").then((success) => {
        if (success) {
          setUserPhone(contactPhone);
        }
      });
    } else if (currentStep === "pickupAddress") {
      const trimmedAddress = pickupAddress?.trim() || "";
      const hasHouseNumber = /\d/.test(trimmedAddress);
      if (trimmedAddress && hasHouseNumber && pickupSenderName) {
        setSenderAddress(pickupAddress);
        setSenderFIO(pickupSenderName);
        setCurrentStep("recipientPhone");
      }
    } else if (currentStep === "recipientPhone" && recipientPhone) {
      if (location.state?.returnToOffers) {
        const existingWizardData = location.state?.wizardData || {};
        const updatedWizardData = {
          fromCity,
          toCity,
          recipientPhone,
          filterCourierPickup: existingWizardData.filterCourierPickup,
          filterCourierDelivery: existingWizardData.filterCourierDelivery,
        };
        try {
          const jsonString = JSON.stringify(updatedWizardData);
          const encoded = btoa(unescape(encodeURIComponent(jsonString)));
          navigate(`/offers?data=${encodeURIComponent(encoded)}`, {
            state: { wizardData: updatedWizardData, recipientNotified: true },
          });
        } catch (err) {
          navigate("/offers", {
            state: { wizardData: updatedWizardData, recipientNotified: true },
          });
        }
      } else {
        setCurrentStep("payment");
      }
    } else if (currentStep === "payment" && paymentPayer) {
      handleNavigateToOffers();
    }
  };

  const handleBack = () => {
    if (currentStep === "payment") {
      setCurrentStep("recipientPhone");
    } else if (currentStep === "recipientPhone") {
      setCurrentStep("pickupAddress");
    } else if (currentStep === "pickupAddress") {
      setCurrentStep("contactPhone");
      auth.resetCodeState();
    } else if (currentStep === "contactPhone") {
      if (auth.codeSent) {
        auth.resetCodeState();
      } else {
        setCurrentStep("package");
        setPackageDataCompleted(false);
      }
    } else if (currentStep === "package") {
      navigate("/calculate");
    }
  };

  const handleNavigateToOffers = async () => {
    setLoadingOffers(true);
    try {
      let finalWeight = "1";
      let finalLength = "";
      let finalWidth = "";
      let finalHeight = "";

      if (packageOption === "manual") {
        finalWeight = weight || "1";
        finalLength = length || "";
        finalWidth = width || "";
        finalHeight = height || "";
      } else if (packageOption === "unknown" && selectedSize) {
        const sizeOption = sizeOptions.find((opt) => opt.id === selectedSize);
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
      }

      const existingWizardData = location.state?.wizardData || {};
      const wizardDataForOffers = {
        fromCity,
        toCity,
        selectedRole: "sender",
        length: finalLength,
        width: finalWidth,
        height: finalHeight,
        weight: finalWeight,
        selectedSize,
        packageOption,
        senderPhone,
        senderFIO,
        senderAddress: deliveryMethod === "courier" ? senderAddress : fromCity,
        deliveryAddress,
        recipientPhone,
        recipientAddress,
        recipientFIO,
        userPhone: contactPhone,
        email,
        deliveryMethod,
        paymentPayer,
        photoFile,
        filterCourierPickup: existingWizardData.filterCourierPickup,
        filterCourierDelivery: existingWizardData.filterCourierDelivery,
      };

      navigate("/offers", { state: { wizardData: wizardDataForOffers } });
    } catch (err) {
      console.error("Ошибка навигации:", err);
    } finally {
      setLoadingOffers(false);
    }
  };

  const handleCalculate = () => {
    if (!fromCity || !toCity) return;
    handleNavigateToOffers();
  };

  const handleVerifyCodeAndContinue = async (code) => {
    const phoneToUse = contactPhone;
    const success = await auth.handleVerifyCode(phoneToUse, code);
    if (success) {
      setUserPhone(contactPhone);
      setCurrentStep("pickupAddress");
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError("Файл слишком большой. Максимальный размер 5 МБ.");
        setPhotoFile(null);
        setPhotoPreview(null);
      } else {
        setPhotoFile(file);
        setPhotoError("");
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handlePhotoRemove = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError("");
    const input = document.getElementById("photo-upload");
    if (input) input.value = "";
    const inputReplace = document.getElementById("photo-replace");
    if (inputReplace) inputReplace.value = "";
  };

  const getProgress = () => {
    if (currentStep === "payment") return 95;
    if (currentStep === "recipientPhone") return 85;
    if (currentStep === "pickupAddress") return 75;
    if (currentStep === "contactPhone") return 75;
    if (packageDataCompleted) return 35;
    return 20;
  };

  const getProgressText = () => {
    if (currentStep === "payment") {
      return "Уже подобрали транспортные компании...";
    }
    if (
      ["recipientPhone", "pickupAddress", "contactPhone"].includes(currentStep)
    ) {
      return "Уже подбираем транспортные компании...";
    }
    if (packageDataCompleted) {
      return "Мы уже близко...";
    }
    return "Осталось еще чуть-чуть...";
  };

  const getStepLabel = () => {
    if (currentStep === "contactPhone") {
      return "Шаг 3 из 4";
    }

    const stepOrder = [
      "package",
      "contactPhone",
      "pickupAddress",
      "recipientPhone",
      "payment",
    ];
    const stepIndex = stepOrder.indexOf(currentStep);
    if (stepIndex === -1) return "";
    return `Шаг ${stepIndex + 1} из ${stepOrder.length}`;
  };

  const renderStep = () => {
    switch (currentStep) {
      case "package":
        return (
          <PackageStep
            packageOption={packageOption}
            onPackageOptionChange={setPackageOption}
            photoPreview={photoPreview}
            photoError={photoError}
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
            onContinue={handleContinue}
          />
        );

      case "contactPhone":
        return (
          <ContactPhoneStep
            phone={contactPhone}
            onPhoneChange={(e) => setContactPhone(e.target.value)}
            auth={auth}
            fromCity={fromCity}
            toCity={toCity}
            length={length}
            width={width}
            height={height}
            weight={weight}
            onVerifyCode={handleVerifyCodeAndContinue}
            onSendCode={(method) => auth.handleSendCode(contactPhone, method)}
          />
        );

      case "pickupAddress":
        return (
          <PickupAddressStep
            pickupAddress={pickupAddress}
            onPickupAddressChange={(e) => setPickupAddress(e.target.value)}
            pickupSenderName={pickupSenderName}
            onPickupSenderNameChange={(e) =>
              setPickupSenderName(e.target.value)
            }
            fromCity={fromCity}
            onContinue={handleContinue}
          />
        );

      case "recipientPhone":
        return (
          <RecipientPhoneStep
            recipientPhone={recipientPhone}
            onRecipientPhoneChange={(e) => setRecipientPhone(e.target.value)}
            onContinue={handleContinue}
          />
        );

      case "payment":
        return (
          <PaymentStep
            paymentPayer={paymentPayer}
            onPaymentPayerChange={setPaymentPayer}
            selectedRole="sender"
            onContinue={handleContinue}
          />
        );

      default:
        return <div>Неизвестный шаг: {currentStep}</div>;
    }
  };

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
      {renderStep()}
    </WizardLayout>
  );
}

export default SenderWizard;
