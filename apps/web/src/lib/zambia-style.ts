/** Top-down Zambia style. Roads are drawn by class so a main road reads differently from an alley. */

function width(pairs: number[]) {
  return ["interpolate", ["linear"], ["zoom"], ...pairs];
}

const roads: {
  id: string;
  classes: string[];
  color: string;
  casing: string;
  line: number[];
  outline: number[];
}[] = [
  {
    id: "service",
    classes: ["service"],
    color: "#f4efe6",
    casing: "#cfc3b2",
    line: [14, 0.6, 16, 2.2, 18, 4],
    outline: [14, 1.4, 16, 3.6, 18, 6],
  },
  {
    id: "residential",
    classes: ["residential", "other"],
    color: "#ffffff",
    casing: "#b7a894",
    line: [13, 0.8, 15, 3.2, 17, 8, 18, 12],
    outline: [13, 1.8, 15, 5.2, 17, 11, 18, 16],
  },
  {
    id: "tertiary",
    classes: ["tertiary"],
    color: "#fffdf8",
    casing: "#a89880",
    line: [12, 0.8, 15, 3.6, 17, 9, 18, 13],
    outline: [12, 2, 15, 6, 17, 12.5, 18, 17],
  },
  {
    id: "secondary",
    classes: ["secondary"],
    color: "#ffe9a3",
    casing: "#c4a15a",
    line: [11, 1, 14, 3.4, 16, 8, 18, 14],
    outline: [11, 2.4, 14, 5.6, 16, 11.5, 18, 18],
  },
  {
    id: "major",
    classes: ["motorway", "trunk", "primary"],
    color: "#f5c542",
    casing: "#b8860b",
    line: [8, 0.7, 12, 2.6, 15, 6, 17, 11, 18, 16],
    outline: [8, 1.6, 12, 4.4, 15, 9, 17, 15, 18, 21],
  },
];

export function zambiaStyle() {
  const roadLayers = roads.flatMap((road) => {
    const filter = ["match", ["get", "class"], road.classes, true, false];
    return [
      {
        id: `road-${road.id}-case`,
        type: "line",
        source: "zambia",
        "source-layer": "transportation",
        filter,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": road.casing, "line-width": width(road.outline) },
      },
      {
        id: `road-${road.id}`,
        type: "line",
        source: "zambia",
        "source-layer": "transportation",
        filter,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": road.color, "line-width": width(road.line) },
      },
    ];
  });

  return {
    version: 8 as const,
    name: "Zana Zambia",
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: {
      zambia: {
        type: "vector" as const,
        tiles: ["/maps/tiles/{z}/{x}/{y}"],
        minzoom: 0,
        maxzoom: 15,
        attribution: "© OpenStreetMap",
      },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#e9e2d6" } },
      {
        id: "landuse",
        type: "fill",
        source: "zambia",
        "source-layer": "landuse",
        paint: {
          "fill-color": [
            "match",
            ["get", "class"],
            "residential",
            "#f3ecdf",
            "commercial",
            "#f0ddd4",
            "retail",
            "#f3d5cc",
            "industrial",
            "#e3e0da",
            "forest",
            "#b7d7a1",
            "wood",
            "#b7d7a1",
            "farmland",
            "#e3efb8",
            "grass",
            "#c9e6ad",
            "grassland",
            "#c9e6ad",
            "meadow",
            "#c9e6ad",
            "park",
            "#b5dd9a",
            "garden",
            "#c3e6a8",
            "pitch",
            "#b7d98a",
            "playground",
            "#c3e6a8",
            "recreation_ground",
            "#c3e6a8",
            "#dcecc4",
          ],
        },
      },
      {
        id: "water",
        type: "fill",
        source: "zambia",
        "source-layer": "water",
        paint: { "fill-color": "#7eb6d9" },
      },
      {
        id: "water-line",
        type: "line",
        source: "zambia",
        "source-layer": "water",
        paint: { "line-color": "#5f97b8", "line-width": 1.2 },
      },
      {
        id: "waterway",
        type: "line",
        source: "zambia",
        "source-layer": "waterway",
        paint: {
          "line-color": "#4f8eae",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            0.7,
            14,
            ["match", ["get", "class"], "river", 2.4, "canal", 2, 1.1],
            17,
            ["match", ["get", "class"], "river", 5, "canal", 3.5, 1.8],
          ],
        },
      },
      {
        id: "building-shade",
        type: "line",
        source: "zambia",
        "source-layer": "building",
        minzoom: 15,
        paint: {
          "line-color": "rgba(62, 44, 28, 0.28)",
          "line-width": width([15, 2, 17, 4, 18, 6]),
          "line-translate": [1.2, 1.5],
          "line-blur": 0.4,
        },
      },
      {
        id: "building",
        type: "fill",
        source: "zambia",
        "source-layer": "building",
        minzoom: 14,
        paint: { "fill-color": "#f6e4c8", "fill-outline-color": "#3a291c" },
      },
      {
        id: "building-line",
        type: "line",
        source: "zambia",
        "source-layer": "building",
        minzoom: 14,
        paint: {
          "line-color": "#3a291c",
          "line-width": width([14, 0.8, 16, 1.6, 18, 2.6]),
        },
      },
      ...roadLayers,
      {
        id: "path",
        type: "line",
        source: "zambia",
        "source-layer": "transportation",
        filter: ["==", ["get", "class"], "path"],
        paint: {
          "line-color": "#8d7d68",
          "line-width": width([14, 0.7, 17, 1.8]),
          "line-dasharray": [1.1, 1.3],
        },
      },
      {
        id: "road-name-major",
        type: "symbol",
        source: "zambia",
        "source-layer": "transportation_name",
        minzoom: 13,
        filter: ["match", ["get", "class"], ["motorway", "trunk", "primary", "secondary"], true, false],
        layout: {
          "symbol-placement": "line",
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Bold"],
          "text-size": 13,
          "text-padding": 2,
        },
        paint: {
          "text-color": "#3f2e12",
          "text-halo-color": "#fff6d8",
          "text-halo-width": 1.8,
        },
      },
      {
        id: "road-name",
        type: "symbol",
        source: "zambia",
        "source-layer": "transportation_name",
        minzoom: 15,
        filter: ["match", ["get", "class"], ["motorway", "trunk", "primary", "secondary"], false, true],
        layout: {
          "symbol-placement": "line",
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 12,
          "text-padding": 2,
        },
        paint: {
          "text-color": "#44403c",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.6,
        },
      },
      {
        id: "building-name",
        type: "symbol",
        source: "zambia",
        "source-layer": "building",
        minzoom: 15.6,
        filter: ["all", ["has", "name"], ["!=", ["get", "name"], ""]],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 15.6, 10, 17, 12, 18, 14],
          "text-max-width": 8,
          "text-padding": 2,
        },
        paint: {
          "text-color": "#3a291c",
          "text-halo-color": "#f8f1e6",
          "text-halo-width": 1.5,
        },
      },
      {
        id: "place-name",
        type: "symbol",
        source: "zambia",
        "source-layer": "place",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Bold"],
          "text-size": [
            "match",
            ["get", "class"],
            "city",
            20,
            "town",
            16,
            "suburb",
            14,
            "village",
            13,
            12,
          ],
          "text-padding": 4,
        },
        paint: {
          "text-color": "#1c1917",
          "text-halo-color": "#e9e2d6",
          "text-halo-width": 2,
        },
      },
    ],
  };
}
