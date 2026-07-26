import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

function normalizeSiteBasePath(value: string | undefined) {
  const path = value?.trim().replace(/^\/+|\/+$/g, "") ?? "";
  return path ? `/${path}/` : "/";
}

const siteBasePath = normalizeSiteBasePath(process.env.SITE_BASE_PATH);
const publicPath = (asset: string) =>
  `${siteBasePath}${asset.replace(/^\/+/, "")}`;

const sectionIds = [
  "hero",
  "about",
  "interests",
  "side-quests",
  "strengths",
  "bugs",
  "beauty",
  "product-philosophy",
  "rapid-fire",
  "closing",
] as const;

async function openProfile(page: Page) {
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);
  await expect(
    page.getByRole("heading", { level: 1, name: /10\s+TABS\s+OPEN/i }),
  ).toBeVisible();
}

test.describe("desktop creative CV", () => {
  test.skip(({ isMobile }) => Boolean(isMobile), "Desktop-only acceptance");

  test("renders all sections and scrubs the temporarily sticky Hero video", async ({
    page,
  }) => {
    test.slow();
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });
    await page.addInitScript(() => {
      const metricsWindow = window as Window & {
        __layoutShiftScore?: number;
        __layoutShiftObserver?: PerformanceObserver;
      };
      metricsWindow.__layoutShiftScore = 0;

      if (!PerformanceObserver.supportedEntryTypes.includes("layout-shift")) {
        return;
      }

      metricsWindow.__layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & {
            hadRecentInput: boolean;
            value: number;
          };
          if (!shift.hadRecentInput) {
            metricsWindow.__layoutShiftScore! += shift.value;
          }
        }
      });
      metricsWindow.__layoutShiftObserver.observe({ type: "layout-shift", buffered: true });
    });
    await openProfile(page);
    await expect(page).toHaveTitle(/Ashwin Sheoran.+10 Tabs Open/i);

    for (const id of sectionIds) {
      await expect(page.locator(`#${id}`), `missing #${id}`).toHaveCount(1);
    }

    await expect(
      page.getByRole("heading", {
        name: /I STARTED WITH CODE.+THEN I GOT CURIOUS/i,
      }),
    ).toBeAttached();
    await expect(
      page.getByRole("heading", {
        name: /NO GRAND CONCLUSION.+NEXT TAB IS ALREADY LOADING/i,
      }),
    ).toBeAttached();
    await expect(page.locator("#production")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: /PRODUCTION/i }),
    ).toHaveCount(0);

    const hero = page.locator("#hero");
    const stickyHero = hero.locator(".hero");
    const video = hero.locator("video.hero-media__asset");
    await expect(video).toHaveCount(1);
    await expect
      .poll(() =>
        video.evaluate(
          (element) =>
            Number.isFinite((element as HTMLVideoElement).duration) &&
            (element as HTMLVideoElement).duration > 0,
        ),
      )
      .toBe(true);

    const mediaContract = await video.evaluate((element) => {
      const videoElement = element as HTMLVideoElement;
      const videoRect = videoElement.getBoundingClientRect();
      const heroElement = videoElement.closest(".hero");
      const scrollContainer = videoElement.closest("#hero");
      if (!heroElement || !scrollContainer) {
        throw new Error("Hero ancestors not found");
      }
      const heroRect = heroElement.getBoundingClientRect();
      const styles = getComputedStyle(videoElement);
      const heroStyles = getComputedStyle(heroElement);

      return {
        autoPlay: videoElement.autoplay,
        loop: videoElement.loop,
        muted: videoElement.muted,
        paused: videoElement.paused,
        playsInline: videoElement.playsInline,
        preload: videoElement.preload,
        objectFit: styles.objectFit,
        opacity: Number(styles.opacity),
        position: styles.position,
        stickyPosition: heroStyles.position,
        outerHeight: scrollContainer.getBoundingClientRect().height,
        viewportHeight: window.innerHeight,
        contained:
          videoRect.left >= heroRect.left - 1 &&
          videoRect.top >= heroRect.top - 1 &&
          videoRect.right <= heroRect.right + 1 &&
          videoRect.bottom <= heroRect.bottom + 1,
        topBeforeScroll: videoRect.top,
      };
    });

    expect(mediaContract).toMatchObject({
      autoPlay: false,
      loop: false,
      muted: true,
      paused: true,
      playsInline: true,
      preload: "auto",
      objectFit: "cover",
      position: "absolute",
      stickyPosition: "sticky",
      contained: true,
    });
    expect(mediaContract.opacity).toBeCloseTo(1, 2);
    expect(mediaContract.outerHeight).toBeGreaterThan(
      mediaContract.viewportHeight * 2.1,
    );

    const duration = await video.evaluate(
      (element) => (element as HTMLVideoElement).duration,
    );
    const scrollToProgress = async (progress: number) => {
      await hero.evaluate((element, nextProgress) => {
        const range = element.offsetHeight - window.innerHeight;
        window.scrollTo({
          top: element.offsetTop + range * nextProgress,
          behavior: "instant",
        });
      }, progress);

      const expectedTime =
        progress >= 1 ? Math.max(0, duration - 1 / 24) : duration * progress;
      await expect
        .poll(
          () =>
            video.evaluate(
              (element) => (element as HTMLVideoElement).currentTime,
            ),
          { timeout: 5_000 },
        )
        .toBeCloseTo(expectedTime, 1);
      return expectedTime;
    };

    await scrollToProgress(0.25);
    await scrollToProgress(0.55);
    const stoppedTime = await video.evaluate(
      (element) => (element as HTMLVideoElement).currentTime,
    );
    await page.waitForTimeout(250);
    expect(
      Math.abs(
        (await video.evaluate(
          (element) => (element as HTMLVideoElement).currentTime,
        )) - stoppedTime,
      ),
    ).toBeLessThan(0.05);

    await scrollToProgress(0.2);
    const reverseTime = await video.evaluate(
      (element) => (element as HTMLVideoElement).currentTime,
    );
    expect(reverseTime).toBeLessThan(stoppedTime);

    await scrollToProgress(1);
    await page.locator("#interests").scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        stickyHero.evaluate((element) => element.getBoundingClientRect().bottom),
      )
      .toBeLessThan(0);

    await scrollToProgress(0.4);
    await expect(stickyHero).toBeInViewport();

    const layoutShiftScore = await page.evaluate(
      () =>
        (window as Window & { __layoutShiftScore?: number })
          .__layoutShiftScore ?? 0,
    );
    expect(layoutShiftScore).toBeLessThan(0.1);
    expect(runtimeErrors).toEqual([]);
  });

  test("uses the native cursor without pointer-tracking listeners", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const originalAddEventListener = window.addEventListener;
      let pointerMoveListeners = 0;
      Object.defineProperty(window, "__pointerMoveListeners", {
        configurable: true,
        get: () => pointerMoveListeners,
      });
      window.addEventListener = function addEventListener(
        type,
        listener,
        options,
      ) {
        if (type === "pointermove") pointerMoveListeners += 1;
        return originalAddEventListener.call(this, type, listener, options);
      };
    });
    await openProfile(page);

    await expect(page.locator(".custom-cursor")).toHaveCount(0);
    await expect(page.locator("[data-cursor]")).toHaveCount(0);
    await expect(page.locator("body")).not.toHaveClass(/has-custom-cursor/);

    const cursorContract = await page.evaluate(() => ({
      documentCursor: getComputedStyle(document.documentElement).cursor,
      bodyCursor: getComputedStyle(document.body).cursor,
      interactiveCursor: getComputedStyle(
        document.querySelector<HTMLAnchorElement>(".brutal-button")!,
      ).cursor,
      pointerMoveListeners: (
        window as Window & { __pointerMoveListeners: number }
      ).__pointerMoveListeners,
    }));

    expect(cursorContract).toEqual({
      documentCursor: "auto",
      bodyCursor: "auto",
      interactiveCursor: "pointer",
      pointerMoveListeners: 0,
    });
  });

  test("interest tabs work with click and full keyboard navigation", async ({
    page,
  }) => {
    await openProfile(page);

    const tablist = page.getByRole("tablist", { name: "Open interests" });
    const cricket = tablist.getByRole("tab", { name: /CRICKET/i });
    const markets = tablist.getByRole("tab", { name: /MARKETS/i });
    const gaming = tablist.getByRole("tab", { name: /GAMING/i });
    const photography = tablist.getByRole("tab", { name: /PHOTOGRAPHY/i });

    await tablist.scrollIntoViewIfNeeded();
    await expect(cricket).toHaveAttribute("aria-selected", "true");
    await markets.click();
    await expect(markets).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("tabpanel").getByRole("heading", { name: "MARKETS" }),
    ).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await expect(gaming).toBeFocused();
    await expect(gaming).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("Home");
    await expect(cricket).toBeFocused();
    await expect(cricket).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("End");
    await expect(photography).toBeFocused();
    await expect(photography).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toContainText(
      "Technology taught me to build systems",
    );
  });

  test("bug controls announce feedback and CRICKET opens the scorecard", async ({
    page,
  }) => {
    await openProfile(page);

    const acknowledge = page.getByRole("button", { name: /ACKNOWLEDGE/i });
    await acknowledge.scrollIntoViewIfNeeded();
    await acknowledge.click();
    await expect(page.locator(".bug-response[role='status']")).toHaveText(
      "BUG ACKNOWLEDGED. STILL REPRODUCIBLE.",
    );

    await page.keyboard.type("cRiCkEt");
    const scorecard = page.getByRole("status", {
      name: "Cricket scorecard easter egg",
    });
    await expect(scorecard).toBeVisible();
    await expect(scorecard).toContainText("10 / 0");
    await scorecard.getByRole("button", { name: "Close scorecard" }).click();
    await expect(scorecard).toHaveCount(0);
  });
});

