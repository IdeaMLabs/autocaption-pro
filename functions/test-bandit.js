let stats = {};

export function pickBandit(lang, subjects, ctas) {
  if (!stats[lang]) stats[lang] = {};
  const key = lang;
  const subj = subjects[Math.floor(Math.random() * subjects.length)];
  const cta = ctas[Math.floor(Math.random() * ctas.length)];
  if (!stats[key]) stats[key] = { subj: {}, cta: {} };
  stats[key].subj[subj] = (stats[key].subj[subj] || 0) + 1;
  stats[key].cta[cta] = (stats[key].cta[cta] || 0) + 1;
  return { chosenSubject: subj, chosenCTA: cta };
}

export function reportStats() {
  return stats;
}