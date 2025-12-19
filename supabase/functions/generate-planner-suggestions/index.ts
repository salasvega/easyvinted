import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Article {
  id: string;
  user_id: string;
  title: string;
  season: string;
  status: string;
  suggested_period?: string;
}

interface Lot {
  id: string;
  user_id: string;
  name: string;
  season?: string;
  status: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: articles, error: articlesError } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "ready");

    if (articlesError) throw articlesError;

    const { data: lots, error: lotsError } = await supabase
      .from("lots")
      .select("*")
      .eq("status", "ready");

    if (lotsError) throw lotsError;

    if ((!articles || articles.length === 0) && (!lots || lots.length === 0)) {
      return new Response(
        JSON.stringify({ message: "No articles or lots to analyze", processed: 0 }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const suggestions = [];
    const now = new Date();
    const currentMonth = now.getMonth();

    for (const article of articles as Article[]) {
      let targetMonth = currentMonth;
      let priority: "high" | "medium" | "low" = "medium";
      let reason = "";

      if (article.season === "spring") {
        targetMonth = 2;
        reason = "Articles de printemps - meilleure période de vente en mars-avril";
      } else if (article.season === "summer") {
        targetMonth = 4;
        reason = "Articles d'été - meilleure période de vente en mai-juin";
      } else if (article.season === "autumn") {
        targetMonth = 7;
        reason = "Articles d'automne - meilleure période de vente en août-septembre";
      } else if (article.season === "winter") {
        targetMonth = 9;
        reason = "Articles d'hiver - meilleure période de vente en octobre-novembre";
      } else if (article.season === "all-seasons") {
        targetMonth = currentMonth;
        reason = "Article toutes saisons - peut être publié maintenant";
      } else {
        targetMonth = currentMonth;
        reason = "Article sans saison définie - peut être publié maintenant";
      }

      const monthDiff = (targetMonth - currentMonth + 12) % 12;

      if (monthDiff === 0 || monthDiff === 1) {
        priority = "high";
        reason = `Période optimale maintenant ! ${reason}`;
      } else if (monthDiff <= 3) {
        priority = "medium";
      } else {
        priority = "low";
      }

      let suggestedDate: Date;
      const hasNoSeason = !article.season ||
                          article.season === "all-seasons" ||
                          article.season === "all_seasons" ||
                          article.season === "undefined" ||
                          article.season === "";

      if (hasNoSeason || monthDiff === 0) {
        suggestedDate = new Date(now);
        suggestedDate.setDate(suggestedDate.getDate() + Math.floor(Math.random() * 7) + 1);
      } else {
        suggestedDate = new Date(now.getFullYear(), targetMonth, 1);
        if (suggestedDate < now) {
          suggestedDate.setFullYear(suggestedDate.getFullYear() + 1);
        }
      }

      const { data: existingSuggestion } = await supabase
        .from("selling_suggestions")
        .select("id, status, priority, reason, suggested_date")
        .eq("article_id", article.id)
        .eq("status", "pending")
        .maybeSingle();

      if (existingSuggestion) {
        const { error: updateError } = await supabase
          .from("selling_suggestions")
          .update({
            suggested_date: suggestedDate.toISOString().split("T")[0],
            priority,
            reason,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSuggestion.id);

        if (updateError) throw updateError;
      } else {
        suggestions.push({
          article_id: article.id,
          user_id: article.user_id,
          suggested_date: suggestedDate.toISOString().split("T")[0],
          priority,
          reason,
          status: "pending",
        });
      }
    }

    for (const lot of (lots as Lot[]) || []) {
      let targetMonth = currentMonth;
      let priority: "high" | "medium" | "low" = "medium";
      let reason = "";

      if (lot.season === "spring") {
        targetMonth = 2;
        reason = "Lot de printemps - meilleure période de vente en mars-avril";
      } else if (lot.season === "summer") {
        targetMonth = 4;
        reason = "Lot d'été - meilleure période de vente en mai-juin";
      } else if (lot.season === "autumn") {
        targetMonth = 7;
        reason = "Lot d'automne - meilleure période de vente en août-septembre";
      } else if (lot.season === "winter") {
        targetMonth = 9;
        reason = "Lot d'hiver - meilleure période de vente en octobre-novembre";
      } else {
        targetMonth = currentMonth;
        reason = "Lot toutes saisons - peut être publié maintenant";
      }

      const monthDiff = (targetMonth - currentMonth + 12) % 12;

      if (monthDiff === 0 || monthDiff === 1) {
        priority = "high";
        reason = `Période optimale maintenant ! ${reason}`;
      } else if (monthDiff <= 3) {
        priority = "medium";
      } else {
        priority = "low";
      }

      let suggestedDate: Date;
      const hasNoSeason = !lot.season ||
                          lot.season === "all-seasons" ||
                          lot.season === "all_seasons" ||
                          lot.season === "undefined" ||
                          lot.season === "";

      if (hasNoSeason || monthDiff === 0) {
        suggestedDate = new Date(now);
        suggestedDate.setDate(suggestedDate.getDate() + Math.floor(Math.random() * 7) + 1);
      } else {
        suggestedDate = new Date(now.getFullYear(), targetMonth, 1);
        if (suggestedDate < now) {
          suggestedDate.setFullYear(suggestedDate.getFullYear() + 1);
        }
      }

      const { data: existingSuggestion } = await supabase
        .from("selling_suggestions")
        .select("id, status, priority, reason, suggested_date")
        .eq("lot_id", lot.id)
        .eq("status", "pending")
        .maybeSingle();

      if (existingSuggestion) {
        const { error: updateError } = await supabase
          .from("selling_suggestions")
          .update({
            suggested_date: suggestedDate.toISOString().split("T")[0],
            priority,
            reason,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSuggestion.id);

        if (updateError) throw updateError;
      } else {
        suggestions.push({
          lot_id: lot.id,
          user_id: lot.user_id,
          suggested_date: suggestedDate.toISOString().split("T")[0],
          priority,
          reason,
          status: "pending",
        });
      }
    }

    if (suggestions.length > 0) {
      const { error: insertError } = await supabase
        .from("selling_suggestions")
        .insert(suggestions);

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({
        message: "Suggestions generated successfully",
        created: suggestions.length,
        total_processed: (articles?.length || 0) + (lots?.length || 0),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-planner-suggestions:", error);
    return new Response(
      JSON.stringify({ error: `Erreur serveur: ${error.message}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});