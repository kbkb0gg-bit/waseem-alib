import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs-extra";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import slugify from "slugify";
import admin from "firebase-admin";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
// Note: In this environment, we might not have a service account key file.
// We can try to use default credentials if available, or just skip verification for now if it's a demo.
// But the user asked for real verification.
// I'll try to initialize with the project ID from the config.
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const app = express();
const PORT = 3000;

app.use(helmet({
  contentSecurityPolicy: false, // Disable for Vite dev
}));
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const ARTICLES_FILE = path.join(DATA_DIR, "articles.json");
const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");

// Helper to read/write JSON files with basic locking (synchronous)
const readData = (file: string) => {
  try {
    return fs.readJsonSync(file);
  } catch (e) {
    return [];
  }
};

const writeData = (file: string, data: any) => {
  fs.writeJsonSync(file, data, { spaces: 2 });
};

// Auth middleware
const verifyToken = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// API Routes
app.get("/api/articles", (req, res) => {
  const articles = readData(ARTICLES_FILE);
  res.json(articles.sort((a: any, b: any) => b.createdAt - a.createdAt));
});

app.get("/api/articles/:slug", (req, res) => {
  const articles = readData(ARTICLES_FILE);
  const article = articles.find((a: any) => a.slug === req.params.slug);
  if (!article) return res.status(404).json({ error: "Article not found" });
  res.json(article);
});

app.post("/api/articles", verifyToken, (req, res) => {
  if (!(req as any).user.email_verified) {
    return res.status(403).json({ error: "Email address must be verified to publish articles" });
  }

  const { title, description, website, tags } = req.body;

  // Validation
  if (!title || title.length < 30 || title.length > 100) {
    return res.status(400).json({ error: "Title must be 30-100 characters" });
  }
  const charCount = description.trim().length;
  if (charCount < 300) {
    return res.status(400).json({ error: "Description must be at least 300 characters" });
  }

  const articles = readData(ARTICLES_FILE);
  const slug = `${slugify(title, { lower: true, strict: true })}-${Math.random().toString(36).substring(2, 8)}`;

  const newArticle = {
    id: Date.now().toString(),
    title,
    description,
    website,
    tags: tags || [],
    slug,
    authorUid: (req as any).user.uid,
    authorName: (req as any).user.name || (req as any).user.email.split('@')[0],
    createdAt: Date.now(),
    votes: 0,
    views: 0,
    outboundClicks: 0,
    upvotedBy: [],
    downvotedBy: [],
  };

  articles.push(newArticle);
  writeData(ARTICLES_FILE, articles);
  res.json(newArticle);
});

app.post("/api/articles/:id/vote", verifyToken, (req, res) => {
  const { type } = req.body; // 'up' or 'down'
  const articles = readData(ARTICLES_FILE);
  const article = articles.find((a: any) => a.id === req.params.id);
  if (!article) return res.status(404).json({ error: "Article not found" });

  const uid = (req as any).user.uid;
  article.upvotedBy = article.upvotedBy || [];
  article.downvotedBy = article.downvotedBy || [];

  if (type === "up") {
    if (article.upvotedBy.includes(uid)) {
      article.upvotedBy = article.upvotedBy.filter((id: string) => id !== uid);
    } else {
      article.upvotedBy.push(uid);
      article.downvotedBy = article.downvotedBy.filter((id: string) => id !== uid);
    }
  } else if (type === "down") {
    if (article.downvotedBy.includes(uid)) {
      article.downvotedBy = article.downvotedBy.filter((id: string) => id !== uid);
    } else {
      article.downvotedBy.push(uid);
      article.upvotedBy = article.upvotedBy.filter((id: string) => id !== uid);
    }
  }

  article.votes = article.upvotedBy.length - article.downvotedBy.length;
  writeData(ARTICLES_FILE, articles);
  res.json(article);
});

app.get("/api/articles/:id/comments", (req, res) => {
  const comments = readData(COMMENTS_FILE);
  res.json(comments.filter((c: any) => c.articleId === req.params.id));
});

app.post("/api/articles/:id/comments", verifyToken, (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Comment text is required" });

  const comments = readData(COMMENTS_FILE);
  const newComment = {
    id: Date.now().toString(),
    articleId: req.params.id,
    authorUid: (req as any).user.uid,
    authorName: (req as any).user.name || (req as any).user.email.split('@')[0],
    text,
    createdAt: Date.now(),
  };

  comments.push(newComment);
  writeData(COMMENTS_FILE, comments);
  res.json(newComment);
});

