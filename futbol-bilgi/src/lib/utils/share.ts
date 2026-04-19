export interface SharePayload {
  title: string;
  text: string;
  url?: string;
}

function getShareUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://futbolbilgi.app';
}

export async function shareContent(payload: SharePayload) {
  const fullText = payload.url ? `${payload.text}\n${payload.url}` : payload.text;

  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await navigator.share({
        title: payload.title,
        text: payload.text,
        url: payload.url,
      });
      return { success: true, method: 'share' as const, message: 'Paylaşım penceresi açıldı.' };
    } catch {
      // fall through to clipboard
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(fullText);
    return { success: true, method: 'clipboard' as const, message: 'Paylaşım metni panoya kopyalandı.' };
  }

  return { success: false, method: 'manual' as const, message: fullText };
}

export function buildResultShare(args: {
  modeLabel: string;
  score: number;
  accuracy: number;
  xpEarned: number;
  questionReached: number;
  totalQuestions: number;
}) {
  return {
    title: `${args.modeLabel} sonucumu paylaş`,
    text: `FutbolBilgi'de ${args.modeLabel} modunda ${args.score} puan yaptım. Başarı oranım %${args.accuracy}, kazandığım XP +${args.xpEarned}. ${args.questionReached}/${args.totalQuestions} soruya ulaştım!`,
    url: getShareUrl(),
  };
}

export function buildQuestionChallengeShare(args: {
  category: string;
  questionText: string;
}) {
  return {
    title: 'Bu soruyu bilir misin?',
    text: `FutbolBilgi meydan okuması! [${args.category}] ${args.questionText}`,
    url: getShareUrl(),
  };
}

export function buildProfileShare(args: {
  username: string;
  accuracy: number;
  totalQuestions: number;
  leagueName: string;
}) {
  return {
    title: `${args.username} profil özeti`,
    text: `${args.username}, FutbolBilgi'de ${args.totalQuestions} soru çözdü ve %${args.accuracy} başarı oranına ulaştı. Şu an ${args.leagueName} içinde yarışıyor!`,
    url: getShareUrl(),
  };
}

export function buildSeasonSummaryShare(args: {
  tierName: string;
  rank: string;
  seasonScore: number;
  zoneLabel: string;
}) {
  return {
    title: 'Haftalık lig durumumu paylaş',
    text: `FutbolBilgi haftalık lig durumum: ${args.tierName}, sıra ${args.rank}, sezon puanı ${args.seasonScore}. Şu an ${args.zoneLabel}!`,
    url: getShareUrl(),
  };
}

export function buildFriendLeaderboardShare(args: {
  title: string;
  leaderName: string;
  leaderScore: number;
  playerCount: number;
}) {
  return {
    title: args.title,
    text: `${args.title}: ${args.playerCount} oyuncu arasında lider ${args.leaderName} (${args.leaderScore} puan). Sen de FutbolBilgi'ye katıl!`,
    url: getShareUrl(),
  };
}
