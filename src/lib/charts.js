// Options Plot partagées : rendues en SVG au build (V1-V3, via PlotFigure) ou chez le lecteur (V4).
import * as Plot from "@observablehq/plot";
import { mean, range } from "d3-array";

// Palette de DONNÉES (distincte de la palette de charte, cf. global.css)
export const DATA = { nuit: "#0B2A4A", glacier: "#1F6FB2", futur: "#4F93C9", bande: "#E8EEF4", texte: "#334155" };
const base = { style: { background: "transparent", color: DATA.texte, fontSize: "13px" }, marginTop: 30, width: 760 };
const REPERES = ["MOUTHE", "PONTARLIER", "LES FOURGS", "BESANCON", "BAUME-LES-DAMES"];

export const lisser = (serie, demi = 5) => serie.map(d => {
    const v = serie.filter(e => Math.abs(e.hiver - d.hiver) <= demi);
    return { ...d, lisse: v.length >= 5 ? mean(v, e => e.jours) : null };
});
export const moyPeriode = (pairs, a, b) => mean(pairs.filter(([h]) => h >= a && h <= b), ([, j]) => j);

export const v1 = (cm, note, ariaLabel) => ({
    ...base, ariaLabel,
    x: { label: "Neige fraîche cumulée sur le mois (cm) →" },
    y: { label: "↑ Nombre de mois d'hiver", grid: true },
    marks: [
        Plot.rectY(cm, Plot.binX({ y: "count" }, { x: Plot.identity, thresholds: range(0, 280, 10), fill: DATA.glacier })),
        Plot.ruleY([0]),
        Plot.text([note], { frameAnchor: "top-right", dy: 8, dx: -8, textAnchor: "end" }),
    ]
});

export const v2 = (stations, doubs, ariaLabel) => ({
    ...base, width: 560, ariaLabel,
    projection: { type: "mercator", domain: doubs },
    color: { type: "quantize", n: 5, scheme: "blues", legend: true, label: "Neige fraîche moyenne (cm par mois d'hiver)" },
    marks: [
        Plot.geo(doubs, { fill: "#FFFFFF", stroke: "#94A3B8" }),
        Plot.dot(stations, {
            x: "lon", y: "lat", r: 7, fill: "moyenne", stroke: DATA.texte, strokeWidth: 0.7,
            title: d => `${d.nom} · ${d.alti} m\n${d.moyenne.toFixed(1)} cm/mois (${d.n} mois)`
        }),
        Plot.text(stations.filter(d => REPERES.includes(d.station)), { x: "lon", y: "lat", text: "nom", dy: -13, fontSize: 11 }),
    ]
});

export const v3 = (serie, ariaLabel) => {
    const m = lisser(serie.filter(d => d.source === "Mesuré")), p = lisser(serie.filter(d => d.source === "Projeté"));
    const ligne = (s, stroke, extra) => Plot.line(s.filter(d => d.lisse != null), { x: "hiver", y: "lisse", stroke, strokeWidth: 3, ...extra });
    const etiq = (x, y, t, fill) => Plot.text([{ x, y, t }], { x: "x", y: "y", text: "t", fill, fontWeight: "bold", fontSize: 13 });
    return {
        ...base, ariaLabel,
        x: { label: null, tickFormat: "d" }, y: { label: "↑ Jours de neige par hiver (déc.–fév.)", grid: true },
        marks: [
            Plot.rectX([{ x1: 2007, x2: 2024 }], { x1: "x1", x2: "x2", fill: DATA.bande }),
            Plot.text(["2007-2024 : mesure et modèle se recouvrent"], { frameAnchor: "bottom", x: 2015.5, dy: -6, fontSize: 11, fill: "#64748B" }),
            Plot.ruleY([0]),
            Plot.dot(m, { x: "hiver", y: "jours", r: 2.5, fill: DATA.nuit, fillOpacity: 0.35 }),
            Plot.dot(p, { x: "hiver", y: "jours", r: 2.5, fill: DATA.futur, fillOpacity: 0.35 }),
            ligne(m, DATA.nuit), ligne(p, DATA.futur, { strokeDasharray: "7,5" }),
            etiq(1962, 33, "Mesuré", DATA.nuit), etiq(2062, 29, "Projeté (scénario RCP 4.5)", DATA.futur),
        ]
    };
};

export const resume = s => {
    const a = moyPeriode(s.serie, 0, 1980), b = moyPeriode(s.serie, 2001, 3000), f = x => (x == null ? "—" : Math.round(x));
    return { titre: `Station de ${s.nom}, ${s.alti} m`, sous: `${f(a)} jours de neige par hiver en moyenne avant 1981, ${f(b)} depuis 2001.` };
};

export const v4 = (pairs, ariaLabel) => {
    const s = pairs.map(([hiver, jours]) => ({ hiver, jours })), l = lisser(s), moy = mean(s, d => d.jours);
    return {
        ...base, ariaLabel,
        x: { label: null, tickFormat: "d", domain: [1950, 2025] }, y: { label: "↑ Jours de neige par hiver", grid: true },
        marks: [
            Plot.ruleY([0]), Plot.ruleY([moy], { stroke: "#94A3B8", strokeDasharray: "4,4" }),
            Plot.dot(s, { x: "hiver", y: "jours", r: 3, fill: DATA.glacier, fillOpacity: 0.55 }),
            Plot.line(l.filter(d => d.lisse != null), { x: "hiver", y: "lisse", stroke: DATA.nuit, strokeWidth: 3 }),
            Plot.text([`Moyenne de la station : ${moy.toFixed(0)} j`], { frameAnchor: "top-left", dx: 8, dy: 8, fill: "#64748B", fontSize: 11 }),
        ]
    };
};