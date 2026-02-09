import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/contact", async (req, res) => {
  const { namn, email, telefon, tjanst, meddelande } = req.body;

  try {
    // Skapa SMTP-transport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // true endast om port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Skicka mail
    await transporter.sendMail({
      from: `"JW Quality Hemservice" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_TO_EMAIL,
      subject: "Ny förfrågan från hemsidan",
      html: `
        <h2>Ny kundförfrågan</h2>
        <p><strong>Namn:</strong> ${namn}</p>
        <p><strong>E-post:</strong> ${email}</p>
        <p><strong>Telefon:</strong> ${telefon}</p>
        <p><strong>Tjänst:</strong> ${tjanst}</p>
        <p><strong>Meddelande:</strong><br>${meddelande}</p>
      `,
    });

    // ✅ VIKTIGT: frontend förväntar sig "success"
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    res.status(500).json({
      success: false,
    });
  }
});

export default router;
