import { StrictArrayField } from "@system/schema-data-fields.ts";
import * as R from "remeda";
import type { StringField } from "types/foundry/common/data/fields.d.ts";
import { AELikeRuleElement, type AELikeChangeMode } from "../ae-like.ts";
import type { ModelPropsFromRESchema, RuleElementSchema } from "../data.ts";
import { ResolvableValueField, RuleElementPF2e } from "../index.ts";
import { CheckType } from "@system/check/types.ts";
import { CHECK_TYPES } from "@system/check/values.ts";
import { CheckAlteration } from "./alteration.ts";

/** Alter certain aspects of individual components of a check roll. */
class CheckAlterationRuleElement extends RuleElementPF2e<CheckAlterationSchema> {
    static override defineSchema(): CheckAlterationSchema {
        const fields = foundry.data.fields;

        return {
            ...super.defineSchema(),
            selectors: new StrictArrayField(
                new fields.StringField({
                    required: true,
                    nullable: false,
                    blank: false,
                    initial: undefined,
                }),
                {
                    required: true,
                    initial: undefined,
                    validate: (value) => {
                        if (Array.isArray(value) && value.length > 0) return true;
                        const failure = new foundry.data.validation.DataModelValidationFailure({
                            invalidValue: value,
                            message: "must have at least one",
                        });
                        throw new foundry.data.validation.DataModelValidationError(failure);
                    },
                },
            ),
            mode: new fields.StringField({
                required: true,
                choices: R.keys.strict(AELikeRuleElement.CHANGE_MODE_DEFAULT_PRIORITIES),
                initial: undefined,
            }),
            property: new fields.StringField({
                required: true,
                nullable: false,
                choices: ["type"],
            }),
            value: new ResolvableValueField({ required: true, nullable: true, initial: null }),
        };
    }

    override resolveValue(
        value: unknown,
        defaultValue: null,
        options: { resolvables: Record<string, unknown> },
    ): CheckAlterationValue | null;
    override resolveValue(
        value: unknown,
        defaultValue: null,
        options: { resolvables: Record<string, unknown> },
    ): number | string | null {
        const resolved = super.resolveValue(value, defaultValue, options);
        if (this.ignored || !(typeof resolved === "number" || typeof resolved === "string" || resolved === null)) {
            return null;
        }

        const checkTypes: Set<string> = CHECK_TYPES;
        const isValid = {
            "type": typeof resolved === "string" && checkTypes.has(resolved),
        };

        if (!isValid[this.property]) {
            const message = {
                "type": `value: must be a check type (resolved to ${resolved})`
            };
            this.failValidation(message[this.property]);
            return null;
        }

        return resolved;
    }

    override beforePrepareData(): void {
        if (this.ignored) return;

        const alteration = new CheckAlteration(this);
        for (const selector of this.selectors) {
            const synthetics = (this.actor.synthetics.checkAlterations[selector] ??= []);
            synthetics.push(alteration);
        }
    }
}

interface CheckAlterationRuleElement
    extends RuleElementPF2e<CheckAlterationSchema>,
        ModelPropsFromRESchema<CheckAlterationSchema> {}

type CheckAlterationProperty = "type";

type CheckAlterationSchema = RuleElementSchema & {
    selectors: StrictArrayField<StringField<string, string, true, false, false>>;
    mode: StringField<AELikeChangeMode, AELikeChangeMode, true, false, false>;
    property: StringField<CheckAlterationProperty, CheckAlterationProperty, true, false, false>;
    value: ResolvableValueField<true, true, true>;
};

type CheckAlterationValue = CheckType | number;

export { CheckAlterationRuleElement };
export type { CheckAlterationProperty, CheckAlterationValue };
