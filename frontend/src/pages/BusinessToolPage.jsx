import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { businessAPI, tariffsAPI } from "../api";
import logoSvg from "../assets/images/logo.svg";
import { trackBusinessEvent } from "../utils/businessAnalytics";

function BusinessToolPage() {
  const navigate = useNavigate();

  const [photos, setPhotos] = useState([]);
  const [calcLoading, setCalcLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [trialStatus, setTrialStatus] = useState(null);
  const photosRef = useRef([]);

  const photoCount = photos.length;
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem("access_token")),
  );

  useEffect(() => {
    const syncAuth = () => {
      setIsAuthenticated(Boolean(localStorage.getItem("access_token")));
    };

    window.addEventListener("authChange", syncAuth);
    window.addEventListener("storage", syncAuth);
    window.addEventListener("focus", syncAuth);

    return () => {
      window.removeEventListener("authChange", syncAuth);
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("focus", syncAuth);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/business", { replace: true, state: { openLogin: true } });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const loadTrialStatus = async () => {
      try {
        const response = await businessAPI.getTrialStatus();
        setTrialStatus(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.dispatchEvent(new CustomEvent("authChange"));
          setIsAuthenticated(false);
          return;
        }
        console.error("Trial status error:", err);
      }
    };

    if (isAuthenticated) {
      loadTrialStatus();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.preview));
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.dispatchEvent(new CustomEvent("authChange"));
    navigate("/business");
  };

  const handleAddPhotos = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";

    if (!selectedFiles.length) {
      return;
    }

    setActionMessage("");
    setError("");

    if (photoCount >= 3) {
      setError("Можно загрузить максимум 3 фото");
      return;
    }

    const availableSlots = 3 - photoCount;
    const filesToAdd = selectedFiles.slice(0, availableSlots).map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
    }));

    if (!filesToAdd.length) {
      setError("Можно загрузить максимум 3 фото");
      return;
    }

    const nextPhotos = [...photos, ...filesToAdd];
    setPhotos(nextPhotos);

    if (selectedFiles.length > filesToAdd.length) {
      setError("Часть файлов не добавлена: лимит 3 фото");
    }

    await trackBusinessEvent("business_photo_uploaded", {
      countPhotos: nextPhotos.length,
    });
  };

  const handleRemovePhoto = (id) => {
    setPhotos((current) => {
      const toRemove = current.find((photo) => photo.id === id);
      if (toRemove) {
        URL.revokeObjectURL(toRemove.preview);
      }
      return current.filter((photo) => photo.id !== id);
    });
  };

  const handleCalculate = async () => {
    if (!photoCount) {
      setError("Загрузите хотя бы одно фото");
      return;
    }

    setCalcLoading(true);
    setError("");
    setActionMessage("");
    setResult(null);
    const startedAt =
      typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();

    try {
      const analyses = [];

      for (const photo of photos) {
        const formData = new FormData();
        formData.append("image", photo.file);
        const response = await tariffsAPI.analyzeImage(formData);
        analyses.push(response.data);
      }

      const length = Math.max(
        ...analyses.map((item) => Number(item?.length ?? 0)),
      );
      const width = Math.max(...analyses.map((item) => Number(item?.width ?? 0)));
      const height = Math.max(
        ...analyses.map((item) => Number(item?.height ?? 0)),
      );
      const weight = Math.max(
        ...analyses.map((item) => Number(item?.weight ?? 0)),
      );

      const roundedLength = Math.max(0, Math.round(length));
      const roundedWidth = Math.max(0, Math.round(width));
      const roundedHeight = Math.max(0, Math.round(height));

      const volumetricWeight =
        roundedLength && roundedWidth && roundedHeight
          ? Number(((roundedLength * roundedWidth * roundedHeight) / 5000).toFixed(2))
          : 0;
      const roundedWeight = weight > 0 ? Number(weight.toFixed(2)) : 0;

      const nextResult = {
        length: roundedLength,
        width: roundedWidth,
        height: roundedHeight,
        weight: roundedWeight,
        volumetricWeight,
        note: "оценка по фото",
      };

      setResult(nextResult);

      await trackBusinessEvent("business_calc_success", {
        countPhotos: photoCount,
        durationMs: Math.round(
          (typeof performance !== "undefined" && typeof performance.now === "function"
            ? performance.now()
            : Date.now()) - startedAt,
        ),
        result: {
          length: nextResult.length,
          width: nextResult.width,
          height: nextResult.height,
          weight: nextResult.weight,
          volumetric_weight: nextResult.volumetricWeight,
          photo_estimate: true,
        },
      });
    } catch (err) {
      const message =
        err.response?.data?.error || "Не удалось выполнить расчёт по фото";
      setError(message);
      await trackBusinessEvent("business_calc_error", {
        countPhotos: photoCount,
        durationMs: Math.round(
          (typeof performance !== "undefined" && typeof performance.now === "function"
            ? performance.now()
            : Date.now()) - startedAt,
        ),
        errorCode: err.response?.status ? String(err.response.status) : "calc_error",
        errorMessage: message,
        metadata: { error: message },
      });
    } finally {
      setCalcLoading(false);
    }
  };

  const buildResultText = () => {
    if (!result) {
      return "";
    }

    const lines = [
      `Габариты: ${result.length} × ${result.width} × ${result.height} см`,
    ];

    if (result.weight > 0) {
      lines.push(`Вес: ${result.weight} кг`);
    }

    if (result.volumetricWeight > 0) {
      lines.push(`Объёмный вес: ${result.volumetricWeight} кг`);
    }

    lines.push("Примечание: оценка по фото");

    return lines.join("\n");
  };

  const handleCopy = async () => {
    if (!result) {
      return;
    }

    try {
      await navigator.clipboard.writeText(buildResultText());
      setActionMessage("Габариты скопированы");

      await trackBusinessEvent("business_copy_dimensions", {
        countPhotos: photoCount,
        result: {
          length: result.length,
          width: result.width,
          height: result.height,
          weight: result.weight,
          volumetric_weight: result.volumetricWeight,
        },
      });
    } catch {
      setError("Не удалось скопировать данные");
    }
  };

  const handleShare = async () => {
    if (!result) {
      return;
    }

    try {
      await navigator.clipboard.writeText(buildResultText());
      setActionMessage("Текст для отправки скопирован");

      await trackBusinessEvent("business_share", {
        countPhotos: photoCount,
        result: {
          length: result.length,
          width: result.width,
          height: result.height,
          weight: result.weight,
          volumetric_weight: result.volumetricWeight,
        },
      });
    } catch {
      setError("Не удалось подготовить текст для отправки");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#2D2D2D]">
      <header className="w-full flex justify-center px-6 pt-6 pb-4">
        <div className="w-full max-w-[1128px] flex items-center gap-4">
          <Link to="/business">
            <img src={logoSvg} alt="PochtaHub" className="h-8" />
          </Link>
          <p className="text-sm text-[#5E6472]">Business / Расчёт по фото</p>
          <button
            type="button"
            onClick={handleLogout}
            className="ml-auto rounded-lg border border-[#D5D8DE] bg-white px-4 py-2 text-sm font-semibold"
          >
            Выйти
          </button>
        </div>
      </header>

      <main className="w-full flex justify-center px-6 pb-10">
        <div className="w-full max-w-[1128px] space-y-6">
          {trialStatus?.is_trial_active && (
            <div className="rounded-2xl border border-[#DCE7F8] bg-[#EEF5FF] px-5 py-4 text-sm text-[#2E4E75]">
              У вас активирован тестовый период на 7 дней.
            </div>
          )}

          <section className="rounded-3xl border border-[#E5EAF3] bg-white p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold">
              Расчёт габаритов по фото
            </h1>
            <p className="mt-2 text-sm text-[#657080]">
              Загрузите 1–3 фото посылки и нажмите «Рассчитать».
            </p>

            <div className="mt-6 rounded-2xl border-2 border-dashed border-[#C8D6EA] bg-[#FAFCFF] p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-[#0077FE] px-5 py-3 text-sm font-semibold text-white">
                  Добавить фото
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAddPhotos}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-[#657080]">
                  Загружено: {photoCount} / 3
                </p>
              </div>

              {!!photoCount && (
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative rounded-xl border border-[#DFE5EE] bg-white p-2"
                    >
                      <img
                        src={photo.preview}
                        alt="Фото посылки"
                        className="h-28 w-full rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="absolute right-3 top-3 h-7 w-7 rounded-full bg-black/65 text-white text-sm"
                        aria-label="Удалить фото"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleCalculate}
                disabled={calcLoading || !photoCount}
                className="rounded-2xl bg-[#2D2D2D] px-8 py-4 text-base font-semibold text-white disabled:opacity-60"
              >
                {calcLoading ? "Рассчитываем..." : "Рассчитать"}
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-[#F5B9B9] bg-[#FFF3F3] px-4 py-3 text-sm text-[#B42318]">
                {error}
              </div>
            )}
          </section>

          {result && (
            <section className="rounded-3xl border border-[#E5EAF3] bg-white p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-semibold">Результат</h2>
              <div className="mt-4 space-y-2 text-base">
                <p>
                  <span className="text-[#6E7683]">Длина × Ширина × Высота:</span>{" "}
                  <strong>
                    {result.length} × {result.width} × {result.height} см
                  </strong>
                </p>
                {result.weight > 0 && (
                  <p>
                    <span className="text-[#6E7683]">Вес:</span>{" "}
                    <strong>{result.weight} кг</strong>
                  </p>
                )}
                {result.volumetricWeight > 0 && (
                  <p>
                    <span className="text-[#6E7683]">Объёмный вес:</span>{" "}
                    <strong>{result.volumetricWeight} кг</strong>
                  </p>
                )}
                <p className="text-sm text-[#6E7683]">Примечание: {result.note}</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-xl bg-[#0077FE] px-6 py-3 text-sm font-semibold text-white"
                >
                  Скопировать габариты
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="rounded-xl border border-[#C8C7CC] bg-white px-6 py-3 text-sm font-semibold text-[#2D2D2D]"
                >
                  Поделиться
                </button>
              </div>

              {actionMessage && (
                <p className="mt-4 text-sm text-[#2E4E75]">{actionMessage}</p>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default BusinessToolPage;
