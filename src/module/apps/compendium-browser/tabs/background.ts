import { sluggify } from "@util";
import { CompendiumBrowser } from "..";
import { CompendiumBrowserTab } from "./base";
import { BackgroundFilters, CompendiumBrowserIndexData } from "./data";

export class CompendiumBrowserBackgroundTab extends CompendiumBrowserTab {
    override filterData!: BackgroundFilters;
    override templatePath = "systems/pf2e/templates/compendium-browser/partials/background.html";
    /* MiniSearch */
    override searchFields = ["name"];
    override storeFields = ["type", "name", "img", "uuid", "source"];

    protected index = ["img", "system.source.value"];

    constructor(browser: CompendiumBrowser) {
        super(browser, "background");

        // Set the filterData object of this tab
        this.prepareFilterData();
    }

    protected override async loadData() {
        console.debug("PF2e System | Compendium Browser | Started loading actions");

        const backgrounds: CompendiumBrowserIndexData[] = [];
        const indexFields = ["img", "system.source.value"];
        const sources: Set<string> = new Set();

        for await (const { pack, index } of this.browser.packLoader.loadPacks(
            "Item",
            this.browser.loadedPacks("background"),
            indexFields
        )) {
            console.debug(`PF2e System | Compendium Browser | ${pack.metadata.label} - Loading`);
            for (const background of index) {
                console.log(background);
                if (background.type === "background") {
                    if (!this.hasAllIndexFields(background, indexFields)) {
                        console.warn(
                            `Background '${background.name}' does not have all required data fields. Consider unselecting pack '${pack.metadata.label}' in the compendium browser settings.`
                        );
                        continue;
                    }

                    // Prepare source
                    const source = background.system.source.value;
                    if (source) {
                        sources.add(source);
                        background.system.source.value = sluggify(source);
                    }
                    backgrounds.push({
                        type: background.type,
                        name: background.name,
                        img: background.img,
                        uuid: `Compendium.${pack.collection}.${background._id}`,
                        source: background.system.source.value,
                    });
                }
            }
        }

        // Set indexData
        this.indexData = backgrounds;

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
