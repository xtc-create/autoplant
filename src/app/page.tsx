import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="landing">
      <style>{`
        .landing {
          min-height: 100vh;
          background: #f7faf8;
          color: #122018;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          overflow-x: hidden;
        }

        .hero {
          position: relative;
          min-height: 92vh;
          display: grid;
          align-items: center;
          padding: 28px;
          isolation: isolate;
        }

        .hero::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -2;
          background:
            linear-gradient(90deg, rgba(247,250,248,0.96) 0%, rgba(247,250,248,0.86) 42%, rgba(247,250,248,0.34) 100%),
            url("https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1800&q=80");
          background-position: center;
          background-size: cover;
        }

        .hero::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 140px;
          z-index: -1;
          background: linear-gradient(180deg, rgba(247,250,248,0), #f7faf8 76%);
        }

        .nav {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 20px 28px;
        }

        .brand {
          font-size: 16px;
          font-weight: 750;
          letter-spacing: 0;
        }

        .nav a,
        .hero-actions a,
        .secondary-link {
          border-radius: 8px;
          color: inherit;
          font-size: 14px;
          font-weight: 650;
          text-decoration: none;
        }

        .nav a {
          border: 1px solid rgba(18,32,24,0.18);
          background: rgba(255,255,255,0.72);
          padding: 10px 14px;
        }

        .hero-content {
          width: min(650px, 100%);
          padding-top: 58px;
        }

        .eyebrow {
          margin: 0 0 14px;
          color: #28734b;
          font-size: 12px;
          font-weight: 750;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        h1 {
          margin: 0;
          max-width: 620px;
          font-size: clamp(42px, 9vw, 88px);
          line-height: 0.96;
          letter-spacing: 0;
        }

        .subcopy {
          max-width: 560px;
          margin: 22px 0 0;
          color: #3f5148;
          font-size: clamp(16px, 2.8vw, 20px);
          line-height: 1.55;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .primary-link {
          background: #1f8a4c;
          color: #ffffff !important;
          padding: 13px 18px;
        }

        .secondary-link {
          border: 1px solid rgba(18,32,24,0.18);
          background: rgba(255,255,255,0.74);
          padding: 12px 16px;
        }

        .quick-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          width: min(560px, 100%);
          margin-top: 34px;
        }

        .stat {
          border: 1px solid rgba(18,32,24,0.12);
          border-radius: 8px;
          background: rgba(255,255,255,0.78);
          padding: 14px;
        }

        .stat span {
          display: block;
          color: #657369;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .stat strong {
          display: block;
          margin-top: 7px;
          font-size: 18px;
        }

        .below {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          width: min(1120px, calc(100% - 56px));
          margin: -42px auto 0;
          padding-bottom: 40px;
          position: relative;
          z-index: 2;
        }

        .feature {
          border: 1px solid rgba(18,32,24,0.1);
          border-radius: 8px;
          background: #ffffff;
          padding: 18px;
          min-height: 120px;
        }

        .feature h2 {
          margin: 0;
          font-size: 16px;
        }

        .feature p {
          margin: 10px 0 0;
          color: #596b61;
          font-size: 14px;
          line-height: 1.5;
        }

        @media (max-width: 760px) {
          .hero {
            min-height: 88vh;
            padding: 18px;
          }

          .nav {
            padding: 14px 18px;
          }

          .hero-content {
            padding-top: 72px;
          }

          .hero-actions a {
            width: 100%;
            box-sizing: border-box;
            text-align: center;
          }

          .quick-stats,
          .below {
            grid-template-columns: 1fr;
          }

          .below {
            width: calc(100% - 36px);
            margin-top: -24px;
          }
        }
      `}</style>

      <section className="hero">
        <nav className="nav">
          <div className="brand">AutoPlant</div>
          <Link href="/dashboard">Paneli</Link>
        </nav>

        <div className="hero-content">
          <p className="eyebrow">Monitorim bime me ESP32</p>
          <h1>AutoPlant</h1>
          <p className="subcopy">
            Ndiq temperaturën, lagështinë e ajrit dhe lagështinë e tokës nga sensori ESP32, pastaj pyet Plant AI çfarë duhet të bësh.
          </p>

          <div className="hero-actions">
            <Link className="primary-link" href="/dashboard">Hap panelin</Link>
            <a className="secondary-link" href="/api/latest">Shiko API-në</a>
          </div>

          <div className="quick-stats" aria-label="Pikat kryesore të AutoPlant">
            <div className="stat">
              <span>Sensorët</span>
              <strong>Temp + ajër + tokë</strong>
            </div>
            <div className="stat">
              <span>Përditësime</span>
              <strong>Të dhëna live nga API</strong>
            </div>
            <div className="stat">
              <span>Asistent</span>
              <strong>Chat për bimën</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="below" aria-label="Veçoritë e AutoPlant">
        <article className="feature">
          <h2>Panel sensorësh</h2>
          <p>Shiko leximet e fundit, gjendjen e lagështisë, trendet dhe historikun CSV në një pamje të qartë.</p>
        </article>
        <article className="feature">
          <h2>Njoftime për ujitje</h2>
          <p>Toka e thatë shfaqet menjëherë me pragjet 0-29%, 30-59% dhe 60-100%.</p>
        </article>
        <article className="feature">
          <h2>Plant AI</h2>
          <p>Pyet për këshilla praktike duke përdorur kontekstin aktual të sensorëve, jo vetëm numra të thatë.</p>
        </article>
      </section>
    </main>
  );
}