// User Profile
app.get("/api/users/:uid", (req, res) => {
  const users = readData(USERS_FILE);
  const user = users.find((u: any) => u.uid === req.params.uid);
  if (!user) return res.status(404).json({ error: "User not found" });
  
  // Hide email from public response
  const { email, ...publicUser } = user;
  res.json(publicUser);
});

app.get("/api/users/:uid/articles", (req, res) => {
  const articles = readData(ARTICLES_FILE);
  const userArticles = articles.filter((a: any) => a.authorUid === req.params.uid);
  res.json(userArticles.sort((a: any, b: any) => b.createdAt - a.createdAt));
});

app.post("/api/users/sync", verifyToken, (req, res) => {
  const { name, bio, website, photoURL } = req.body;
  const users = readData(USERS_FILE);
  let user = users.find((u: any) => u.uid === (req as any).user.uid);

  if (user) {
    user.name = name || user.name || (req as any).user.email.split('@')[0];
    user.bio = bio || user.bio;
    user.website = website || user.website;
    if (photoURL !== undefined) user.photoURL = photoURL;
  } else {
    user = {
      uid: (req as any).user.uid,
      email: (req as any).user.email,
      name: name || (req as any).user.name || (req as any).user.email.split('@')[0],
      bio: bio || "",
      website: website || "",
      photoURL: photoURL || (req as any).user.picture || "",
      createdAt: Date.now(),
      outboundClicks: 0,
    };
    users.push(user);
  }

  writeData(USERS_FILE, users);
  
  // Hide email from response
  const { email, ...publicUser } = user;
  res.json(publicUser);
});

// Analytics Endpoints
app.post("/api/articles/:id/view", (req, res) => {
  const articles = readData(ARTICLES_FILE);
  const article = articles.find((a: any) => a.id === req.params.id);
  if (!article) return res.status(404).json({ error: "Article not found" });
  
  article.views = (article.views || 0) + 1;
  writeData(ARTICLES_FILE, articles);
  res.json({ success: true, views: article.views });
});

app.post("/api/articles/:id/click", (req, res) => {
  const articles = readData(ARTICLES_FILE);
  const article = articles.find((a: any) => a.id === req.params.id);
  if (!article) return res.status(404).json({ error: "Article not found" });
  
  article.outboundClicks = (article.outboundClicks || 0) + 1;
  writeData(ARTICLES_FILE, articles);
  res.json({ success: true, outboundClicks: article.outboundClicks });
});

app.post("/api/users/:uid/click", (req, res) => {
  const users = readData(USERS_FILE);
  const user = users.find((u: any) => u.uid === req.params.uid);
  if (!user) return res.status(404).json({ error: "User not found" });
  
  user.outboundClicks = (user.outboundClicks || 0) + 1;
  writeData(USERS_FILE, users);
  res.json({ success: true, outboundClicks: user.outboundClicks });
});

// Admin Routes (Simple password protection for demo)
const ADMIN_PASSWORD = "admin_secret_123"; // In real app, use env var
const verifyAdmin = (req: any, res: any, next: any) => {
  const password = req.headers["x-admin-password"];
  if (password !== ADMIN_PASSWORD) return res.status(403).json({ error: "Forbidden" });
  next();
};

app.get("/api/admin/stats", verifyAdmin, (req, res) => {
  const users = readData(USERS_FILE);
  const articles = readData(ARTICLES_FILE);
  const comments = readData(COMMENTS_FILE);

  res.json({
    totalUsers: users.length,
    totalArticles: articles.length,
    totalComments: comments.length,
    users,
    articles,
    comments,
  });
});

app.delete("/api/admin/:type/:id", verifyAdmin, (req, res) => {
  const { type, id } = req.params;
  let file = "";
  if (type === "users") file = USERS_FILE;
  else if (type === "articles") file = ARTICLES_FILE;
  else if (type === "comments") file = COMMENTS_FILE;

  if (!file) return res.status(400).json({ error: "Invalid type" });

  const data = readData(file);
  const filtered = data.filter((item: any) => (item.id || item.uid) !== id);
  writeData(file, filtered);
  res.json({ success: true });
});

// Sitemap
app.get("/sitemap.xml", (req, res) => {
  const articles = readData(ARTICLES_FILE);
  const baseUrl = process.env.APP_URL || "http://localhost:3000";

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

  articles.forEach((article: any) => {
    xml += `
  <url>
    <loc>${baseUrl}/story/${article.slug}</loc>
    <lastmod>${new Date(article.createdAt).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  xml += `
</urlset>`;

  res.header("Content-Type", "application/xml");
  res.send(xml);
});

// Vite Setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
