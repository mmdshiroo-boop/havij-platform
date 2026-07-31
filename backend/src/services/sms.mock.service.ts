// سرویس Mock - با کد ثابت برای تست راحت‌تر
export const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendVerificationCode = async (
  phone: string,
  code: string,
): Promise<boolean> => {
  console.log(`📱 [MOCK SMS] Sending code ${code} to ${phone}`);
  // در محیط توسعه، همیشه موفقیت آمیز است
  return true;
};
export const verifyEmailConnection = async (): Promise<boolean> => {
  console.log("✅ [MOCK] SMS server is ready");
  return true;
};
