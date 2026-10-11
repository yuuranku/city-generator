(() => {
  // data/city-naming.json
  var city_naming_default = {
    courtyard: {
      plan: "axial",
      streets: [
        "\u69D0\u836B",
        "\u4E66\u9662",
        "\u6587\u5E99",
        "\u949F\u697C",
        "\u9F13\u697C",
        "\u6F15\u8FD0",
        "\u4E1C\u5E02",
        "\u897F\u5E02",
        "\u7EF8\u7F0E",
        "\u74F7\u7A91",
        "\u836F\u94FA",
        "\u5357\u4ED3",
        "\u67F3\u6865",
        "\u76D0\u884C",
        "\u4F1A\u9986",
        "\u724C\u697C",
        "\u7EC7\u574A",
        "\u9752\u77F3",
        "\u7AF9\u56ED",
        "\u6B66\u5E99"
      ],
      hall: "\u5E9C\u7F72",
      market: "\u5E02\u96C6",
      temple: "\u5E99\u9662"
    },
    "walled-compound": {
      plan: "axial",
      streets: [
        "\u5FA1\u9053",
        "\u627F\u5929",
        "\u793C\u574A",
        "\u53F8\u4ED3",
        "\u5B66\u5BAB",
        "\u6B66\u5E93",
        "\u592A\u5E73",
        "\u9752\u9F99",
        "\u6731\u96C0",
        "\u767D\u864E",
        "\u7384\u6B66",
        "\u6C38\u5B89",
        "\u4E1C\u4ED3",
        "\u6C34\u95E8",
        "\u7EC7\u9526",
        "\u77F3\u574A",
        "\u9A7F\u9986",
        "\u949F\u9F13",
        "\u901A\u8FDC",
        "\u66F2\u9662"
      ],
      hall: "\u5B98\u7F72",
      market: "\u4E1C\u5E02",
      temple: "\u7960\u5E99"
    },
    arcaded: {
      plan: "orthogonal",
      streets: [
        "\u67F1\u5ECA",
        "\u8BAE\u4F1A",
        "\u7ADE\u6280",
        "\u9676\u5DE5",
        "\u6A44\u6984",
        "\u6D74\u573A",
        "\u5267\u9662",
        "\u5B66\u56ED",
        "\u94DC\u5320",
        "\u51EF\u65CB",
        "\u516C\u4ED3",
        "\u795E\u6BBF",
        "\u6CC9\u6C34",
        "\u8461\u8404",
        "\u5546\u9986",
        "\u77F3\u96D5",
        "\u8C37\u7269",
        "\u67D3\u574A",
        "\u957F\u5ECA",
        "\u8239\u575E"
      ],
      hall: "\u8BAE\u653F\u5385",
      market: "\u5E02\u96C6",
      temple: "\u795E\u6BBF"
    },
    "timber-frame": {
      plan: "organic",
      streets: [
        "\u78E8\u574A",
        "\u6728\u5320",
        "\u6A61\u6811",
        "\u94C1\u5320",
        "\u7F8A\u6BDB",
        "\u9EA6\u82BD",
        "\u917F\u9152",
        "\u76AE\u5320",
        "\u9762\u5305",
        "\u949F\u5854",
        "\u4FEE\u9662",
        "\u9A6C\u53A9",
        "\u65E7\u96C6",
        "\u730E\u4EBA",
        "\u677E\u6797",
        "\u6E21\u53E3",
        "\u5317\u4ED3",
        "\u78E8\u77F3",
        "\u725B\u5E02",
        "\u5C0F\u6559\u5802"
      ],
      hall: "\u5E02\u653F\u5385",
      market: "\u96C6\u5E02",
      temple: "\u4FEE\u9662"
    },
    "stone-masonry": {
      plan: "organic",
      streets: [
        "\u77F3\u6865",
        "\u77F3\u5320",
        "\u94F6\u5320",
        "\u5546\u4F1A",
        "\u6559\u5802",
        "\u949F\u5854",
        "\u65E7\u6E2F",
        "\u57CE\u5821",
        "\u8461\u8404",
        "\u6CC9\u4E95",
        "\u8BAE\u4F1A",
        "\u82B1\u56ED",
        "\u67D3\u574A",
        "\u8C37\u5E02",
        "\u70DB\u574A",
        "\u9AD8\u53F0",
        "\u76D0\u4ED3",
        "\u780C\u77F3",
        "\u671D\u5723",
        "\u4FEE\u9053\u9662"
      ],
      hall: "\u5E02\u653F\u5385",
      market: "\u5E02\u96C6",
      temple: "\u5723\u5802"
    },
    terraced: {
      plan: "contour",
      streets: [
        "\u4E0A\u53F0",
        "\u4E0B\u53F0",
        "\u77F3\u9636",
        "\u89C2\u666F",
        "\u5C71\u6CC9",
        "\u5D16\u8FB9",
        "\u5761\u811A",
        "\u68AF\u7530",
        "\u6A35\u592B",
        "\u9AD8\u4ED3",
        "\u5C71\u95E8",
        "\u77AD\u671B",
        "\u77F3\u5F84",
        "\u8336\u56ED",
        "\u5CAD\u810A",
        "\u677E\u98CE",
        "\u671B\u6D77",
        "\u6CC9\u6865",
        "\u91C7\u77F3",
        "\u4E91\u53F0"
      ],
      hall: "\u8BAE\u4E8B\u5385",
      market: "\u5C71\u96C6",
      temple: "\u5C71\u5BFA"
    },
    "canal-side": {
      plan: "waterfront",
      streets: [
        "\u8239\u575E",
        "\u9C7C\u5E02",
        "\u5E06\u5320",
        "\u7F06\u7D22",
        "\u6C34\u95E8",
        "\u76D0\u4ED3",
        "\u6CCA\u8239",
        "\u6D77\u5173",
        "\u6845\u6746",
        "\u6E14\u7F51",
        "\u6EE8\u6CB3",
        "\u77F3\u5824",
        "\u6E21\u6865",
        "\u6CB3\u57E0",
        "\u65E7\u6E2F",
        "\u5357\u7801\u5934",
        "\u5E06\u5E03",
        "\u9020\u8239",
        "\u5546\u9986",
        "\u706F\u5854"
      ],
      hall: "\u5546\u8BAE\u5385",
      market: "\u9C7C\u5E02",
      temple: "\u6C34\u795E\u5E99"
    },
    "vernacular-mixed": {
      plan: "organic",
      streets: [
        "\u6986\u6811",
        "\u5320\u4EBA",
        "\u957F\u96C6",
        "\u5357\u4ED3",
        "\u65E7\u4E95",
        "\u67F3\u6865",
        "\u7EC7\u5DE5",
        "\u9676\u7A91",
        "\u94C1\u574A",
        "\u836F\u8349",
        "\u5BA2\u6808",
        "\u7CAE\u5E02",
        "\u9752\u77F3",
        "\u6CC9\u6C34",
        "\u4E1C\u56ED",
        "\u9A7F\u9986",
        "\u6728\u574A",
        "\u4E66\u820D",
        "\u76D0\u94FA",
        "\u65B0\u6865"
      ],
      hall: "\u8BAE\u4E8B\u5385",
      market: "\u5E02\u96C6",
      temple: "\u795E\u5E99"
    },
    nomadic: {
      plan: "camp",
      streets: [
        "\u7267\u573A",
        "\u9A7C\u94C3",
        "\u4E95\u6CC9",
        "\u96C6\u4F1A",
        "\u8349\u573A",
        "\u9A6C\u5E02",
        "\u7F8A\u5E02",
        "\u5546\u65C5",
        "\u5E10\u5EAD",
        "\u9A7F\u7AD9"
      ],
      hall: "\u8BAE\u4E8B\u5E10",
      market: "\u9A6C\u5E02",
      temple: "\u796D\u7940\u573A"
    }
  };

  // src/city-character-entry.js
  (() => {
    "use strict";
    const styles = {
      courtyard: { roof: ["#c4a08a", "#d1b39a", "#ba917c"], court: true, shrink: 0.12, temple: "cloister" },
      arcaded: { roof: ["#c9ac85", "#d8bf9b", "#bfa17e"], court: true, shrink: 0.1, temple: "colonnade" },
      "walled-compound": { roof: ["#aa9983", "#c5b598", "#b3a288"], court: true, shrink: 0.15, temple: "cloister" },
      "timber-frame": { roof: ["#9d8170", "#b49a83", "#c2a68c"], court: false, shrink: 0.24, temple: "longhouse" },
      "stone-masonry": { roof: ["#b9a48c", "#c9b99e", "#a69581"], court: false, shrink: 0.12, temple: "colonnade" },
      terraced: { roof: ["#c6a68c", "#d5b69b", "#b5947c"], court: false, shrink: 0.06, temple: "longhouse" },
      "canal-side": { roof: ["#b59880", "#c9ac91", "#a98973"], court: false, shrink: 0.08, temple: "longhouse" },
      "vernacular-mixed": { roof: ["#ba9a82", "#cab294", "#ae917c"], court: false, shrink: 0.17, temple: "cloister" },
      nomadic: { roof: ["#e4d7b7", "#d2c39e", "#c6b898"], court: false, shrink: 0.48, temple: "pavilion" }
    };
    const materials = {
      tile: { roof: ["#ad6450", "#bc7960", "#925948", "#c78a70", "#a46c57"], palace: ["#b66948", "#c48553", "#95553c"] },
      slate: { roof: ["#61777b", "#70878a", "#53676f", "#82918d", "#6b7377"], palace: ["#536b74", "#728b90", "#435e68"] },
      timber: { roof: ["#82745b", "#998367", "#6d6251", "#ab9372", "#8b7059"], palace: ["#756b53", "#998369", "#5e6251"] },
      lime: { roof: ["#d9c7a3", "#c9b78f", "#e4d4b7", "#baa98d", "#d0bea4"], palace: ["#c3a873", "#dec48c", "#ae9467"] },
      glazed: { roof: ["#5d7973", "#718d79", "#485f62", "#839684", "#60746b"], palace: ["#ad843b", "#c6a152", "#8e692f"] }
    };
    function materialProfile(recipe, style) {
      const latitude = Math.abs(recipe.siteContext?.latitudeDegrees || recipe.localSite?.latitudeDegrees || 0);
      const id = recipe.culture?.civilizationId || 0, variant = id % 3;
      const name = ["courtyard", "walled-compound"].includes(style) ? variant === 1 ? "glazed" : variant === 2 ? "tile" : "slate" : style === "arcaded" ? "lime" : style === "timber-frame" ? "timber" : style === "terraced" || latitude > 48 ? "slate" : style === "nomadic" ? "lime" : variant === 0 ? "tile" : variant === 1 ? "slate" : "timber";
      return { name, ...materials[name] };
    }
    function palaceDesign(recipe, style) {
      const id = (recipe.seed ^ (recipe.culture?.civilizationId || 0) * 2654435761) >>> 0;
      const rugged = ["ridge", "hillside", "coastal-slope", "valley"].includes(recipe.localSite?.form.kind);
      const family = rugged ? "terraced-court" : ["courtyard", "walled-compound"].includes(style) ? "axial-courts" : style === "arcaded" ? "peristyle" : style === "timber-frame" ? "hall-and-bailey" : style === "canal-side" ? "merchant-palazzo" : style === "stone-masonry" ? "castle-palace" : "garden-pavilions";
      return { family, variant: id % 3, aspect: family === "terraced-court" ? [1.25, 0.62] : family === "axial-courts" ? [0.93, 1.28] : family === "merchant-palazzo" ? [1.3, 0.76] : [1.28, 1], fortified: ["castle-palace", "hall-and-bailey"].includes(family) };
    }
    function profile(recipe) {
      const culture = recipe.culture || {}, population = recipe.population?.estimate || 0, type = recipe.siteType;
      const mobile = ["nomadic-camp", "khan-court"].includes(type) || culture.mobility === "nomadic" || culture.government === "nomadic-confederacy" && recipe.tier === "site" && !["port", "island-port", "lake-port", "river-city", "fortress", "pass"].includes(type);
      const military = ["fortress", "pass"].includes(type), maritime = ["port", "island-port", "lake-port"].includes(type) || recipe.harbor;
      const small = mobile || population < 5e3;
      const village = !mobile && !military && !maritime && (type === "village" || small);
      const style = mobile ? "nomadic" : culture.style || "vernacular-mixed";
      const kind = mobile ? "nomadic" : village ? "village" : type === "pass" ? "border-pass" : type === "fortress" ? "fortress" : ["port", "island-port"].includes(type) ? "seaport" : type === "lake-port" ? "lake-port" : recipe.harbor?.kind === "river" ? "river-port" : type === "river-city" ? "river-town" : type === "oasis" ? "oasis" : ["rolling", "steep", "escarpment"].includes(recipe.terrain?.slopeClass) ? "hill-town" : "market-town";
      const label = {
        nomadic: "\u6E38\u7267\u8425\u5730",
        village: "\u6751\u843D",
        "border-pass": "\u8FB9\u5173",
        fortress: "\u8981\u585E",
        seaport: "\u6D77\u6E2F\u57CE\u5E02",
        "lake-port": "\u6E56\u6E2F\u57CE\u5E02",
        "river-port": "\u5185\u6CB3\u6E2F\u53E3\u57CE\u5E02",
        "river-town": "\u6CB3\u5CB8\u57CE\u5E02",
        oasis: "\u7EFF\u6D32\u57CE\u5E02",
        "hill-town": "\u5C71\u5730\u57CE\u5E02",
        "market-town": "\u5546\u8D38\u57CE\u5E02"
      }[kind];
      const defensive = ["ancient", "medieval", "early-modern", "preindustrial"].includes(recipe.era) && (!small || military);
      const capital = culture.isCapital || (recipe.urban?.coreZones || []).some((c) => c.role === "government-core");
      const layers = defensive ? small ? 1 : capital || population > 15e3 || ["fortress", "border-pass"].includes(kind) ? 2 : 1 : 0;
      const barbicans = defensive && !small && recipe.era !== "ancient" && (capital || population > 8500 || ["fortress", "border-pass"].includes(kind));
      const tradition = city_naming_default[style];
      const namingTradition = recipe.naming?.culture === "han" ? city_naming_default.courtyard : tradition;
      const plan = small ? mobile ? "camp" : "village" : ["industrial", "contemporary"].includes(recipe.era) ? "orthogonal" : tradition.plan;
      const material = materialProfile(recipe, style);
      const settlementRadiusKm = small ? Math.min(recipe.urban?.radiusKm || 1, Math.max(military ? 0.11 : 0.06, Math.sqrt(population / 15e3 / Math.PI))) : null;
      return {
        ...styles[style],
        roof: material.roof,
        material,
        palace: palaceDesign(recipe, style),
        tradition,
        namingTradition,
        plan,
        capital,
        style,
        kind,
        label: small && kind === "seaport" ? "\u6E2F\u53E3\u6751\u843D" : small && ["lake-port", "river-port"].includes(kind) ? "\u6C34\u5CB8\u805A\u843D" : label,
        mobile,
        village,
        small,
        ...small ? { settlementRadiusKm } : {},
        defence: { layers, barbicans },
        prefix: Array.from(recipe.name || "\u5F53\u5730").slice(0, 3).join(""),
        buildingCount: Math.max(small ? 6 : 18, Math.min(6500, Math.round(population / (mobile ? 10 : small ? 6 : recipe.era === "contemporary" ? 26 : 11))))
      };
    }
    const rect = (x, y, w, h) => [[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]];
    const circle = (x, y, r) => Array.from({ length: 16 }, (_, i) => [x + Math.cos(i * Math.PI / 8) * r, y + Math.sin(i * Math.PI / 8) * r]);
    function template(kind, style, population = 0, design = { family: "axial-courts", variant: 0 }) {
      let parts = [];
      const add = (points, roof = "hip") => parts.push({ points, roof });
      if (["common-house", "village-shrine", "landing-store", "village-market"].includes(kind)) {
        add(rect(0, 0, kind === "village-shrine" ? 0.78 : 1.3, kind === "landing-store" ? 1.06 : 0.86), styles[style]?.temple === "pavilion" ? "dome" : "gable");
      } else if (kind === "royal-palace" || kind === "imperial-palace") {
        const { family, variant } = design, shift = (variant - 1) * 0.09, large = population >= 1e5;
        if (family === "axial-courts") {
          const halls = variant === 0 ? [-0.68, -0.12, 0.44] : variant === 1 ? [-0.61, 0.1] : [-0.7, -0.3, 0.29];
          halls.forEach((y, i) => add(rect(shift, y, i === 1 ? 1.1 : 0.9, 0.22)));
          for (const x of [-0.65, 0.65]) for (const y of [-0.46, 0.1, 0.56]) add(rect(x, y, 0.17, 0.35));
          add(rect(shift, 0.8, 0.45, 0.16), "gate");
          if (variant === 1) {
            add(rect(-0.3, -0.66, 0.27, 0.19));
            add(rect(0.3, -0.66, 0.27, 0.19));
          }
          if (large) for (const x of [-1.04, 1.04]) for (const y of [-0.68, -0.25, 0.23, 0.68]) add(rect(x, y, 0.31, 0.25));
        } else if (family === "merchant-palazzo") {
          add(rect(shift, -0.58, 1.7, 0.4), "hip");
          for (const x of [-0.81, 0.81]) add(rect(x, 0.02, 0.25, 0.79), "hip");
          add(rect(-0.44, 0.52, 0.66, 0.22), "gable");
          add(rect(0.46, 0.52, 0.65, 0.22), "gable");
          add(rect(0, 0.82, 0.48, 0.16), "gate");
          for (const x of [-0.66, -0.22, 0.22, 0.66]) add(rect(x, -0.87, 0.15, 0.18), "tower");
          if (variant === 1) add(rect(0, 0.08, 0.6, 0.18), "flat");
          if (large) for (const x of [-1.09, 1.09]) for (const y of [-0.64, -0.22, 0.2, 0.62]) add(rect(x, y, 0.24, 0.27));
        } else if (family === "peristyle") {
          add(rect(shift, -0.63, 1.65, 0.32), "gable");
          for (const x of [-0.83, 0.83]) add(rect(x, -0.03, 0.2, 0.88), "gable");
          for (const x of [-0.52, 0.52]) add(rect(x, 0.43, 0.45, 0.18), "flat");
          add(rect(shift, 0.82, 0.48, 0.18), "gate");
          if (variant === 1) add(rect(0, 0.23, 0.68, 0.19), "flat");
          if (variant === 2) add(circle(-0.46, -0.62, 0.18), "dome");
          if (large) for (const x of [-1.1, 1.1]) for (const y of [-0.7, -0.3, 0.12, 0.56]) add(rect(x, y, 0.22, 0.27));
        } else if (family === "hall-and-bailey") {
          add(rect(-0.15, -0.42, 1.24, 0.39), "gable");
          add(rect(0.59, -0.05, 0.23, 0.7), "gable");
          add(rect(-0.68, 0.31, 0.29, 0.6), "gable");
          add(rect(0.18, 0.45, 0.52, 0.24), "gable");
          for (const x of [-0.72, 0.63]) add(rect(x, -0.68, 0.22, 0.22), "tower");
          add(rect(0, 0.8, 0.39, 0.21), "gate");
          add(rect(-0.34, 0.1, 0.25, 0.22), "hip");
          if (variant === 2) add(rect(0.5, 0.56, 0.3, 0.22), "gable");
          if (large) for (const x of [-1.08, 1.03]) for (const y of [-0.66, -0.22, 0.2, 0.63]) add(rect(x, y, 0.25, 0.27), "gable");
        } else if (family === "castle-palace") {
          add(rect(-0.14, -0.42, 1.25, 0.36), "gable");
          add(rect(-0.68, 0.08, 0.28, 0.64), "gable");
          add(rect(0.53, -0.04, 0.23, 0.53), "gable");
          for (const [x, y] of [[-0.73, -0.61], [0.61, -0.58], [-0.77, 0.62], [0.67, 0.62]]) add(variant === 1 ? rect(x, y, 0.21, 0.21) : circle(x, y, 0.14), "tower");
          add(rect(-0.18, 0.81, 0.38, 0.2), "gate");
          add(rect(0.3, 0.46, 0.49, 0.22));
          if (large) for (const x of [-1.08, 1.03]) for (const y of [-0.66, -0.22, 0.2, 0.63]) add(rect(x, y, 0.25, 0.27), "gable");
        } else if (family === "terraced-court") {
          add(rect(shift, -0.36, 1.55, 0.28));
          for (const x of [-0.81, -0.3, 0.27, 0.8]) add(rect(x, 0.36, 0.28, 0.28));
          add(rect(-0.98, -0.23, 0.2, 0.58), "tower");
          add(rect(0.98, -0.21, 0.2, 0.62), "tower");
          add(rect(shift, 0.81, 0.42, 0.18), "gate");
          if (large) for (const x of [-1.09, -0.55, 0, 0.55, 1.09]) {
            add(rect(x, -0.77, 0.28, 0.2));
            add(rect(x, 0.65, 0.3, 0.16));
          }
        } else {
          add(rect(shift, -0.54, 1.05, 0.35));
          for (const [x, y] of [[-0.75, -0.18], [0.73, -0.05], [-0.68, 0.48], [0.64, 0.52]]) add(rect(x, y, 0.37, 0.26));
          add(rect(-0.29, 0.12, 0.36, 0.22));
          add(rect(0.23, 0.2, 0.33, 0.2));
          add(rect(0, 0.83, 0.38, 0.16), "gate");
          if (large) for (const x of [-1.1, 1.08]) for (const y of [-0.67, -0.19, 0.34, 0.73]) add(rect(x, y, 0.23, 0.21));
        }
      } else if (kind === "council-house") {
        add([[-0.65, -0.5], [0.4, -0.5], [0.72, -0.18], [0.72, 0.27], [0.4, 0.57], [-0.65, 0.57]], "dome");
        add(rect(0, -0.68, 1.34, 0.2), "flat");
      } else if (kind === "holy-tomb") {
        add(circle(0, -0.15, 0.43), "dome");
        add(rect(-0.59, 0.1, 0.24, 0.9));
        add(rect(0.59, 0.1, 0.24, 0.9));
        add(rect(0, 0.64, 1.35, 0.22));
      } else if (kind === "observatory-sanctuary") {
        add(circle(0, -0.13, 0.53), "tower");
        add(rect(0, 0.62, 1.3, 0.24));
        for (const x of [-0.64, 0.64]) add(rect(x, -0.1, 0.2, 0.95));
      } else if (["great-sanctuary", "pilgrimage-monastery", "water-sanctuary", "harbor-shrine"].includes(kind)) {
        add(rect(0, -0.53, 1.35, 0.32));
        for (const x of [-0.6, 0.6]) add(rect(x, 0, 0.23, 1.06));
        add(rect(-0.38, 0.62, 0.54, 0.2));
        add(rect(0.38, 0.62, 0.54, 0.2));
        if (kind === "great-sanctuary") add(circle(0, -0.52, 0.26), "dome");
        if (kind === "pilgrimage-monastery") for (const x of [-0.38, 0.38]) add(rect(x, -0.12, 0.24, 0.2));
        if (kind === "harbor-shrine") add(circle(0.55, -0.5, 0.16), "tower");
      } else if (kind === "sanctuary") {
        if (styles[style]?.temple === "colonnade") {
          add(rect(0, -0.12, 0.82, 1.03));
          for (const x of [-0.55, 0.55]) for (let i = 0; i < 5; i++) add(rect(x, -0.56 + i * 0.22, 0.09, 0.1), "flat");
          add(rect(0, 0.58, 1.28, 0.16), "flat");
        } else if (styles[style]?.temple === "longhouse") {
          add([[-0.25, -0.72], [0.25, -0.72], [0.25, 0.12], [0.52, 0.12], [0.52, 0.36], [0.25, 0.36], [0.25, 0.68], [-0.25, 0.68], [-0.25, 0.36], [-0.52, 0.36], [-0.52, 0.12], [-0.25, 0.12]]);
          add(rect(0, -0.66, 0.31, 0.31), "tower");
        } else if (style === "nomadic") add(circle(0, 0, 0.46), "dome");
        else {
          add(rect(0, -0.46, 1.26, 0.3));
          add(rect(-0.48, 0.05, 0.27, 0.8));
          add(rect(0.48, 0.05, 0.27, 0.8));
          add(rect(0, 0.48, 1.22, 0.24));
          add(circle(0, -0.44, 0.17), "dome");
        }
      } else if (kind === "caravanserai") {
        add(rect(0, -0.52, 1.5, 0.28), "flat");
        add(rect(-0.6, 0, 0.28, 1.06), "flat");
        add(rect(0.6, 0, 0.28, 1.06), "flat");
        add(rect(-0.4, 0.52, 0.48, 0.28), "flat");
        add(rect(0.4, 0.52, 0.48, 0.28), "flat");
      } else if (kind === "barracks") {
        for (const y of [-0.55, 0, 0.55]) add(rect(0, y, 1.36, 0.24));
      } else if (kind === "granary" || kind === "customs-house") {
        add(rect(-0.3, 0, 0.48, 1.2));
        add(rect(0.34, 0, 0.48, 1.2));
        add(rect(0, 0.57, 0.9, 0.15), "flat");
      } else if (kind === "lord-manor") {
        add(rect(0, -0.4, 1.35, 0.36));
        add(rect(-0.48, 0.08, 0.26, 0.68));
        add(rect(0.48, 0.08, 0.26, 0.68));
        add(rect(0.45, 0.55, 0.42, 0.22));
        add(rect(-0.48, -0.43, 0.3, 0.3), "tower");
      } else if (kind === "assembly-tent") add(circle(0, 0, 0.52), "dome");
      else if (kind === "town-hall") {
        add(rect(0, -0.25, 1.45, 0.39));
        add(rect(-0.53, 0.12, 0.25, 0.42));
        add(rect(0.53, 0.12, 0.25, 0.42));
        add(rect(0, -0.25, 0.23, 0.23), "tower");
      } else {
        add(rect(0, -0.28, 1.5, 0.36));
        for (let i = 0; i < 6; i++) add(rect((i - 2.5) * 0.23, 0.4, 0.16, 0.19), "flat");
      }
      return parts;
    }
    window.WorldAtlasCityCharacter = Object.freeze({ profile, template });
  })();
})();
