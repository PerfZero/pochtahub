import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const METRIKA_ID = 104664178;
const PAGE_SOURCE = "abc_v1";

function trackMetrika(goal, params = {}) {
  if (typeof window === "undefined" || typeof window.ym !== "function") {
    return;
  }

  if (params && Object.keys(params).length > 0) {
    window.ym(METRIKA_ID, "reachGoal", goal, params);
    return;
  }

  window.ym(METRIKA_ID, "reachGoal", goal);
}

function AbcLandingPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");

  useEffect(() => {
    trackMetrika("abc_view", { source: PAGE_SOURCE });
  }, []);

  const handleContinue = (event) => {
    event.preventDefault();
    trackMetrika("ожидание_шаг");
    trackMetrika("abc_cta_click", {
      source: PAGE_SOURCE,
    });

    navigate("/wizard?step=recipientRoute", {
      state: {
        wizardData: {
          selectedRole: "recipient",
          source: PAGE_SOURCE,
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#F8FBFF_0%,#F6F8FB_52%,#F3EFE8_100%)] text-[#222B38]">
      <main className="mx-auto flex min-h-screen max-w-[1128px] items-center px-4 py-6 md:px-6">
        <section className="w-full max-w-[720px]">
          <div className="rounded-[28px] border border-[#DCE4EF] bg-white/88 px-5 py-8 shadow-[0_18px_50px_rgba(31,50,80,0.08)] backdrop-blur-sm md:px-10 md:py-12">
            <h1 className="max-w-[620px] text-[36px] font-bold leading-[0.98] tracking-[-0.04em] text-[#1F2A39] md:text-[68px]">
              Не устраивает доставка, которую предлагают?
            </h1>

            <p className="mt-4 max-w-[540px] text-lg leading-[1.3] text-[#5A6778] md:text-[30px]">
              Вы можете сами оформить доставку — курьер заберёт товар у
              продавца.
            </p>

            <form className="mt-5 max-w-[520px]" onSubmit={handleContinue}>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Телефон"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="h-14 w-full rounded-2xl border border-[#D4DCE7] bg-white px-5 text-base text-[#1F2A39] outline-none transition-colors placeholder:text-[#8A95A6] focus:border-[#0077FE] md:h-16 md:text-lg"
              />

              <button
                type="submit"
                className="mt-4 inline-flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-[#0077FE] px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-[#0066D9] md:text-lg"
              >
                Посмотреть варианты доставки
              </button>
            </form>

            <p className="mt-4 text-sm leading-6 text-[#7D8896] md:text-base">
              Отправим варианты доставки на телефон.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AbcLandingPage;
