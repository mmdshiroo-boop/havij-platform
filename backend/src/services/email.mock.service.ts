export const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendVerificationCode = async (
  email: string,
  code: string,
): Promise<boolean> => {
  console.log(
    `\n╔════════════════════════════════════════════════════════════════╗`,
  );
  console.log(`║  📧 [MOCK] Sending email to: ${email}`);
  console.log(`║  🔐 [MOCK] Verification code: ${code}`);
  console.log(`║  ⚠️  [MOCK] This is a test. No real email sent.`);
  console.log(
    `╚════════════════════════════════════════════════════════════════╝\n`,
  );

  await new Promise((resolve) => setTimeout(resolve, 1000));
  return true;
};

export const verifyEmailConnection = async (): Promise<boolean> => {
  console.log("✅ [MOCK] Email server is ready");
  return true;
};
