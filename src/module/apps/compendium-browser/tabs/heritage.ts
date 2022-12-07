import { sluggify } from "@util";
import { CompendiumBrowser } from "..";
import { CompendiumBrowserTab } from "./base";
import { HeritageFilters, CompendiumBrowserIndexData } from "./data";

export class CompendiumBrowserHeritageTab extends CompendiumBrowserTab {
    override filterData!: HeritageFilters;
    override templatePath = "systems/pf2e/templates/compendium-browser/partials/heritage.html";
    /* MiniSearch */
    override searchFields = ["name"];
    override storeFields = ["type", "name", "img", "uuid", "source"];

    protected index = ["img", "system.source.value"];

    constructor(browser: CompendiumBrowser) {
        super(browser, "heritage");

        // Set the filterData object of this tab
        this.prepareFilterData();
    }

    protected override async loadData() {
        console.debug("PF2e System | Compendium Browser | Started loading actions");

        const heritages: CompendiumBrowserIndexData[] = [];
        const indexFields = ["img", "system.source.value"];
        const sources: Set<string> = new Set();

        for await (const { pack, index } of this.browser.packLoader.loadPacks(
            "Item",
            this.browser.loadedPacks("heritage"),
            indexFields
        )) {
            console.debug(`PF2e System | Compendium Browser | ${pack.metadata.label} - Loading`);
            for (const heritage of index) {
                console.log(heritage);
                if (heritage.type === "heritage") {
                    if (!this.hasAllIndexFields(heritage, indexFields)) {
                        console.warn(
                            `Heritage '${heritage.name}' does not have all required data fields. Consider unselecting pack '${pack.metadata.label}' in the compendium browser settings.`
                        );
                        continue;
                    }

                    // Prepare source
                    const source = heritage.system.source.value;
                    if (source) {
                        sources.add(source);
                        heritage.system.source.value = sluggify(source);
                    }
                    heritages.push({
                        type: heritage.type,
                        name: heritage.name,
                        img: heritage.img,
                        uuid: `Compendium.${pack.collection}.${heritage._id}`,
                        source: heritage.system.source.value,
                    });
                }
            }
        }

        // Set indexData
        this.indexData = heritages;

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
