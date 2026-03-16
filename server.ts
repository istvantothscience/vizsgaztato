import express from "express";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import path from "path";

// Initialize Resend with the provided API key
const resend = new Resend("re_MFfb5mdz_ATP6CCvv2uzjMLgQbd4iUbHD");

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  // API Route for sending emails
  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, subject, text } = req.body;

      if (!to || !subject || !text) {
        return res.status(400).json({ error: "Missing required fields (to, subject, text)" });
      }

      // Note: onboarding@resend.dev can only send to the email address used to register the Resend account
      const { data, error } = await resend.emails.send({
        from: "Acme <onboarding@resend.dev>",
        to: [to],
        subject: subject,
        text: text,
      });

      if (error) {
        console.error("Resend API Error:", error);
        return res.status(500).json({ error: error.message });
      }

      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("Server Error sending email:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
