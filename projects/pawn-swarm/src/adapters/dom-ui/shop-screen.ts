import type { ShopAction } from "../../run/run";
import type { OfferView, ShopView } from "../../shop/shop-view";
import { portraitSvg } from "../art/portrait";
import { PAWN_TYPE_COLOURS } from "../art/type-colours";
import { requireElement } from "./require-element";

export interface ShopScreen {
  show(view: ShopView): void;
  hide(): void;
}

/** "♟" stands for plain pawns, the shop's money. */
const PAWNS = "♟";

/**
 * The shop between waves. It lays out what `describeShop` worked out and
 * reports each click as a `ShopAction`; the entrypoint applies it and calls `show` again.
 */
export function createShopScreen(
  root: Document,
  onAction: (action: ShopAction) => void,
): ShopScreen {
  const panel = requireElement(root, "shop", HTMLElement);
  const title = requireElement(root, "shop-title", HTMLElement);
  const purse = requireElement(root, "shop-purse", HTMLElement);
  const armyList = requireElement(root, "shop-army", HTMLElement);
  const nextWaveTitle = requireElement(
    root,
    "shop-next-wave-title",
    HTMLElement,
  );
  const nextWaveList = requireElement(root, "shop-next-wave", HTMLElement);
  const offers = requireElement(root, "shop-offers", HTMLElement);
  const rerollButton = requireElement(root, "shop-reroll", HTMLButtonElement);
  const startButton = requireElement(root, "shop-start", HTMLButtonElement);

  // One listener for every button, so re-rendering the offers needs no rewiring.
  panel.addEventListener("click", (event) => {
    const button =
      event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>("button[data-action]")
        : null;
    if (button === null || button.disabled) return;
    const offer = Number(button.dataset.offer);
    switch (button.dataset.action) {
      case "recruit":
        onAction({ type: "recruit", offer });
        break;
      case "lock":
        onAction({ type: "lock", offer });
        break;
      case "reroll":
        onAction({ type: "reroll" });
        break;
      case "start-wave":
        onAction({ type: "start-wave" });
        break;
    }
  });

  const element = <Tag extends keyof HTMLElementTagNameMap>(
    tag: Tag,
    className: string,
    text = "",
  ): HTMLElementTagNameMap[Tag] => {
    const created = root.createElement(tag);
    created.className = className;
    created.textContent = text;
    return created;
  };

  /** The portrait markup is built by the art module from fixed drawings; the label is escaped there. */
  const portrait = (
    className: string,
    id: Parameters<typeof portraitSvg>[0],
    label: string,
  ): HTMLElement => {
    const holder = element("span", className);
    holder.innerHTML = portraitSvg(id, label);
    return holder;
  };

  const offerElement = (offer: OfferView, index: number): HTMLElement => {
    const card = element("article", "offer");
    card.dataset.rarity = offer.rarity;
    if (offer.blocker === "max-this-wave") card.classList.add("offer-full");

    const name = element("h3", "offer-name", offer.name);
    name.style.color = PAWN_TYPE_COLOURS[offer.type];
    const recruited = element("p", "offer-count", "Recruited this wave ");
    recruited.append(
      element(
        "strong",
        "",
        `${String(offer.recruited)}/${String(offer.maxRecruits)}`,
      ),
    );

    const recruitButton = element(
      "button",
      "shop-button shop-button-main",
      offer.blocker === "max-this-wave"
        ? "Max this wave"
        : `Recruit 1 (${String(offer.plainPawnsUsed)} ${PAWNS})`,
    );
    recruitButton.type = "button";
    recruitButton.dataset.action = "recruit";
    recruitButton.dataset.offer = String(index);
    recruitButton.dataset.focusKey = `recruit-${String(index)}`;
    recruitButton.disabled = offer.blocker !== undefined;
    recruitButton.title = `Turns 1 plain pawn into a ${offer.name.toLowerCase()} and sacrifices ${String(offer.plainPawnsUsed - 1)} more.`;

    const lockButton = element(
      "button",
      "shop-button",
      offer.locked ? "Locked" : "Lock",
    );
    lockButton.type = "button";
    lockButton.dataset.action = "lock";
    lockButton.dataset.offer = String(index);
    lockButton.dataset.focusKey = `lock-${String(index)}`;
    lockButton.setAttribute("aria-pressed", String(offer.locked));
    lockButton.title = "Keep this offer for the next shop.";

    const buttons = element("div", "offer-buttons");
    buttons.append(recruitButton, lockButton);

    const skill = element("p", "offer-skill");
    skill.append(
      element(
        "strong",
        "",
        `${offer.skill.name} (${String(offer.skill.cooldown)}s)`,
      ),
      `: ${offer.skill.text}`,
    );

    card.append(
      portrait("offer-portrait", offer.type, offer.name),
      element("p", "offer-rarity", offer.rarity),
      name,
      element(
        "p",
        "offer-stats",
        `${String(offer.hp)} HP · ${String(offer.attack)} attack`,
      ),
      element("p", "offer-passive", offer.passive),
      skill,
      recruited,
    );
    if (offer.blocker === "too-few-plain-pawns") {
      card.append(
        element(
          "p",
          "offer-note",
          `Needs ${String(offer.plainPawnsUsed + 1)} plain pawns: you always keep one.`,
        ),
      );
    }
    card.append(buttons);
    return card;
  };

  return {
    show: (view) => {
      // Re-rendering replaces the buttons; put keyboard focus back where it was.
      const focusKey =
        root.activeElement instanceof HTMLElement
          ? root.activeElement.dataset.focusKey
          : undefined;

      title.textContent = `Wave ${String(view.wave - 1)} cleared`;
      purse.replaceChildren(
        "You have ",
        element("strong", "", String(view.plainPawns)),
        ` plain pawns to spend. Each recruit turns one into the pawn type and sacrifices more as the price. You always keep at least one.`,
      );

      armyList.replaceChildren(
        ...view.army.map(({ type, name, count }) => {
          const item = element("li", "chip");
          item.append(
            portrait("chip-icon", type, name),
            `${name} × ${String(count)}`,
          );
          return item;
        }),
      );

      nextWaveTitle.textContent = `Wave ${String(view.wave)}`;
      nextWaveList.replaceChildren(
        ...view.nextWave.map(({ kind, name, count }) => {
          const item = element("li", "chip chip-black");
          item.append(
            portrait("chip-icon", kind, name),
            `${String(count)} × ${name}`,
          );
          return item;
        }),
      );

      offers.replaceChildren(...view.offers.map(offerElement));

      rerollButton.textContent = `Reroll (${String(view.reroll.price)} ${PAWNS})`;
      rerollButton.disabled = view.reroll.blocker !== undefined;
      rerollButton.title =
        view.reroll.blocker === "all-locked"
          ? "Every offer is locked."
          : "Replace every unlocked offer. Dearer each time this visit.";
      startButton.textContent = `Start wave ${String(view.wave)}`;

      const wasHidden = panel.hidden;
      panel.hidden = false;
      const refocus =
        focusKey === undefined
          ? undefined
          : panel.querySelector<HTMLElement>(
              `[data-focus-key="${focusKey}"]:not(:disabled)`,
            );
      if (refocus !== undefined && refocus !== null) refocus.focus();
      else if (wasHidden) startButton.focus();
    },
    hide: () => {
      panel.hidden = true;
    },
  };
}