test.describe("mobile composition", () => {
  test.skip(({ isMobile }) => !isMobile, "Mobile-only acceptance");

  test("uses the static Hero and local horizontal scrolling without page overflow", async ({
    page,
  }) => {
    await openProfile(page);

    await expect(page.locator(".custom-cursor")).toHaveCount(0);
    await expect(page.locator("[data-cursor]")).toHaveCount(0);
    await expect(page.locator("body")).not.toHaveClass(/has-custom-cursor/);
    const hero = page.locator("#hero");
    await expect(hero).toHaveClass(/hero-scroll-container--static/);
    await expect(hero.locator("video")).toHaveCount(0);
    await expect(hero.locator("img.hero-media__asset")).toHaveAttribute(
      "src",
      publicPath("hero-poster.webp"),
    );

    const profileNavigation = page.getByRole("navigation", {
      name: "Profile sections",
    });
    const navigationTrack = profileNavigation.locator(
      ".tab-navigation__track",
    );
    const menuToggle = profileNavigation.locator(".mobile-nav-menu-button");

    await expect
      .poll(() =>
        profileNavigation.evaluate((element) =>
          Math.round(element.getBoundingClientRect().top),
        ),
      )
      .toBe(40);

    await expect(menuToggle).toHaveAttribute("aria-expanded", "false");
    await expect(menuToggle).toHaveAccessibleName("Open section menu");
    await expect(navigationTrack).toBeHidden();
    await menuToggle.click();
    await expect(menuToggle).toHaveAttribute("aria-expanded", "true");
    await expect(menuToggle).toHaveAccessibleName("Close section menu");
    await expect(navigationTrack).toBeVisible();

    const navigationMetrics = await navigationTrack.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      viewportWidth: window.innerWidth,
      linkBounds: Array.from(element.querySelectorAll("a")).map((link) => {
        const bounds = link.getBoundingClientRect();
        return { left: bounds.left, right: bounds.right };
      }),
    }));
    expect(navigationMetrics.scrollWidth).toBeLessThanOrEqual(
      navigationMetrics.clientWidth + 1,
    );
    expect(
      navigationMetrics.linkBounds.every(
        ({ left, right }) =>
          left >= -1 && right <= navigationMetrics.viewportWidth + 1,
      ),
    ).toBe(true);

    await page.keyboard.press("Escape");
    await expect(navigationTrack).toBeHidden();
    await expect(menuToggle).toBeFocused();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect
      .poll(() =>
        profileNavigation.evaluate((element) =>
          Math.round(element.getBoundingClientRect().top),
        ),
      )
      .toBe(40);

    const tablist = page.getByRole("tablist", { name: "Open interests" });
    await tablist.scrollIntoViewIfNeeded();

    const tabMetrics = await tablist.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(tabMetrics.scrollWidth).toBeGreaterThan(tabMetrics.clientWidth);
    await expect(tablist.getByRole("tab")).toHaveCount(5);
    await expect(tablist.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);

    const photography = tablist.getByRole("tab", { name: /PHOTOGRAPHY/i });
    await photography.click();
    await expect(photography).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toContainText(
      "Photography is teaching me to notice moments",
    );
    await expect
      .poll(() => tablist.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0);

    const tabHeight = await photography.evaluate(
      (element) => element.getBoundingClientRect().height,
    );
    expect(tabHeight).toBeGreaterThanOrEqual(44);

    const viewportOverflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(viewportOverflow.scrollWidth).toBeLessThanOrEqual(
      viewportOverflow.clientWidth + 1,
    );
  });
});

