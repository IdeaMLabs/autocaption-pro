export const SUBJECT_LINES = {
  en: ["Boost your channel with captions", "Reach more viewers with subtitles"],
  es: ["Impulsa tu canal con subtítulos", "Llega a más audiencia con subtítulos"]
};

export const CTAS = {
  en: ["Get Captions Now", "Start in Minutes"],
  es: ["Obtén subtítulos ahora", "Comienza en minutos"]
};

export function getTemplates(lang = "en") {
  return {
    subject: SUBJECT_LINES[lang] || SUBJECT_LINES["en"],
    cta: CTAS[lang] || CTAS["en"]
  };
}