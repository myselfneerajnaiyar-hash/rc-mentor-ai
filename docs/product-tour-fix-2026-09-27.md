# Product Tour repair - 27 September 2026

Implemented locally; not deployed.

The previous controller gated all launches on `/api/product-tour`, which depended on the separate `product_tour_progress` table. An unavailable table/status endpoint prevented a locally installed driver.js tour from starting. Manual launches now bypass status fetching; automatic launches fall back to the loaded profile when the optional status request fails.

The permanent shared header control appears beside Inbox on desktop and mobile. Automatic launch waits for the authenticated profile and mounted dashboard targets, without waiting for daily-activity requests. Steps use current capabilities and visible targets, including Precision Training. Skip/Close suppresses further automatic prompts for that account in the current tab session; the header always restarts the tour. Only Finish records completion.

The authoritative completion field is the existing `profiles.birbal_onboarded`. Per-account local receipts queue failed completion saves and retry on mount, focus or reconnect. Optional reads preserve completion from the previous tour table, but that migration is no longer required. Initialization errors produce a dismissible Retry Tour notice without moving dashboard content.

Changed areas: ProductTour, ProductTourOnboarding, new ProductTourButton; dashboard and Home header; MobileHome target; mobile styles; tour API; profile selection; new tourProgress helper; onboarding/browser and Inbox contract tests.

Validation: 137 relevant Node tests passed; focused tour lint passed; TypeScript check passed. Mocked browser journeys passed at 320, 375, 390, 430, 768, 1024 and 1440px, covering automatic launch, completion/replay, Skip, unavailable status, initialization retry, save retry, account switching and Profile replay. Screenshots: `.tmp-tour-header/tour-*.png`. These fixtures do not write real student records. Physical-device verification remains outside these browser checks.

Production build passed with Node exit 0. Existing pre-render dynamic-route and workout cron URL diagnostics remain. Log: .tmp-tour-header/build.log. No new migration or other manual setup is required.
