import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.page}>
      {/* Decorative gradient background */}
      <div className={styles.bg} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.brand}>
            {/* <img src="/images/spcLogo.png" alt="ShopComponent" /> */}
            <div className={styles.logo}>SC</div>
            <span className={styles.brandText}>ShopComponent</span>
          </div>
          <nav className={styles.nav}>
            <a className={styles.navLink} href="https://apps.shopify.com" target="_blank" rel="noreferrer">App Store</a>
            <a className={styles.navLink} href="#features">Features</a>
            <a className={styles.navLink} href="#how">How it works</a>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.containerGrid}>
            <div className={styles.heroCopy}>
              <h1 className={styles.heading}>
                Embed and sell Shopify products anywhere.
              </h1>
              <p className={styles.subheading}>
                Reach customers beyond your Shopify store. Easily embed products into blogs, affiliate/partner sites, or landing pages; Customizable, trackable, and synced with Shopify in real time.
              </p>

              {showForm && (
                <Form className={styles.form} method="post" action="/auth/login">
                  <label className={styles.label}>
                    <span className={styles.labelText}>Shop domain</span>
                    <input
                      className={styles.input}
                      type="text"
                      name="shop"
                      placeholder="my-shop-domain.myshopify.com"
                      aria-label="Shop domain"
                      required
                      pattern=".*\.myshopify\.com$"
                      title="Enter a valid Shopify domain, e.g. example.myshopify.com"
                    />
                  </label>
                  <button className={styles.button} type="submit">
                    Install with Shopify
                    <svg className={styles.buttonIcon} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                      <path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <p className={styles.smallNote}>
                    No credit card needed · Quick 1-minute setup
                  </p>
                </Form>
              )}

              <div className={styles.trustRow}>
                <span className={styles.trustHint}>Works with</span>
                <div className={styles.trustLogos}>
                  <span className={styles.trustBadge}>WordPress</span>
                  <span className={styles.dividerDot} />
                  <span className={styles.trustBadge}>Webflow</span>
                  <span className={styles.dividerDot} />
                  <span className={styles.trustBadge}>Ghost</span>
                  <span className={styles.dividerDot} />
                  <span className={styles.trustBadge}>Custom HTML</span>
                </div>
              </div>
            </div>

            <aside className={styles.heroCard} aria-label="Embed preview">
              <div className={styles.previewHeader}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </div>
              <div className={styles.previewBody}>
                <div className={styles.previewImage} />
                <div className={styles.previewMeta}>
                  <div>
                    <h3 className={styles.previewTitle}>“Drop-in Product Card”</h3>
                    <p className={styles.previewDesc}>
                      Copy one line of code to embed your product with live price, variants, and CTA.
                    </p>
                  </div>
                  <code className={styles.code}>
                    &lt;script src="https://app.shopcomponent.com/shopcomponent.js"
                    data-product="gid://shopify/Product/123" data-theme="minimal" async&gt;&lt;/script&gt;
                  </code>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section id="how" className={styles.how}>
          <div className={styles.container}>
            <h2 className={styles.poweredByText}>“Powered by Shopify’s latest web components. Secure checkout, Shop Pay included.”</h2>
          </div>
        </section>

        <section id="features" className={styles.features}>
          <div className={styles.container}>
            <ul className={styles.featureGrid}>
              <li className={styles.featureItem}>
                <div className={styles.iconWrap}>
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                </div>
                <h4>Customizable Components</h4>
                <p> Design product cards that fit your brand. Adjust layouts, colors, and CTAs—no coding required.</p>
              </li>
              <li className={styles.featureItem}>
                <div className={styles.iconWrap}>
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 12a9 9 0 1018 0A9 9 0 003 12zm9-5v6l4 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                </div>
                <h4>Share & Embed Anywhere</h4>
                <p>One script, unlimited reach. Works seamlessly on WordPress, Webflow, Ghost, or any site with HTML.</p>
              </li>
              <li className={styles.featureItem}>
                <div className={styles.iconWrap}>
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 3h18v14H3zM7 21h10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h4>Sales Attribution</h4>
                <p>Know what’s working. Track clicks, carts, and sales for every partner or content embed.</p>
              </li>
              <li className={styles.featureItem}>
                <div className={styles.iconWrap}>
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 3v18M3 12h18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                </div>
                <h4>Variant & Price Sync</h4>
                <p> Never worry about outdated info. Prices, variants, and inventory stay synced with Shopify automatically.</p>
              </li>
            </ul>
          </div>
        </section>

        <section id="how" className={styles.how}>
          <div className={styles.container}>
            <h3 className={styles.howTitle}>Get started in 3 steps</h3>
            <ol className={styles.steps}>
              <li>
                <span className={styles.stepNum}>1</span>
               Install & Create – Add ShopComponent and choose the collection, products, or bundle you want to share.
              </li>
              <li>
                <span className={styles.stepNum}>2</span>
               Customize & Copy – Match your brand with themes, copy, and buttons. Copy code.
              </li>
              <li>
                <span className={styles.stepNum}>3</span>
                Share Anywhere– Paste the code into blogs, partner sites, or landing pages. Track every sale.
              </li>
            </ol>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <p className={styles.footerText}>
            Your products deserve to be seen everywhere.
            Start embedding today and turn any audience into customers.
          </p>
          {showForm && (
            <Form method="post" action="/auth/login">
              <input
                className={styles.inputSm}
                type="text"
                name="shop"
                placeholder="example.myshopify.com"
                required
                pattern=".*\.myshopify\.com$"
              />
              <button className={styles.buttonSm} type="submit">Start free</button>
            </Form>
          )}
          <small className={styles.legal}>© {new Date().getFullYear()} ShopComponent</small>
        </div>
      </footer>
    </div>
  );
}
