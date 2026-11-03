import AxeBuilder from "@axe-core/playwright";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

function normalizeSiteBasePath(value: string | undefined) {
  const path = value?.trim().replace(/^\/+|\/+$/g, "") ?? "";
  return path ? `/${path}/` : "/";
}

const siteBasePath = normalizeSiteBasePath(process.env.SITE_BASE_PATH);

const GAMES = {
  "Harry Potter Board Game": "https://ashwin.top/harry-potter/",
  "3D Pool Game": "https://ashwin.top/pool-game/",
};

/** Collects uncaught errors; the 3D scene is allowed to fall back, but nothing may throw. */
function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

async function open(page: Page, query = "?static") {
  await page.goto(`./${query}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: "Ashwin Sheoran" })).toBeVisible();
}

test.describe("content and navigation", () => {
  test("renders every section with its key facts", async ({ page }) => {
    const errors = trackErrors(page);
    await open(page);
    for (const id of ["home", "about", "experience", "projects", "contact"]) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
    for (const text of [
      "I started with code.",
      "Fielding at cover",
      "22 months",
      "Junior Executive Member",
      "Ranked 1st, then Teaching Assistant",
      "The current version is stable.",
      "No grand conclusion.",
    ]) {
      await expect(page.getByText(text, { exact: false }).first()).toBeAttached();
    }
    expect(errors).toEqual([]);
  });

  test("play buttons, CV and LinkedIn point to the right places", async ({ page, request }) => {
    await open(page);
    for (const [name, url] of Object.entries(GAMES)) {
      await expect(page.getByRole("link", { name: new RegExp(`PLAY GAME.*${name}`) })).toHaveAttribute("href", url);
    }
    await expect(page.getByRole("link", { name: /^LinkedIn/ })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/ashwin-sheoran/",
    );
    const cv = page.getByRole("link", { name: /View traditional CV/ });
    const cvHref = await cv.getAttribute("href");
    expect(cvHref).toBe(`${siteBasePath}Ashwin-Sheoran-CV.pdf`);
    const response = await request.get(cvHref!);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("pdf");
  });

  test("never claims the game paths or adds a catch-all", async () => {
    // The games are separate GitHub Pages projects under the same domain. The build
    // must not ship anything at their paths, nor a 404.html that would catch them.
    for (const path of ["harry-potter", "pool-game", "404.html"]) {
      expect(existsSync(resolve(process.cwd(), "dist", path))).toBe(false);
    }
  });
});

test.describe("desktop", () => {
  test.skip(({ isMobile }) => Boolean(isMobile), "Desktop navigation");

  test("navigation scrolls to sections and the projects menu lists the games", async ({ page }) => {
    await open(page);
    const nav = page.getByRole("navigation", { name: "Main" });
    await nav.getByRole("link", { name: "EXPERIENCE", exact: true }).click();
    await expect(page.locator("#experience")).toBeInViewport({ ratio: 0.1 });
    await expect(nav.getByRole("link", { name: "EXPERIENCE", exact: true })).toHaveAttribute("aria-current", "location");

    await nav.getByRole("button", { name: "Show projects" }).click();
    const menu = page.locator(".site-nav .project-menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByText("Games")).toBeVisible();
    for (const [name, url] of Object.entries(GAMES)) {
      await expect(menu.getByRole("link", { name: new RegExp(`^Play.*${name}`) })).toHaveAttribute("href", url);
    }
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });

  test("has no serious accessibility violations", async ({ page }) => {
    await open(page);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});

test.describe("mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "Mobile layout");

  test("menu sheet works and nothing overflows horizontally", async ({ page }) => {
    await open(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.getByRole("button", { name: "Menu" }).click();
    const sheet = page.locator(".menu-sheet");
    await expect(sheet).toBeVisible();
    await sheet.getByRole("link", { name: /PROJECTS/ }).click();
    await expect(sheet).toBeHidden();
    await expect(page.locator("#projects")).toBeInViewport({ ratio: 0.05 });
  });
});

test.describe("rendering modes", () => {
  test("static fallback shows still frames of the stadium", async ({ page }) => {
    await open(page, "?static");
    await expect(page.locator("html")).toHaveAttribute("data-renderer", "static");
    await expect(page.locator(".static-stage")).toBeAttached();
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("reduced motion is respected", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page);
    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  });

  test("the 3D stadium mounts when WebGL is available", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Headless WebKit has no reliable WebGL 2 on CI");
    test.slow();
    const errors = trackErrors(page);
    await open(page, "?quality=low");
    const renderer = await page.locator("html").getAttribute("data-renderer");
    if (renderer === "webgl") {
      await expect(page.locator(".stage canvas")).toBeAttached({ timeout: 60_000 });
    } else {
      await expect(page.locator(".static-stage")).toBeAttached();
    }
    // Content stays usable regardless of how the scene is doing.
    await expect(page.getByRole("link", { name: /PLAY GAME.*3D Pool Game/ })).toBeAttached();
    expect(errors.filter((error) => !/WebGL|GPU|context/i.test(error))).toEqual([]);
  });
});
