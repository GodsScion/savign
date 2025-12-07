# GitHub Pages Deployment Guide

This guide will help you deploy the SAVIGN Corporate Website to GitHub Pages.

## Prerequisites

- A GitHub account
- Git installed on your local machine
- This repository pushed to GitHub

## Pre-Deployment Verification

Before deploying, run the verification script to ensure everything is ready:

```bash
./verify-deployment.sh
```

This script will check:
- ✅ Required files exist (index.html, README.md)
- ✅ All asset paths are relative (not absolute URLs)
- ✅ Required directories exist (css/, js/, assets/)
- ✅ Required CSS and JavaScript files are present
- ✅ HTML structure includes viewport meta tag
- ✅ Semantic HTML elements are used
- ✅ ARIA labels are present for accessibility

If all checks pass, you're ready to deploy!

## Deployment Steps

### Option 1: Automatic Deployment with GitHub Actions (Recommended)

The repository includes a GitHub Actions workflow that automatically deploys to GitHub Pages on every push to the `main` branch.

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Enable GitHub Pages in repository settings:**
   - Go to your repository on GitHub
   - Click on **Settings** > **Pages**
   - Under **Source**, select **GitHub Actions**
   - Save the settings

3. **Verify the deployment:**
   - Go to the **Actions** tab in your repository
   - You should see a workflow run for "Deploy to GitHub Pages"
   - Wait for it to complete (green checkmark)
   - Your site will be available at: `https://[username].github.io/[repository-name]/`

### Option 2: Manual Deployment (Without GitHub Actions)

If you prefer not to use GitHub Actions:

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Configure GitHub Pages:**
   - Go to your repository on GitHub
   - Click on **Settings** > **Pages**
   - Under **Source**, select **Deploy from a branch**
   - Select the **main** branch
   - Select **/ (root)** as the folder
   - Click **Save**

3. **Wait for deployment:**
   - GitHub will automatically build and deploy your site
   - This may take a few minutes
   - Your site will be available at: `https://[username].github.io/[repository-name]/`

## Post-Deployment Verification Checklist

After deployment, verify the following:

### ✅ Basic Functionality
- [ ] Site loads without errors
- [ ] All CSS styles are applied correctly
- [ ] JavaScript functionality works (menu toggle, scroll animations)
- [ ] Logo and SVG icons display correctly

### ✅ Responsive Design
- [ ] Test on mobile viewport (< 768px)
- [ ] Test on tablet viewport (768px - 1023px)
- [ ] Test on desktop viewport (≥ 1024px)
- [ ] Mobile menu opens and closes correctly
- [ ] Desktop navigation displays correctly
- [ ] Bento grid reflows properly at different breakpoints

### ✅ Navigation
- [ ] All navigation links work
- [ ] Smooth scrolling to sections works
- [ ] Mobile menu closes when clicking a link
- [ ] Keyboard navigation works (Tab, Enter, Escape)

### ✅ Performance
- [ ] Page loads quickly (< 3 seconds)
- [ ] Animations are smooth
- [ ] No console errors in browser DevTools
- [ ] Images load properly (if any are added)

### ✅ Accessibility
- [ ] Tab navigation works through all interactive elements
- [ ] Focus indicators are visible
- [ ] ARIA labels are present on menu button
- [ ] Screen reader can navigate the site

### ✅ Cross-Browser Testing
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari (if available)
- [ ] Test in Edge
- [ ] Test on iOS Safari (if available)
- [ ] Test on Chrome for Android (if available)

## Testing Commands

### Test locally before deployment:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

### Check for broken links:

```bash
# Install a link checker (if not already installed)
npm install -g broken-link-checker

# Check for broken links
blc http://localhost:8000 -ro
```

### Validate HTML:

Visit: https://validator.w3.org/
- Enter your GitHub Pages URL
- Check for any HTML validation errors

### Test Performance:

Visit: https://pagespeed.web.dev/
- Enter your GitHub Pages URL
- Review performance metrics
- Aim for scores > 90 in all categories

### Test Accessibility:

Visit: https://wave.webaim.org/
- Enter your GitHub Pages URL
- Review accessibility issues
- Fix any errors or warnings

## Custom Domain (Optional)

If you want to use a custom domain:

1. **Add a CNAME file to the repository root:**
   ```bash
   echo "yourdomain.com" > CNAME
   git add CNAME
   git commit -m "Add custom domain"
   git push
   ```

2. **Configure DNS records:**
   - Add an A record pointing to GitHub's IP addresses:
     - 185.199.108.153
     - 185.199.109.153
     - 185.199.110.153
     - 185.199.111.153
   - Or add a CNAME record pointing to `[username].github.io`

3. **Enable HTTPS:**
   - Go to repository Settings > Pages
   - Check "Enforce HTTPS"

## Troubleshooting

### Site not loading after deployment

- Check the Actions tab for any failed workflow runs
- Verify that GitHub Pages is enabled in Settings > Pages
- Ensure the branch and folder are correctly configured
- Wait a few minutes - initial deployment can take time

### CSS/JS not loading

- Verify all paths are relative (starting with `./`)
- Check browser console for 404 errors
- Ensure file names match exactly (case-sensitive)

### 404 errors on navigation

- GitHub Pages serves `index.html` by default
- Ensure you're using hash-based navigation (`#section`)
- For multi-page sites, ensure all HTML files are in the root

### Workflow fails

- Check the Actions tab for error messages
- Verify the workflow file syntax is correct
- Ensure repository permissions are set correctly

## Monitoring

After deployment, you can monitor your site:

- **GitHub Actions**: Check deployment status in the Actions tab
- **GitHub Pages**: View deployment history in Settings > Pages
- **Analytics**: Consider adding privacy-friendly analytics (Plausible, Fathom)

## Updating the Site

To update the deployed site:

1. Make your changes locally
2. Test locally
3. Commit and push to the `main` branch:
   ```bash
   git add .
   git commit -m "Update content"
   git push origin main
   ```
4. GitHub Actions will automatically redeploy (if enabled)
5. Verify changes on the live site

## Support

For issues with GitHub Pages:
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Community Forum](https://github.community/)

