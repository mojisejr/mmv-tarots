export const ReferralUtils = {
  /**
   * Generates a standardized referral link
   * @param origin - The window.location.origin
   * @param referralCode - The user's referral code
   * @param path - Optional specific path (e.g. '/share/123'), defaults to home '/'
   */
  generateLink: (origin: string, referralCode?: string, path: string = '/') => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    const parsedPath = new URL(normalizedPath, 'https://local.mimi');
    if (referralCode) {
      parsedPath.searchParams.set('ref', referralCode);
    }

    const pathWithQuery = `${parsedPath.pathname}${parsedPath.search}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const baseUrl = (appUrl && appUrl.length > 0 ? appUrl : origin).trim();

    if (!baseUrl) {
      return pathWithQuery;
    }

    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${normalizedBase}${pathWithQuery}`;
  },

  /**
   * Generates the canonical invite link for profile sharing.
   */
  generateInviteLink: (origin: string, referralCode?: string) => {
    return ReferralUtils.generateLink(origin, referralCode, '/');
  },

  /**
   * Generates the canonical prediction-share link with optional referral attribution.
   */
  generatePredictionLink: (origin: string, predictionId: string, referralCode?: string) => {
    return ReferralUtils.generateLink(origin, referralCode, `/share/${predictionId}`);
  },

  /**
   * Generates standard sharing text for specific contexts
   */
  shareText: {
    /** Text for sharing a specific prediction result */
    prediction: (cardName: string) => 
      `ฉันได้รับไพ่ "${cardName}" 🔮\n\nเปิดไพ่พร้อมรับสิทธิ์อ่านฟรี 3 ครั้งที่ MimiVibe ✨`,
    
    /** Text for general profile sharing */
    invite: () => 
      `รับคำทำนายแม่นๆ ฟรี! สมัคร MimiVibe ผ่านลิงก์นี้ รับสิทธิ์เปิดไพ่ฟรี 3 ครั้งทันที (จากปกติ 1 ครั้ง) ✨🔮`,
  }
};
