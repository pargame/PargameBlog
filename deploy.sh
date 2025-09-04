#!/bin/bash

# 깨끗한 배포를 위한 스크립트

echo "🚀 Building project..."
npm run build

echo "📁 Adding .nojekyll file..."
touch dist/.nojekyll

echo "🧹 Cleaning gh-pages branch..."
git push origin --delete gh-pages 2>/dev/null || true

echo "📤 Deploying to gh-pages..."
npx gh-pages -d dist --dotfiles

echo "✅ Deployment complete!"
echo "🌐 Your site will be available at: https://pargame.github.io/PargameBlog/"
