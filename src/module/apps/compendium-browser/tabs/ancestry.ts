import { sluggify } from "@util";
import { CompendiumBrowser } from "..";
import { CompendiumBrowserTab } from "./base";
import { AncestryFilters, CompendiumBrowserIndexData } from "./data";

export class CompendiumBrowserAncestryTab extends CompendiumBrowserTab {
    override filterData!: AncestryFilters;
    override templatePath = "systems/pf2e/templates/compendium-browser/partials/ancestry.html";
    /* MiniSearch */
    override searchFields = ["name"];
    override storeFields = ["type", "name", "img", "uuid", "source"];

    protected index = ["img", "system.source.value"];

    constructor(browser: CompendiumBrowser) {
        super(browser, "ancestry");

        // Set the filterData object of this tab
        this.prepareFilterData();
    }

    protected override async loadData() {
        console.debug("PF2e System | Compendium Browser | Started loading actions");

        const ancestries: CompendiumBrowserIndexData[] = [];
        const indexFields = ["img", "system.source.value"];
        const sources: Set<string> = new Set();

        for await (const { pack, index } of this.browser.packLoader.loadPacks(
            "Item",
            this.browser.loadedPacks("ancestry"),
            indexFields
        )) {
            console.debug(`PF2e System | Compendium Browser | ${pack.metadata.label} - Loading`);
            for (const ancestry of index) {
                console.log(ancestry);
                if (ancestry.type === "ancestry") {
                    if (!this.hasAllIndexFields(ancestry, indexFields)) {
                        console.warn(
                            `Ancestry '${ancestry.name}' does not have all required data fields. Consider unselecting pack '${pack.metadata.label}' in the compendium browser settings.`
                        );
                        continue;
                    }

                    // Prepare source
                    const source = ancestry.system.source.value;
                    if (source) {
                        sources.add(source);
                        ancestry.system.source.value = sluggify(source);
                    }
                    ancestries.push({
                        type: ancestry.type,
                        name: ancestry.name,
                        img: ancestry.img,
                        uuid: `Compendium.${pack.collection}.${ancestry._id}`,
                        source: ancestry.system.source.value,
                    });
                }
            }
        }

        // Set indexData
        this.indexData = ancestries;

        // Set Filters
        this.filterData.checkboxes.source.options = this.generateSourceCheckboxOptions(sources);

        console.debug("PF2e System | Compendium Browser | Finished loading ancestries");
    }

    protected override filterIndexData(entry: CompendiumBrowserIndexData): boolean {
        const { checkboxes } = this.filterData;

        // Source
        if (checkboxes.source.selected.length) {
            if (!checkboxes.source.selected.includes(entry.source)) return false;
        }
        return true;
    }

    protected override prepareFilterData(): void {
        this.filterData = {
            checkboxes: {
                source: {
                    isExpanded: false,
                    label: "PF2E.BrowserFilterSource",
                    options: {},
                    selected: [],
                },
            },
            order: {
                by: "name",
                direction: "asc",
                options: {
                    name: "PF2E.BrowserSortyByNameLabel",
                },
            },
            search: {
                text: "",
            },
        };
    }
}