test.describe("responsive geometry", () => {
  test.skip(
    ({ browserName, isMobile }) => browserName !== "chromium" || Boolean(isMobile),
    "The full resize sweep runs once in desktop Chromium",
  );

  test("has no document overflow or clipped display headings across the viewport matrix", async ({
    page,
  }) => {
    test.slow();
    const viewportMatrix = [
      [2560, 1440],
      [1920, 1080],
      [1728, 1117],
      [1512, 982],
      [1440, 900],
      [1366, 768],
      [1280, 800],
      [1024, 768],
      [834, 1194],
      [430, 932],
      [390, 844],
      [360, 800],
      [320, 800],
    ] as const;
    const continuousSweep = Array.from(
      { length: Math.floor((2560 - 320) / 80) + 1 },
      (_, index) => {
        const width = 320 + index * 80;
        const height = Math.round(Math.min(1117, Math.max(720, width * 0.64)));
        return [width, height] as const;
      },
    );

    await page.setViewportSize({ width: 1440, height: 900 });
    await openProfile(page);

    for (const [width, height] of [...viewportMatrix, ...continuousSweep]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => window.scrollTo(0, 0));
      const heroContainer = page.locator("#hero");

      if (width > 900) {
        await expect(heroContainer).not.toHaveClass(
          /hero-scroll-container--static/,
        );
      } else {
        await expect(heroContainer).toHaveClass(
          /hero-scroll-container--static/,
        );
      }

      const geometry = await page.evaluate((viewportWidth) => {
        const root = document.documentElement;
        const headingSelectors = [
          ".section-heading h2",
          ".closing-section > h2",
          ".interest-copy h3",
          ".bug-report > h3",
          ".side-quest--newspaper h3",
        ];
        const clippedHeadings = Array.from(
          document.querySelectorAll<HTMLElement>(headingSelectors.join(",")),
        )
          .filter(
            (heading) =>
              heading.scrollWidth > heading.clientWidth + 1 ||
              heading.getBoundingClientRect().width >
                heading.parentElement!.getBoundingClientRect().width + 1,
          )
          .map((heading) => heading.textContent?.trim().slice(0, 80) ?? "unknown");

        const hero = document.querySelector<HTMLElement>("#hero .hero");
        const about = document.querySelector<HTMLElement>("#about");
        const navigationTrack = document.querySelector<HTMLElement>(
          ".tab-navigation__track",
        );
        const navigationRect = navigationTrack?.getBoundingClientRect();
        const stickyHero = viewportWidth > 900 && hero
          ? {
              position: getComputedStyle(hero).position,
              height: hero.getBoundingClientRect().height,
            }
          : null;

        return {
          overflow: root.scrollWidth - root.clientWidth,
          clippedHeadings,
          stickyHero,
          aboutInlinePadding: about
            ? Number.parseFloat(getComputedStyle(about).paddingLeft)
            : Number.NaN,
          navigation: navigationRect
            ? { left: navigationRect.left, right: navigationRect.right }
            : null,
        };
      }, width);

      expect(
        geometry.overflow,
        `document overflow at ${width}×${height}`,
      ).toBeLessThanOrEqual(1);
      expect(
        geometry.clippedHeadings,
        `clipped display copy at ${width}×${height}`,
      ).toEqual([]);
      expect(
        geometry.aboutInlinePadding,
        `excessive section gutter at ${width}×${height}`,
      ).toBeLessThanOrEqual(48.1);

      if (width > 900) {
        expect(geometry.stickyHero?.position).toBe("sticky");
        expect(geometry.stickyHero?.height).toBeCloseTo(height, 0);
        expect(geometry.navigation?.left).toBeCloseTo(0, 0);
        expect(geometry.navigation?.right).toBeCloseTo(width, 0);
      } else {
        expect(geometry.stickyHero).toBeNull();
      }
    }
  });
});

