import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const leads = [
  { name: 'Dersern Jackson',    email: 'dezcjackson@gmail.com',           suiteNo: 'VC-59821' },
  { name: 'Taravor Phillips',   email: 'phillipstrevor554@gmail.com',      suiteNo: 'GY-32703' },
  { name: 'Nigel Holloway',     email: 'slamming1969@hotmail.com',         suiteNo: 'BB-61906' },
  { name: 'Wilbert Wyllis',     email: 'wyllisgetit4u@gmail.com',          suiteNo: 'DM-73870' },
  { name: 'Debbie St Louis',    email: 'debbie.stlouis@km2solutions.com',  suiteNo: 'GD-44249' },
  { name: 'Alana Parris',       email: 'estherparris7@gmail.com',          suiteNo: 'GD-18308' },
  { name: 'Samuel Stanisclaus', email: 'samuelstanisclaus8@gmail.com',     suiteNo: 'GD-18549' },
  { name: 'Riad Ali',           email: 'rayadthurton2574@gmail.com',       suiteNo: 'BB-14612' },
  { name: 'Gail Nestor',        email: 'gailnestor246@gmail.com',          suiteNo: 'TT-36627' },
];

async function main() {
  console.log('📧 Sending welcome emails...\n');

  for (const lead of leads) {
    try {
      await resend.emails.send({
        from: 'Gasp Maker Cargo <info@gaspmakercargo.com>',
        to: lead.email,
        subject: 'Welcome to Gasp Maker Cargo! Your account is ready 📦',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h1 style="color: #FBBF24;">Hello, ${lead.name}!</h1>
            <p>Your Gasp Maker Cargo account has been created. You can now track your packages and manage your shipments.</p>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <p style="margin: 0; font-size: 14px; color: #666;">Your Suite Number:</p>
              <p style="font-size: 28px; font-weight: bold; color: #111;">${lead.suiteNo}</p>
              <p style="font-size: 12px; color: #666;">Use this address when shopping online in the USA</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="https://www.gaspmakercargo.com/en/recuperar-contrasena"
                 style="background-color: #FBBF24; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Set My Password & Login
              </a>
            </div>

            <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
              Enter your email <strong>${lead.email}</strong> to receive your password reset link.
            </p>
          </div>
        `,
      });

      console.log(`✅ Email sent: ${lead.email}`);
    } catch (error: any) {
      console.error(`❌ Error sending to ${lead.email}:`, error.message);
    }
  }

  console.log('\n✅ Done sending emails.');
}

main().catch(console.error);