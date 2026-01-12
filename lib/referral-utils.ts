export const ReferralUtils = {
  /**
   * Generates a standardized referral link
   * @param origin - The window.location.origin
   * @param referralCode - The user's referral code
   * @param path - Optional specific path (e.g. '/share/123'), defaults to home '/'
   */
  generateLink: (origin: string, referralCode?: string, path: string = '/') => {
    if (!referralCode) return `${origin}${path}`;
    const separator = path.includes('?') ? '&' : '?';
    return `${origin}${path}${separator}ref=${referralCode}`;
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
