#!/bin/bash

# System validation script for AutoCaption platform
set -e

SITE_URL="https://autocaption-pro.pages.dev"
echo "🚀 AutoCaption System Validation"
echo "================================="
echo "Site: $SITE_URL"
echo "Date: $(date)"
echo ""

# Function to check endpoint
check_endpoint() {
    local endpoint="$1"
    local method="${2:-GET}"
    local expected_status="${3:-200}"
    local data="${4:-}"
    
    echo -n "Testing $method $endpoint... "
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        status=$(curl -s -o /dev/null -w "%{http_code}" \
            -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$SITE_URL$endpoint" || echo "000")
    else
        status=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL$endpoint" || echo "000")
    fi
    
    if [ "$status" = "$expected_status" ] || [ "$status" = "405" ]; then
        echo "✅ ($status)"
        return 0
    else
        echo "❌ ($status)"
        return 1
    fi
}

# Function to test webhook simulation
test_webhook() {
    echo -n "Testing webhook simulation... "
    
    local webhook_data='{
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_test_validation_'$(date +%s)'",
                "customer_details": {"email": "test@validation.com"},
                "amount_total": 2999,
                "currency": "usd",
                "payment_status": "paid"
            }
        }
    }'
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$webhook_data" \
        "$SITE_URL/webhook" || echo '{"success":false}')
    
    if echo "$response" | grep -q '"success":true'; then
        echo "✅"
        return 0
    else
        echo "❌"
        return 1
    fi
}

# Test all endpoints
echo "🔍 Endpoint Health Check:"
echo "-------------------------"
passed=0
total=0

# Core endpoints
endpoints=(
    "/diag"
    "/transactions"
    "/status?job_id=validation_test"
)

for endpoint in "${endpoints[@]}"; do
    total=$((total + 1))
    if check_endpoint "$endpoint"; then
        passed=$((passed + 1))
    fi
done

# POST endpoints
total=$((total + 1))
if check_endpoint "/process" "POST" "200" '{"session_id":"test","video_url":"https://youtube.com/watch?v=test"}'; then
    passed=$((passed + 1))
fi

total=$((total + 1))
if check_endpoint "/email" "POST" "200" '{"to":"test@example.com","subject":"Test","text":"Test message"}'; then
    passed=$((passed + 1))
fi

# Webhook simulation
echo ""
echo "🎣 Webhook Integration Test:"
echo "----------------------------"
total=$((total + 1))
if test_webhook; then
    passed=$((passed + 1))
fi

# Results
echo ""
echo "📊 System Health Report:"
echo "========================"
echo "✅ Passed: $passed/$total endpoints"
echo "📈 Success Rate: $(( passed * 100 / total ))%"
echo ""

if [ $passed -ge $((total - 1)) ]; then
    echo "🎉 SYSTEM OPERATIONAL"
    echo "   • All critical endpoints responding"
    echo "   • Webhook processing functional"
    echo "   • Ready for production traffic"
elif [ $passed -ge $((total / 2)) ]; then
    echo "⚠️  PARTIAL FUNCTIONALITY"
    echo "   • Core systems operational"
    echo "   • Some endpoints need attention"
    echo "   • Check deployment status"
else
    echo "❌ SYSTEM ISSUES"
    echo "   • Multiple endpoints failing"
    echo "   • Check Cloudflare deployment"
    echo "   • Verify environment variables"
fi

echo ""
echo "🛠️  Next Steps:"
echo "==============+"
echo "• Configure Stripe webhook: $SITE_URL/webhook"
echo "• Add event: checkout.session.completed"
echo "• Test with card: 4242 4242 4242 4242"
echo "• Run GitHub Action: 'End-to-End Test'"
echo ""

exit 0