test.describe("assets, fallbacks and accessibility", () => {
  test("resolves every public asset from the configured site base", async ({
    page,
  }) => {
    const failedLocalResponses: string[] = [];
    page.on("response", (response) => {
      const url = new URL(response.url());
      if (
        url.origin === "http://127.0.0.1:4173" &&
        response.status() >= 400
      ) {
        failedLocalResponses.push(`${response.status()} ${url.pathname}`);
      }
    });

    await openProfile(page);
    await page.waitForLoadState("networkidle");
    expect(failedLocalResponses).toEqual([]);

    const assets = [
      ["favicon-10.svg", "image/svg+xml"],
      ["hero-scroll.mp4", "video/mp4"],
      ["hero-poster.webp", "image/webp"],
      ["assets/editorial/technical-collage.webp", "image/webp"],
      ["Ashwin-Sheoran-CV.pdf", "application/pdf"],
    ] as const;

    for (const [path, expectedContentType] of assets) {
      const response = await page.request.get(publicPath(path));
      expect(response.ok(), `${path} did not resolve`).toBe(true);
      expect(response.headers()["content-type"]).toContain(expectedContentType);
      expect((await response.body()).byteLength).toBeGreaterThan(0);
    }
  });

  test("serves the CV and LinkedIn without rendering an email control", async ({
    page,
  }) => {
    await openProfile(page);

    const cvLink = page.getByRole("link", { name: /VIEW TRADITIONAL CV/i });
    await expect(cvLink).toHaveAttribute(
      "href",
      publicPath("Ashwin-Sheoran-CV.pdf"),
    );
    await expect(cvLink).toHaveAttribute("target", "_blank");

    const cvResponse = await page.request.get(
      publicPath("Ashwin-Sheoran-CV.pdf"),
    );
    expect(cvResponse.ok()).toBeTruthy();
    expect(cvResponse.headers()["content-type"]).toContain("application/pdf");
    const cvBytes = await cvResponse.body();
    expect(cvBytes.subarray(0, 5).toString()).toBe("%PDF-");

    const linkedIn = page.getByRole("link", { name: /LINKEDIN/i });
    await expect(linkedIn).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/ashwin-sheoran/",
    );
    await expect(linkedIn).toHaveAttribute("target", "_blank");
    await expect(
      page.getByRole("button", { name: /LINKEDIN/i }),
    ).toHaveCount(0);
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
    await expect(page.locator(".closing-actions .brutal-button")).toHaveCount(2);
    await expect(page.locator(".placeholder-note")).toHaveCount(0);
  });

  test("uses the poster instead of mounting video when motion is reduced", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openProfile(page);

    const heroMedia = page.locator("#hero .hero-media");
    await expect(page.locator("#hero")).toHaveClass(
      /hero-scroll-container--static/,
    );
    await expect(heroMedia.locator("video")).toHaveCount(0);
    const poster = heroMedia.locator("img.hero-media__asset");
    await expect(poster).toHaveAttribute(
      "src",
      publicPath("hero-poster.webp"),
    );
    await expect(poster).toBeVisible();
    await expect
      .poll(() =>
        poster.evaluate(
          (element) =>
            (element as HTMLImageElement).complete &&
            (element as HTMLImageElement).naturalWidth > 0,
        ),
      )
      .toBe(true);
  });

  test("has no serious or critical axe violations", async ({ page }) => {
    await openProfile(page);
    await expect
      .poll(() =>
        page
          .locator(".interest-panel")
          .evaluate((element) => Number(getComputedStyle(element).opacity)),
      )
      .toBe(1);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blockingViolations = results.violations.filter(
      ({ impact }) => impact === "serious" || impact === "critical",
    );

    expect(
      blockingViolations,
      blockingViolations
        .map(
          ({ id, impact, nodes }) =>
            `${impact}: ${id} (${nodes.length} affected node(s))`,
        )
        .join("\n"),
    ).toEqual([]);
  });
});
