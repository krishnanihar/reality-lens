# Reality Lens - Vercel Deployment Guide

## 🚀 Deploy to Vercel in 5 Minutes

Vercel provides automatic HTTPS, which means **camera and microphone will work perfectly** on all devices!

---

## Prerequisites

- A GitHub account
- A Vercel account (free tier available at [vercel.com](https://vercel.com))
- Your Gemini API key: `AIzaSyC-VsCsYyasIsFAfy8aL9TDfsH7f_jKbE8`

---

## Step 1: Push to GitHub

### Option A: Using GitHub Desktop (Easiest)
1. Open GitHub Desktop
2. File → Add Local Repository
3. Select the `reality-lens` folder
4. Click "Publish repository"
5. Name it `reality-lens`
6. Uncheck "Keep this code private" (or keep private if you prefer)
7. Click "Publish Repository"

### Option B: Using Command Line
```bash
cd /Users/krishnaniharsunkara/Desktop/Vision/reality-lens

# Create a new repository on GitHub.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/reality-lens.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Vercel

### A. Import Project
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Click "Import Git Repository"
4. Select your `reality-lens` repository
5. Click "Import"

### B. Configure Project
Vercel will auto-detect Next.js settings. Just verify:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### C. Add Environment Variable
This is the **most important step**!

1. Click "Environment Variables"
2. Add the following:
   - **Name**: `NEXT_PUBLIC_GEMINI_API_KEY`
   - **Value**: `AIzaSyC-VsCsYyasIsFAfy8aL9TDfsH7f_jKbE8`
   - **Environment**: Select all (Production, Preview, Development)
3. Click "Add"

### D. Deploy
1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. 🎉 Your app is live with HTTPS!

---

## Step 3: Test Your Deployment

Once deployed, Vercel will give you a URL like: `https://reality-lens.vercel.app`

### Test Checklist
1. ✅ Open the URL on your phone or computer
2. ✅ Click the **Camera button** → Allow camera access
3. ✅ Click the **Microphone button** → Allow microphone access
4. ✅ Point camera at text and ask "What do you see?"
5. ✅ Listen to Gemini's voice response
6. ✅ Try the keyboard button for text chat

### Expected Results
- Camera preview shows live feed ✅
- Voice recognition captures your speech ✅
- Gemini responds with voice and text ✅
- Connection indicator shows "Connected" (green) ✅

---

## Step 4: Install as PWA (Optional)

### On Mobile (iPhone/Android)
1. Open your Vercel URL in Safari (iOS) or Chrome (Android)
2. Tap the Share button
3. Select "Add to Home Screen"
4. The app installs like a native app!

### On Desktop
1. Look for the install icon (⊕) in the address bar
2. Click "Install"
3. App opens in its own window

---

## Automatic Deployments

Every time you push to GitHub, Vercel automatically:
- Builds your app
- Runs tests
- Deploys to production
- Updates your live URL

### Make Changes
```bash
# Make your code changes
git add .
git commit -m "Add new feature"
git push

# Vercel automatically deploys in ~2 minutes!
```

---

## Custom Domain (Optional)

Want your own domain like `reality-lens.com`?

1. Buy a domain from Namecheap, GoDaddy, etc.
2. In Vercel dashboard → Settings → Domains
3. Add your domain
4. Update DNS records (Vercel provides instructions)
5. HTTPS is automatic!

---

## Environment Variables Management

### View/Edit Variables
1. Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add, edit, or delete variables
4. Redeploy for changes to take effect

### Security Best Practices
- ✅ Never commit `.env.local` to Git (already in `.gitignore`)
- ✅ Use Vercel dashboard for production secrets
- ✅ API keys are encrypted by Vercel
- ✅ Keep your Gemini API key private

---

## Troubleshooting

### Build Fails
- Check Vercel build logs for errors
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

### Camera/Microphone Not Working
- Confirm you're using the HTTPS Vercel URL (not localhost)
- Check browser permissions in Settings
- Try a different browser (Chrome recommended)

### Gemini Not Responding
- Verify `NEXT_PUBLIC_GEMINI_API_KEY` is set in Vercel
- Check API key is valid at [Google AI Studio](https://makersuite.google.com)
- Look at browser console for error messages

### Connection Issues
- Check your internet connection
- Verify Gemini API has no rate limits
- Try refreshing the page

---

## Performance & Analytics

### Vercel Analytics (Optional)
Enable free analytics to see:
- Page views
- Performance metrics
- Geographic distribution
- User devices

1. Vercel Dashboard → Analytics → Enable
2. View real-time data

### Speed Insights
1. Vercel Dashboard → Speed Insights → Enable
2. See Core Web Vitals
3. Get performance recommendations

---

## Scaling & Limits

### Vercel Free Tier
- ✅ Unlimited projects
- ✅ Automatic HTTPS
- ✅ 100GB bandwidth/month
- ✅ Global CDN
- ✅ Instant rollbacks

### Gemini API Limits
- Check your API quotas at [Google AI Studio](https://makersuite.google.com)
- Monitor usage to avoid hitting limits
- Consider upgrading if needed

---

## Next Steps After Deployment

1. **Share Your Link**: Send the Vercel URL to friends/testers
2. **Collect Feedback**: See how users interact with the app
3. **Monitor Usage**: Check Vercel analytics
4. **Add Features**: Implement Phase 2 (AR overlays, navigation)
5. **Improve UX**: Based on user feedback

---

## Useful Commands

### Local Development
```bash
npm run dev          # Start dev server
npm run build        # Test production build
npm run start        # Run production build locally
npm run lint         # Check for errors
```

### Git Commands
```bash
git status           # Check what changed
git add .            # Stage all changes
git commit -m "msg"  # Commit changes
git push             # Deploy to Vercel
```

---

## Support & Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Gemini API**: [ai.google.dev](https://ai.google.dev)
- **PWA Guide**: [web.dev/pwa](https://web.dev/progressive-web-apps/)

---

## 🎉 Success Checklist

After deployment, verify:
- ✅ App loads on HTTPS URL
- ✅ Camera permission works
- ✅ Microphone permission works
- ✅ Gemini responds correctly
- ✅ Voice output speaks
- ✅ Messages display properly
- ✅ PWA installable
- ✅ Works on mobile devices

**Congratulations! Reality Lens is now live! 🚀**

---

## Quick Reference

**Your Vercel URL**: Will be `https://reality-lens-USERNAME.vercel.app`
**Your API Key**: Already configured in Vercel dashboard
**GitHub Repo**: `https://github.com/YOUR_USERNAME/reality-lens`

Need help? Check the main README.md or create an issue on GitHub.
