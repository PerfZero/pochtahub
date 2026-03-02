import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PhoneInput from "../components/PhoneInput";

const METRIKA_ID = 104664178;
const PAGE_SOURCE = "abc_v1";

function trackMetrika(goal, params = {}) {
  if (typeof window === "undefined" || typeof window.ym !== "function") {
    return;
  }

  window.ym(METRIKA_ID, "reachGoal", goal, params);
}

function AbcLandingPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");

  useEffect(() => {
    trackMetrika("abc_view", { source: PAGE_SOURCE });
  }, []);

  const handleContinue = () => {
    trackMetrika("abc_cta_click", {
      source: PAGE_SOURCE,
      has_phone: Boolean(phone.trim()),
    });

    navigate("/wizard?step=recipientRoute", {
      state: {
        wizardData: {
          selectedRole: "recipient",
          source: PAGE_SOURCE,
          contactPhone: phone,
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#F8FBFF_0%,#F6F8FB_52%,#F3EFE8_100%)] text-[#222B38]">
      <main className="mx-auto flex min-h-screen max-w-[1128px] items-center px-4 py-6 md:px-6">
        <section className="w-full max-w-[720px]">
          <div className="rounded-[28px] border border-[#DCE4EF] bg-white/88 px-5 py-8 shadow-[0_18px_50px_rgba(31,50,80,0.08)] backdrop-blur-sm md:px-10 md:py-12">
            <h1 className="max-w-[620px] text-[36px] font-bold uppercase leading-[0.98] tracking-[-0.04em] text-[#1F2A39] md:text-[68px]">
              ОБЕЩАЛ ОТПРАВИТЬ - И ТИШИНА?
            </h1>

            <p className="mt-4 text-lg leading-[1.3] text-[#5A6778] md:text-[30px]">
              Вы ждёте, а ничего не происходит.
            </p>

            <div className="mt-8 max-w-[420px]">
              <PhoneInput
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                label="Телефон"
              />
            </div>

            <button
              type="button"
              onClick={handleContinue}
              className="mt-4 inline-flex min-h-[56px] items-center justify-center rounded-2xl bg-[#0077FE] px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-[#0066D9] md:text-lg"
            >
              Понять, что можно сделать дальше
            </button>

            <p className="mt-4 text-sm text-[#7D8896] md:text-base">
              Никаких оплат. Просто разберём ситуацию.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AbcLandingPage;
