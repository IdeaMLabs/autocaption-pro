#!/bin/bash

# Automated deployment script for Stripe status integration
set -e

echo "🚀 Starting automated deployment..."

# Function to prompt for GitHub URL if not set
setup_git_remote() {
    if ! git remote get-url origin >/dev/null 2>&1; then
        echo "❌ No Git remote configured"
        echo "Please run: git remote add origin <your-github-repo-url>"
        echo "Example: git remote add origin https://github.com/username/youtube-project.git"
        exit 1
    fi
    echo "✅ Git remote configured"
}

# Check if there are changes to commit
check_changes() {
    if [[ -n $(git status --porcelain) ]]; then
        echo "📝 Found uncommitted changes"
        git add .
        git commit -m "Automated deployment: $(date)"
    else
        echo "✅ No new changes to commit"
    fi
}

# Push to trigger Cloudflare deployment
deploy() {
    echo "📤 Pushing to GitHub..."
    git push origin master
    echo "✅ Pushed to GitHub - Cloudflare Pages will auto-deploy"
}

# Wait for deployment (optional)
wait_for_deployment() {
    echo "⏳ Waiting 30 seconds for Cloudflare deployment..."
    sleep 30
}

# Main execution
main() {
    setup_git_remote
    check_changes
    deploy
    wait_for_deployment
    echo "🎉 Deployment complete!"
    echo "Next steps:"
    echo "1. Test Stripe checkout at your site"
    echo "2. Use test card: 4242 4242 4242 4242"
    echo "3. Check /status?job_id=<session_id>"
}

main "$@"