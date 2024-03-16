import type { ActorPF2e } from "@actor";
import type { ItemPF2e } from "@item";
import { PredicatePF2e } from "@system/predication.ts";
import { setHasElement } from "@util";
import type { RuleValue } from "../data.ts";
import type { CheckAlterationProperty, CheckAlterationRuleElement, CheckAlterationValue } from "./rule-element.ts";
import { CheckRollDataPF2e } from "@system/check/roll.ts";
import { CHECK_TYPES } from "@system/check/values.ts";

class CheckAlteration {
    #rule: PartialRuleElement;

    slug: string | null;

    property: CheckAlterationProperty;

    value: RuleValue | null;

    constructor(rule: PartialRuleElement) {
        this.#rule = rule;
        this.slug = rule.slug;
        this.property = rule.property;
        this.value = rule.value;
    }

    getNewValue(
        _check: CheckRollDataPF2e,
        item: ItemPF2e | null,
    ): CheckAlterationValue | null {
        const rule = this.#rule;
        const resolvables: Record<string, unknown> = item
            ? { [item.type === "action" ? "ability" : item.type]: item }
            : {};
        const change = rule.resolveValue?.(rule.value, null, { resolvables }) ?? rule.value;
        if (rule.ignored) return null;

        if (rule.property === "type" && setHasElement(CHECK_TYPES, change)) {
            return change;
        }

        return null;
    }

    applyTo<TCheck extends CheckRollDataPF2e>(
        check: TCheck,
        options: { item: ItemPF2e<ActorPF2e>; test: string[] | Set<string> },
    ): TCheck {
        const rule = this.#rule;
        if (rule.ignored) return check;

        const parent = rule.parent ?? { getRollOptions: () => [] };
        const predicate = rule.predicate ?? new PredicatePF2e();
        const predicatePassed =
            predicate.length === 0 ||
            predicate.test([...options.test, ...parent.getRollOptions("parent")]);
        if (!predicatePassed) return check;

        const value = (this.value = this.getNewValue(check, options.item));

        if (typeof value === "string") {
            check.type = value;
        }

        return check;
    }
}

interface PartialRuleElement extends Pick<CheckAlterationRuleElement, "mode" | "property" | "slug" | "value"> {
    resolveValue?: CheckAlterationRuleElement["resolveValue"];
    ignored?: boolean;
    parent?: ItemPF2e<ActorPF2e>;
    predicate?: PredicatePF2e;
}

export { CheckAlteration };
