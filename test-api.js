import { Anthropic } from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const FicheSchema = z.object({
  titre: z.string(),
  points_cles: z.array(z.string()),
  exemple: z.string(),
});

async function runTests() {
  console.log("Modèle testé : claude-opus-5\n");

  let textOk = false;
  let structOk = false;
  let inputTokens = 0;
  let outputTokens = 0;

  // 1. Appel texte
  try {
    console.log("[1/2] Appel texte...");
    const resText = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: "Explique brièvement la résolution d'une équation du second degré.",
        },
      ],
    });

    console.log(`      stop_reason : ${resText.stop_reason}`);
    
    const textBlock = resText.content.find((c) => c.type === "text");
    if (textBlock && textBlock.text) {
      console.log(`      réponse : ${textBlock.text.slice(0, 120)}...`);
      console.log("      RÉSULTAT : OK\n");
      textOk = true;
    } else {
      console.log("      RÉSULTAT : ÉCHEC - Aucun texte renvoyé\n");
    }

    inputTokens += resText.usage?.input_tokens || 0;
    outputTokens += resText.usage?.output_tokens || 0;
  } catch (err) {
    console.log(`      RÉSULTAT : ÉCHEC - ${err.message}\n`);
  }

  // 2. Appel sortie structurée
  try {
    console.log("[2/2] Appel avec sortie structurée...");
    const jsonSchema = zodToJsonSchema(FicheSchema);
    delete jsonSchema.$schema; // Nettoyage de la clé $schema pour la compatibilité Anthropic

    const resStruct = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: "Génère une fiche de révision sur le discriminant Delta.",
        },
      ],
      tools: [
        {
          name: "fiche_revision",
          description: "Structure de la fiche de révision",
          input_schema: jsonSchema,
        },
      ],
      tool_choice: { type: "tool", name: "fiche_revision" },
    });

    const toolUse = resStruct.content.find((c) => c.type === "tool_use");
    if (toolUse && toolUse.input) {
      FicheSchema.parse(toolUse.input);
      console.log("      RÉSULTAT : OK\n");
      structOk = true;
    } else {
      console.log("      RÉSULTAT : ÉCHEC - Pas de réponse structurée reçue\n");
    }

    inputTokens += resStruct.usage?.input_tokens || 0;
    outputTokens += resStruct.usage?.output_tokens || 0;
  } catch (err) {
    console.log(`      RÉSULTAT : ÉCHEC - ${err.message}\n`);
  }

  // Bilan
  const totalCost = (inputTokens / 1000000) * 15 + (outputTokens / 1000000) * 75;

  console.log("----------------------------------------");
  console.log(`Appel texte        : ${textOk ? "OK" : "ÉCHEC"}`);
  console.log(`Sortie structurée  : ${structOk ? "OK" : "ÉCHEC"}`);
  console.log(`Tokens : ${inputTokens} en entrée, ${outputTokens} en sortie`);
  console.log(`Coût de ce test : environ ${totalCost.toFixed(4)} $`);
  console.log("----------------------------------------\n");

  if (!textOk || !structOk) {
    console.log("Un test a échoué – envoie ce qui s'affiche ci-dessus.");
  } else {
    console.log("Tous les tests ont réussi ! Tu peux lancer ton application.");
  }
}

runTests();