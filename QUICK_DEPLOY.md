# 🚀 Reality Lens - Quick Deploy Guide

## TL;DR - Deploy in 3 Steps

### Step 1: Create GitHub Repository (2 minutes)
1. Go to [github.com/new](https://github.com/new)
2. Name: `reality-lens`
3. Description: "AI Vision Assistant with Gemini Live"
4. Click "Create repository"

### Step 2: Push Code (1 minute)
Copy and paste these commands in your terminal:

```bash
cd /Users/krishnaniharsunkara/Desktop/Vision/reality-lens

# Link to your GitHub repo (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/reality-lens.git

# Push to GitHub
git add .
git commit -m "Initial commit - Reality Lens Phase 1"
git push -u origin main
```

### Step 3: Deploy to Vercel (2 minutes)
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import" next to your `reality-lens` repo
3. Add Environment Variable:
   - Name: `NEXT_PUBLIC_GEMINI_API_KEY`
   - Value: `AIzaSyC-VsCsYyasIsFAfy8aL9TDfsH7f_jKbE8`
4. Click "Deploy"

---

## 🎉 Done!

In 2-3 minutes, you'll have a live URL like:
```
https://reality-lens.vercel.app
```

Open it on your phone, allow camera/microphone, and test the full experience!

---

## Test Your Deployment

1. **Open the Vercel URL** on your phone or computer
2. **Click Camera button** → Point at text
3. **Click Microphone button** → Ask "What do you see?"
4. **Listen** to Gemini's response!

---

## Important Notes

✅ **HTTPS Automatic**: Camera/microphone work out of the box
✅ **No ngrok needed**: Vercel provides HTTPS
✅ **Works on mobile**: Test on any device
✅ **PWA Ready**: Can be installed as an app
✅ **Auto Deploy**: Push to GitHub = Auto deploy

---

## Need Help?

- **Detailed guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Full docs**: See [README.md](./README.md)
- **Setup issues**: See [SETUP.md](./SETUP.md)

---

**Your API Key** (already configured in `.env.local`):
```
AIzaSyC-VsCsYyasIsFAfy8aL9TDfsH7f_jKbE8
```

Remember to add this in Vercel's Environment Variables!
