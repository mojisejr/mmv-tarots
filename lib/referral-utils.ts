export const ReferralUtils = {
  /**
   * Generates a standardized referral link
   * @param origin - The window.location.origin
   * @param referralCode - The user's referral code
   * @param path - Optional specific path (e.g. '/share/123'), defaults to home '/'
   */
  generateLink: (origin: string, referralCode?: string, path: string = '/') => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    const parsedPath = new URL(normalizedPath, 'https://local.mimi');
    if (referralCode) {
      parsedPath.searchParams.set('ref', referralCode);
    }

    const pathWithQuery = `${parsedPath.pathname}${parsedPath.search}`;

    if (liffId) {
      return `https://liff.line.me/${liffId}${pathWithQuery}`;
    }

    return `${origin}${pathWithQuery}`;
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
