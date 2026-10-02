import type { PawnTypeId } from "../../catalog/pieces";
import type { SkillButtonView } from "../../skills/skills";
import { portraitSvg } from "../art/portrait";
import { requireElement } from "./require-element";

export interface SkillBar {
  /** Shows one button per skill, in the order given; hotkeys follow the views. */
  show(buttons: readonly SkillButtonView[]): void;
  hide(): void;
}

interface ButtonParts {
  readonly button: HTMLButtonElement;
  readonly status: HTMLElement;
  readonly recharge: HTMLElement;
}

/**
 * The skill buttons under the board, with hotkeys 1–9. It reports which skill
 * the player asked for; the entrypoint decides when it fires and passes the
 * new state back to `show`.
 */
export function createSkillBar(
  root: Document,
  onUse: (type: PawnTypeId) => void,
): SkillBar {
  const bar = requireElement(root, "skills", HTMLElement);
  let shownTypes = "";
  let parts = new Map<PawnTypeId, ButtonParts>();
  let hotkeys = new Map<string, PawnTypeId>();

  bar.addEventListener("click", (event) => {
    const button =
      event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>("button[data-type]")
        : null;
    if (button === null || button.disabled) return;
    onUse(button.dataset.type as PawnTypeId);
  });

  root.addEventListener("keydown", (event) => {
    if (bar.hidden || event.repeat) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const type = hotkeys.get(event.key);
    if (type === undefined) return;
    event.preventDefault();
    onUse(type);
  });

  const build = (buttons: readonly SkillButtonView[]): void => {
    parts = new Map();
    hotkeys = new Map();
    bar.replaceChildren(
      ...buttons.map((view) => {
        const button = root.createElement("button");
        button.type = "button";
        button.className = "skill";
        button.dataset.type = view.type;
        button.title = `${view.skillName}: ${view.text}`;

        const icon = root.createElement("span");
        icon.className = "skill-icon";
        // Built by the art module from fixed drawings; the label is escaped there.
        icon.innerHTML = portraitSvg(view.type, view.typeName);

        const name = root.createElement("span");
        name.className = "skill-name";
        name.textContent = view.skillName;
        const status = root.createElement("span");
        status.className = "skill-status";
        const words = root.createElement("span");
        words.className = "skill-words";
        words.append(name, status);

        const recharge = root.createElement("span");
        recharge.className = "skill-recharge";
        button.append(icon, words, recharge);

        if (view.hotkey !== undefined) {
          const key = String(view.hotkey);
          const hotkey = root.createElement("kbd");
          hotkey.className = "skill-hotkey";
          hotkey.textContent = key;
          button.append(hotkey);
          button.setAttribute("aria-keyshortcuts", key);
          hotkeys.set(key, view.type);
        }
        parts.set(view.type, { button, status, recharge });
        return button;
      }),
    );
  };

  const update = (view: SkillButtonView): void => {
    const part = parts.get(view.type);
    if (part === undefined) return;
    const status =
      view.state === "cooldown"
        ? `${view.realSecondsLeft.toFixed(1)}s`
        : view.state === "queued"
          ? "Next step"
          : view.typeName;
    if (part.status.textContent !== status) part.status.textContent = status;
    if (part.button.dataset.state !== view.state) {
      part.button.dataset.state = view.state;
      part.button.disabled = view.state !== "ready";
    }
    part.recharge.style.transform = `scaleX(${String(view.recharged)})`;
  };

  return {
    show: (buttons) => {
      const types = buttons.map((view) => view.type).join(",");
      if (types !== shownTypes) {
        shownTypes = types;
        build(buttons);
      }
      for (const view of buttons) update(view);
      bar.hidden = false;
    },
    hide: () => {
      bar.hidden = true;
    },
  };
}
