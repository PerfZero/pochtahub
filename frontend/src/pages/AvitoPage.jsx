import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoSvg from "../assets/images/logo.svg";

const TELEGRAM_URL = "https://t.me/pochtahub_bot";

function AvitoPage() {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/wizard", { state: { fromCity: from, toCity: to, source: "avito" } });
  };

  return (
    <div
      style={{ backgroundColor: "#0F1724", minHeight: "100vh", fontFamily: "'Onest', sans-serif" }}
      className="flex flex-col items-center justify-center px-4 py-12"
    >
      {/* Logo */}
      <div className="mb-10">
        <img src={logoSvg} alt="Почтахаб" style={{ height: 28 }} />
      </div>

      {/* Content */}
      <div className="w-full max-w-md">
        {/* Badge */}
        <div className="mb-5">
          <span
            style={{
              backgroundColor: "#1a7f3c",
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 20,
              padding: "4px 12px",
            }}
          >
            Авито · самовывоз
          </span>
        </div>

        {/* Heading */}
        <h1
          style={{ color: "#fff", fontSize: "clamp(28px, 7vw, 36px)", fontWeight: 700, lineHeight: 1.2, marginBottom: 14 }}
        >
          Продавец только{" "}
          <span style={{ color: "#0077FE" }}>самовывоз?</span>
          <br />
          Курьер заберёт сам
        </h1>

        {/* Subtitle */}
        <p style={{ color: "#8A9BB5", fontSize: 15, lineHeight: 1.5, marginBottom: 28 }}>
          Укажите откуда и куда — рассчитаем стоимость и заберём товар. Вам ехать не нужно.
        </p>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: "#162032",
            border: "1px solid #243349",
            borderRadius: 20,
            padding: 20,
            marginBottom: 0,
          }}
        >
          {/* From field */}
          <div className="mb-1">
            <label style={{ color: "#8A9BB5", fontSize: 12, fontWeight: 500, marginBottom: 6, display: "block" }}>
              Откуда забрать
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 18 }}>
                📍
              </span>
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="Город продавца или ссылка на объявление"
                style={{
                  width: "100%",
                  backgroundColor: "#0F1724",
                  border: "1px solid #243349",
                  borderRadius: 12,
                  padding: "12px 14px 12px 42px",
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0077FE")}
                onBlur={(e) => (e.target.style.borderColor = "#243349")}
              />
            </div>
            <p style={{ color: "#5A6F8A", fontSize: 12, marginTop: 6, paddingLeft: 2 }}>
              Не знаете город — просто вставьте ссылку с Авито
            </p>
          </div>

          {/* Arrow divider */}
          <div style={{ textAlign: "center", color: "#5A6F8A", fontSize: 18, margin: "8px 0" }}>↓</div>

          {/* To field */}
          <div className="mb-5">
            <label style={{ color: "#8A9BB5", fontSize: 12, fontWeight: 500, marginBottom: 6, display: "block" }}>
              Куда доставить
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 18 }}>
                🏠
              </span>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Ваш город"
                style={{
                  width: "100%",
                  backgroundColor: "#0F1724",
                  border: "1px solid #243349",
                  borderRadius: 12,
                  padding: "12px 14px 12px 42px",
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0077FE")}
                onBlur={(e) => (e.target.style.borderColor = "#243349")}
              />
            </div>
          </div>

          {/* CTA button */}
          <button
            type="submit"
            style={{
              width: "100%",
              backgroundColor: "#fff",
              color: "#0F1724",
              border: "none",
              borderRadius: 12,
              padding: "14px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: 16,
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#E8EDF5")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#fff")}
          >
            Рассчитать стоимость →
          </button>

          {/* Trust points */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 16,
              paddingBottom: 16,
              borderBottom: "1px solid #243349",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <span style={{ color: "#1a7f3c", fontSize: 16, marginTop: 1 }}>●</span>
              <span style={{ color: "#8A9BB5", fontSize: 12, lineHeight: 1.4 }}>
                Оплата после того, как курьер забрал товар
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <span style={{ color: "#1a7f3c", fontSize: 16, marginTop: 1 }}>●</span>
              <span style={{ color: "#8A9BB5", fontSize: 12, lineHeight: 1.4 }}>
                Продавцу ничего оформлять не нужно
              </span>
            </div>
          </div>

          {/* OR divider */}
          <div style={{ textAlign: "center", color: "#5A6F8A", fontSize: 13, marginBottom: 16 }}>или</div>

          {/* Telegram button */}
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              width: "100%",
              backgroundColor: "transparent",
              color: "#fff",
              border: "1px solid #243349",
              borderRadius: 12,
              padding: "14px",
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
              textAlign: "center",
              textDecoration: "none",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => (e.target.style.borderColor = "#0077FE")}
            onMouseLeave={(e) => (e.target.style.borderColor = "#243349")}
          >
            Написать в Telegram — разберёмся вместе
          </a>
        </form>
      </div>
    </div>
  );
}

export default AvitoPage;
