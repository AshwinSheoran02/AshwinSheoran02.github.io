import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";
import {
  contact,
  interests,
  journey,
  knownIssues,
  projects,
  sideQuests,
  strengths,
} from "./data/profile";
import { fieldPositions } from "./data/field";
import { captionFor, oversFor, stationOrder } from "./data/stations";
import { ui } from "./lib/store";

function renderApp() {
  ui.set({ sideQuest: null, renderMode: "pending", sceneReady: false, introDone: false });
  return render(<App />);
}

describe("ashwin.top", () => {
  it("introduces Ashwin with the hero facts", () => {
    renderApp();
    expect(screen.getByRole("heading", { level: 1, name: "Ashwin Sheoran" })).toBeInTheDocument();
    for (const text of ["IIIT Delhi", "NAB", "XLRI Delhi-NCR", "Ex-software engineer."]) {
      expect(screen.getAllByText(text).length).toBeGreaterThan(0);
    }
  });

  it("falls back to still frames of the stadium when WebGL is unavailable", () => {
    renderApp();
    expect(document.documentElement.dataset.renderer).toBe("static");
    expect(document.querySelector(".static-stage")).not.toBeNull();
    expect(document.querySelector("canvas")).toBeNull();
  });

  it("has the global navigation in tour order", () => {
    renderApp();
    const nav = screen.getByRole("navigation", { name: "Main" });
    const links = within(nav)
      .getAllByRole("link")
      .filter((link) => ["HOME", "ABOUT", "EXPERIENCE", "PROJECTS", "CONTACT"].includes(link.textContent ?? ""));
    expect(links.map((link) => link.textContent)).toEqual(["HOME", "ABOUT", "EXPERIENCE", "PROJECTS", "CONTACT"]);
    for (const link of links) {
      const target = link.getAttribute("href")!.slice(1);
      expect(document.getElementById(target)).not.toBeNull();
    }
  });

  it("lists every project in the projects menu, grouped by kind, with exact play links", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "Show projects" }));
    const menu = document.querySelector<HTMLElement>(".site-nav .project-menu")!;
    expect(menu.hidden).toBe(false);
    expect(within(menu).getByText("Games")).toBeInTheDocument();
    // There are no apps yet, so the group is not rendered at all.
    expect(within(menu).queryByText("Apps")).toBeNull();
    for (const project of projects) {
      expect(within(menu).getByRole("link", { name: new RegExp(`^Play.*${project.navLabel}`) })).toHaveAttribute(
        "href",
        project.url,
      );
    }
    fireEvent.keyDown(window, { key: "Escape" });
    expect(menu.hidden).toBe(true);
  });

  it("links each exhibit's play button to the exact game URL", () => {
    renderApp();
    expect(screen.getByRole("link", { name: /PLAY GAME.*Harry Potter Board Game/ })).toHaveAttribute(
      "href",
      "https://ashwin.top/harry-potter/",
    );
    expect(screen.getByRole("link", { name: /PLAY GAME.*3D Pool Game/ })).toHaveAttribute(
      "href",
      "https://ashwin.top/pool-game/",
    );
  });

  it("keeps the CV and LinkedIn links", () => {
    renderApp();
    expect(screen.getByRole("link", { name: /View traditional CV/ })).toHaveAttribute("href", contact.cvHref);
    expect(screen.getByRole("link", { name: /^LinkedIn/ })).toHaveAttribute("href", contact.linkedInHref);
  });

  it("preserves the journey, side quests, strengths and known issues", () => {
    renderApp();
    for (const entry of journey.entries) {
      expect(screen.getByText(entry.detail)).toBeInTheDocument();
    }
    expect(screen.getByText("Associate · 22 months")).toBeInTheDocument();
    for (const quest of sideQuests.entries) {
      expect(screen.getByText(quest.description)).toBeInTheDocument();
    }
    for (const item of strengths.items) {
      expect(screen.getByRole("meter", { name: item.meterLabel })).toHaveAttribute("aria-valuenow", String(item.value));
    }
    for (const issue of knownIssues.items) {
      expect(screen.getByText(issue.currentPatch)).toBeInTheDocument();
    }
  });

  it("gives every interest its own scroll stop and fielding position, with nothing hidden behind a click", () => {
    renderApp();
    for (const item of interests.items) {
      const station = document.querySelector<HTMLElement>(`[data-station="interest:${item.id}"]`)!;
      expect(station).not.toBeNull();
      expect(within(station).getByRole("heading", { level: 3, name: item.label })).toBeInTheDocument();
      expect(station).toHaveTextContent(`Fielding at ${fieldPositions[item.id].toLowerCase()}`);
      for (const paragraph of item.body) expect(within(station).getByText(paragraph)).toBeInTheDocument();
    }
    expect(screen.getByText("Equity markets. No F&O heroics.")).toBeInTheDocument();
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
  });

  it("counts the tour in overs, one station a ball", () => {
    expect(oversFor("home")).toBe("0.1");
    expect(oversFor(stationOrder[5])).toBe("0.6");
    expect(oversFor(stationOrder[6])).toBe("1.1");
    expect(captionFor("known-issues")).toBe("Third umpire review");
    expect(captionFor("project:pool-game")).toBe("Now showing");
  });

  it("answers the button that says not to click it", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "DO NOT CLICK" }));
    expect(screen.getByText("You clicked it. Curiosity confirmed.")).toBeInTheDocument();
  });

  it("responds to the known-issue controls", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "Do not ask for ETA" }));
    expect(screen.getByText("ETA removed from roadmap.")).toBeInTheDocument();
  });

  it("shows the cricket scorecard when CRICKET is typed", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.keyboard("CRICKET");
    expect(screen.getByRole("status", { name: "Cricket scorecard easter egg" })).toBeInTheDocument();
    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(screen.queryByRole("status", { name: "Cricket scorecard easter egg" })).toBeNull();
  });

  it("binds one DOM element to every camera station, in order", () => {
    renderApp();
    const ids = Array.from(document.querySelectorAll<HTMLElement>("[data-station]")).map(
      (element) => element.dataset.station,
    );
    expect(ids).toEqual(stationOrder);
  });

  it("opens and closes the mobile menu", async () => {
    const user = userEvent.setup();
    renderApp();
    const toggle = screen.getByRole("button", { name: "Menu" });
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(document.documentElement).toHaveClass("menu-open");
    await user.keyboard("{Escape}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
