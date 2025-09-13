import { getTemplates } from "./templates";
import { pickBandit } from "./test-bandit";

export async function sendOutreachEmail(channel, score, lang = "en") {
  const { subject, cta } = getTemplates(lang);
  const { chosenSubject, chosenCTA } = pickBandit(lang, subject, cta);

  const email = {
    to: channel.email,
    from: "ideamlabs@gmail.com",
    subject: chosenSubject,
    body: `Hello ${channel.name},\n\nWe noticed your channel ${channel.title} could reach more viewers with captions.\n${chosenCTA} → https://autocaptionpro.com/checkout\n\nUnsubscribe anytime.`
  };

  console.log("Sending email:", email);
  return { status: "sent", email };
}