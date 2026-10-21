// Données préfiltrées téléchargeables : /data/serie.json, /data/stations.json, etc.
import type { APIRoute, GetStaticPaths } from "astro";
const fichiers = import.meta.glob("../../assets/data/*.json", { eager: true, import: "default" });

export const getStaticPaths: GetStaticPaths = () =>
    Object.keys(fichiers).map((p) => ({ params: { name: p.split("/").pop()!.replace(".json", "") } }));

export const GET: APIRoute = ({ params }) =>
    new Response(JSON.stringify(fichiers[`../../assets/data/${params.name}.json`]), { headers: { "Content-Type": "application/json" } });