#!/bin/bash

# 209jobs Deployment Script
# This script helps automate deployment tasks and verification

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - Use environment variables with fallbacks
ENVIRONMENTS=("development" "staging" "production")
HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-60}
HEALTH_CHECK_INTERVAL=${HEALTH_CHECK_INTERVAL:-5}
DEPLOYMENT_TIMEOUT=${DEPLOYMENT_TIMEOUT:-300}
MAX_RETRY_ATTEMPTS=${MAX_RETRY_ATTEMPTS:-3}

# Environment URLs - Use environment variables with secure fallbacks
DEV_URL=${DEV_URL:-"https://dev-209jobs.vercel.app"}
STAGING_URL=${STAGING_URL:-"https://staging-209jobs.vercel.app"}
PRODUCTION_URL=${PRODUCTION_URL:-"https://209jobs.com"}

# Security configuration
DEPLOYMENT_LOCK_FILE="/tmp/209jobs-deploy.lock"
DEPLOYMENT_SECRET=${DEPLOYMENT_SECRET:-""}
REQUIRE_AUTH=${REQUIRE_AUTH:-"true"}

# Logging configuration
LOG_DIR=${LOG_DIR:-"./logs"}
LOG_FILE="$LOG_DIR/deploy-$(date +%Y%m%d-%H%M%S).log"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "           209jobs Deployment Script"
    echo "=================================================="
    echo -e "${NC}"
    log "INFO" "Deployment script started"
}

print_step() {
    echo -e "${YELLOW}[STEP]${NC} $1"
    log "INFO" "STEP: $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    log "SUCCESS" "$1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    log "ERROR" "$1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    log "WARNING" "$1"
}

# Cleanup function for signal handling
cleanup() {
    local exit_code=$?
    print_step "Cleaning up..."
    
    # Remove deployment lock
    if [ -f "$DEPLOYMENT_LOCK_FILE" ]; then
        rm -f "$DEPLOYMENT_LOCK_FILE"
        log "INFO" "Deployment lock removed"
    fi
    
    # Kill any background processes
    jobs -p | xargs -r kill 2>/dev/null || true
    
    log "INFO" "Cleanup completed with exit code: $exit_code"
    exit $exit_code
}

# Set up signal handlers
trap cleanup EXIT INT TERM

# Function to check deployment lock
check_deployment_lock() {
    if [ -f "$DEPLOYMENT_LOCK_FILE" ]; then
        local lock_pid=$(cat "$DEPLOYMENT_LOCK_FILE" 2>/dev/null || echo "")
        if [ -n "$lock_pid" ] && kill -0 "$lock_pid" 2>/dev/null; then
            print_error "Another deployment is already in progress (PID: $lock_pid)"
            print_error "If this is incorrect, remove the lock file: $DEPLOYMENT_LOCK_FILE"
            exit 1
        else
            print_warning "Stale deployment lock found, removing..."
            rm -f "$DEPLOYMENT_LOCK_FILE"
        fi
    fi
    
    # Create new lock
    echo $$ > "$DEPLOYMENT_LOCK_FILE"
    log "INFO" "Deployment lock created (PID: $$)"
}

# Function to validate configuration
validate_configuration() {
    print_step "Validating configuration..."
    
    # Check required environment variables
    local missing_vars=()
    
    if [ "$REQUIRE_AUTH" = "true" ] && [ -z "$DEPLOYMENT_SECRET" ]; then
        missing_vars+=("DEPLOYMENT_SECRET")
    fi
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables: ${missing_vars[*]}"
        print_error "Please set these variables before running the deployment"
        exit 1
    fi
    
    # Validate timeout values
    if ! [[ "$HEALTH_CHECK_TIMEOUT" =~ ^[0-9]+$ ]] || [ "$HEALTH_CHECK_TIMEOUT" -lt 10 ]; then
        print_error "Invalid HEALTH_CHECK_TIMEOUT: must be a number >= 10"
        exit 1
    fi
    
    if ! [[ "$HEALTH_CHECK_INTERVAL" =~ ^[0-9]+$ ]] || [ "$HEALTH_CHECK_INTERVAL" -lt 1 ]; then
        print_error "Invalid HEALTH_CHECK_INTERVAL: must be a number >= 1"
        exit 1
    fi
    
    print_success "Configuration validation passed"
}

# Function to check if required tools are installed
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    local missing_tools=()
    local required_tools=("node" "npm" "git" "curl" "jq")
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        print_error "Please install these tools before running the deployment"
        exit 1
    fi
    
    # Check Node.js version
    local node_version=$(node --version | sed 's/v//')
    local required_node_version="18.0.0"
    
    if ! node -e "process.exit(require('semver').gte('$node_version', '$required_node_version') ? 0 : 1)" 2>/dev/null; then
        print_warning "Node.js version $node_version may not be compatible. Recommended: >= $required_node_version"
    fi
    
    print_success "All prerequisites are installed"
}

# Function to validate environment
validate_environment() {
    local env=$1
    print_step "Validating environment: $env"
    
    if [[ ! " ${ENVIRONMENTS[@]} " =~ " $env " ]]; then
        print_error "Invalid environment: $env"
        print_error "Valid environments: ${ENVIRONMENTS[*]}"
        exit 1
    fi
    
    print_success "Environment validation passed"
}

# Function to get environment URL
get_environment_url() {
    local env=$1
    case $env in
        "development")
            echo "$DEV_URL"
            ;;
        "staging")
            echo "$STAGING_URL"
            ;;
        "production")
            echo "$PRODUCTION_URL"
            ;;
        *)
            print_error "Unknown environment: $env"
            exit 1
            ;;
    esac
}

# Function to validate URL
validate_url() {
    local url=$1
    if ! curl -s --head --fail --max-time 10 "$url" > /dev/null 2>&1; then
        return 1
    fi
    return 0
}

# Function to run command with retry
run_with_retry() {
    local max_attempts=$1
    shift
    local command=("$@")
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        print_step "Attempt $attempt/$max_attempts: ${command[*]}"
        
        if "${command[@]}"; then
            return 0
        else
            local exit_code=$?
            if [ $attempt -eq $max_attempts ]; then
                print_error "Command failed after $max_attempts attempts: ${command[*]}"
                return $exit_code
            else
                print_warning "Command failed, retrying in 5 seconds..."
                sleep 5
                ((attempt++))
            fi
        fi
    done
}

# Function to run pre-deployment checks
pre_deployment_checks() {
    print_step "Running pre-deployment checks..."
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository"
        exit 1
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "You have uncommitted changes"
        if [ "${FORCE_DEPLOY:-false}" != "true" ]; then
            read -p "Continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    fi
    
    # Install dependencies with retry
    print_step "Installing dependencies..."
    if ! run_with_retry 3 npm ci; then
        print_error "Failed to install dependencies"
        exit 1
    fi
    
    # Run linting with timeout
    print_step "Running linting..."
    if ! timeout 120 npm run lint; then
        print_error "Linting failed or timed out"
        exit 1
    fi
    
    # Run formatting check
    print_step "Checking code formatting..."
    if ! timeout 60 npm run format:check; then
        print_error "Code formatting check failed or timed out"
        exit 1
    fi
    
    # Run security scan
    print_step "Running security scan..."
    if ! timeout 180 npm run security:scan:ci; then
        print_error "Security scan failed or timed out"
        exit 1
    fi
    
    # Run tests with timeout
    print_step "Running tests..."
    if ! timeout 300 npm run test; then
        print_error "Tests failed or timed out"
        exit 1
    fi
    
    # Build the application with timeout
    print_step "Building application..."
    if ! timeout 600 npm run build; then
        print_error "Build failed or timed out"
        exit 1
    fi
    
    print_success "Pre-deployment checks completed"
}

# Function to check database migrations
check_migrations() {
    local env=$1
    print_step "Checking database migrations for $env..."
    
    # Validate Prisma schema
    if ! timeout 30 npx prisma validate; then
        print_error "Prisma schema validation failed"
        exit 1
    fi
    
    # Generate Prisma client
    if ! timeout 60 npx prisma generate; then
        print_error "Prisma client generation failed"
        exit 1
    fi
    
    print_success "Migration check completed"
}

# Function to perform deployment with proper error handling
deploy() {
    local env=$1
    print_step "Deploying to $env environment..."
    
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI not found. Please install with: npm i -g vercel"
        exit 1
    fi
    
    # Set deployment timeout
    local deploy_start_time=$(date +%s)
    
    case $env in
        "development")
            if ! timeout $DEPLOYMENT_TIMEOUT vercel --target staging --yes; then
                print_error "Development deployment failed or timed out"
                exit 1
            fi
            ;;
        "staging")
            if ! timeout $DEPLOYMENT_TIMEOUT vercel --target staging --yes; then
                print_error "Staging deployment failed or timed out"
                exit 1
            fi
            ;;
        "production")
            if ! timeout $DEPLOYMENT_TIMEOUT vercel --prod --yes; then
                print_error "Production deployment failed or timed out"
                exit 1
            fi
            ;;
    esac
    
    local deploy_end_time=$(date +%s)
    local deploy_duration=$((deploy_end_time - deploy_start_time))
    
    print_success "Deployment completed for $env in ${deploy_duration}s"
}

# Function to wait for deployment with proper error handling
wait_for_deployment() {
    local env=$1
    local url=$(get_environment_url "$env")
    
    print_step "Waiting for deployment to be available at $url..."
    
    local elapsed=0
    local health_endpoint="$url/api/health"
    
    while [ $elapsed -lt $HEALTH_CHECK_TIMEOUT ]; do
        # Use proper HTTP status code checking
        local http_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$health_endpoint" 2>/dev/null || echo "000")
        
        if [ "$http_status" = "200" ]; then
            # Verify the response contains expected content
            local response=$(curl -s --max-time 10 "$health_endpoint" 2>/dev/null || echo "")
            if echo "$response" | jq -e '.status == "ok"' > /dev/null 2>&1; then
                print_success "Deployment is live and healthy!"
                return 0
            fi
        fi
        
        echo -n "."
        sleep $HEALTH_CHECK_INTERVAL
        elapsed=$((elapsed + HEALTH_CHECK_INTERVAL))
    done
    
    print_error "Deployment health check timed out after ${HEALTH_CHECK_TIMEOUT}s"
    print_error "Last HTTP status: $http_status"
    return 1
}

# Function to run post-deployment verification with comprehensive checks
post_deployment_verification() {
    local env=$1
    local url=$(get_environment_url "$env")
    
    print_step "Running post-deployment verification for $env..."
    
    local failed_checks=()
    
    # Check health endpoint with proper validation
    print_step "Checking health endpoint..."
    local health_response=$(curl -s --max-time 15 "$url/api/health" 2>/dev/null || echo "")
    if ! echo "$health_response" | jq -e '.status == "ok"' > /dev/null 2>&1; then
        failed_checks+=("health_endpoint")
        print_error "Health check failed - Response: $health_response"
    else
        print_success "Health check passed"
    fi
    
    # Check main page
    print_step "Checking main page..."
    local main_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$url" 2>/dev/null || echo "000")
    if [ "$main_status" != "200" ]; then
        failed_checks+=("main_page")
        print_error "Main page check failed - HTTP status: $main_status"
    else
        print_success "Main page check passed"
    fi
    
    # Check API endpoints with authentication if required
    print_step "Checking API endpoints..."
    local api_headers=""
    if [ -n "$DEPLOYMENT_SECRET" ]; then
        api_headers="-H 'Authorization: Bearer $DEPLOYMENT_SECRET'"
    fi
    
    local api_status=$(eval "curl -s -o /dev/null -w '%{http_code}' --max-time 15 $api_headers '$url/api/jobs/search?q=developer'" 2>/dev/null || echo "000")
    if [ "$api_status" != "200" ] && [ "$api_status" != "401" ]; then
        failed_checks+=("api_endpoints")
        print_warning "Jobs search API check failed (non-critical) - HTTP status: $api_status"
    else
        print_success "API endpoints check passed"
    fi
    
    # Report results
    if [ ${#failed_checks[@]} -eq 0 ]; then
        print_success "All post-deployment verification checks passed"
        return 0
    else
        print_error "Some verification checks failed: ${failed_checks[*]}"
        return 1
    fi
}

# Function to rollback deployment with proper validation
rollback() {
    local env=$1
    print_step "Rolling back $env deployment..."
    
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI not found. Cannot perform rollback."
        exit 1
    fi
    
    print_step "Fetching recent deployments..."
    if ! vercel list; then
        print_error "Failed to fetch deployment list"
        exit 1
    fi
    
    echo
    read -p "Enter the deployment URL to rollback to: " deployment_url
    
    if [ -z "$deployment_url" ]; then
        print_error "No deployment URL provided"
        exit 1
    fi
    
    # Validate deployment URL format
    if ! [[ "$deployment_url" =~ ^https?:// ]]; then
        print_error "Invalid deployment URL format: $deployment_url"
        exit 1
    fi
    
    print_step "Rolling back to: $deployment_url"
    if ! vercel rollback "$deployment_url"; then
        print_error "Rollback failed"
        exit 1
    fi
    
    print_success "Rollback initiated"
    
    # Wait for rollback to complete
    wait_for_deployment "$env"
    post_deployment_verification "$env"
}

# Function to show deployment status with enhanced checks
status() {
    print_step "Checking deployment status..."
    
    local overall_status=0
    
    for env in "${ENVIRONMENTS[@]}"; do
        local url=$(get_environment_url "$env")
        local health_endpoint="$url/api/health"
        
        echo -n "[$env] $url: "
        
        # Check with timeout and proper error handling
        local http_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$health_endpoint" 2>/dev/null || echo "000")
        local response=$(curl -s --max-time 10 "$health_endpoint" 2>/dev/null || echo "")
        
        if [ "$http_status" = "200" ] && echo "$response" | jq -e '.status == "ok"' > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Online${NC}"
            
            # Show additional info if available
            local version=$(echo "$response" | jq -r '.version // "unknown"' 2>/dev/null)
            local uptime=$(echo "$response" | jq -r '.uptime // "unknown"' 2>/dev/null)
            echo "    Version: $version, Uptime: $uptime"
        else
            echo -e "${RED}✗ Offline (HTTP: $http_status)${NC}"
            overall_status=1
        fi
    done
    
    return $overall_status
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND] [ENVIRONMENT]"
    echo
    echo "Commands:"
    echo "  deploy <env>    Deploy to specified environment"
    echo "  rollback <env>  Rollback deployment in specified environment"
    echo "  status          Check status of all environments"
    echo "  health <env>    Check health of specific environment"
    echo "  help            Show this help message"
    echo
    echo "Environments:"
    echo "  development     Development environment"
    echo "  staging         Staging environment"
    echo "  production      Production environment"
    echo
    echo "Environment Variables:"
    echo "  DEV_URL                Development environment URL"
    echo "  STAGING_URL            Staging environment URL"
    echo "  PRODUCTION_URL         Production environment URL"
    echo "  HEALTH_CHECK_TIMEOUT   Health check timeout in seconds (default: 60)"
    echo "  HEALTH_CHECK_INTERVAL  Health check interval in seconds (default: 5)"
    echo "  DEPLOYMENT_TIMEOUT     Deployment timeout in seconds (default: 300)"
    echo "  MAX_RETRY_ATTEMPTS     Maximum retry attempts (default: 3)"
    echo "  DEPLOYMENT_SECRET      Secret for authenticated endpoints"
    echo "  REQUIRE_AUTH           Require authentication (default: true)"
    echo "  FORCE_DEPLOY           Skip confirmation prompts (default: false)"
    echo "  LOG_DIR                Log directory (default: ./logs)"
    echo
    echo "Examples:"
    echo "  $0 deploy staging"
    echo "  $0 rollback production"
    echo "  $0 status"
    echo "  $0 health production"
    echo "  FORCE_DEPLOY=true $0 deploy production"
}

# Main script logic
main() {
    print_header
    
    local command=${1:-help}
    local environment=$2
    
    # Validate configuration first
    validate_configuration
    
    # Check for deployment lock (except for status and help commands)
    if [[ "$command" != "status" && "$command" != "help" && "$command" != "-h" && "$command" != "--help" ]]; then
        check_deployment_lock
    fi
    
    case $command in
        "deploy")
            if [ -z "$environment" ]; then
                print_error "Environment required for deploy command"
                show_help
                exit 1
            fi
            
            validate_environment "$environment"
            check_prerequisites
            pre_deployment_checks
            check_migrations "$environment"
            deploy "$environment"
            
            if wait_for_deployment "$environment"; then
                if post_deployment_verification "$environment"; then
                    print_success "Deployment completed successfully!"
                else
                    print_error "Post-deployment verification failed"
                    exit 1
                fi
            else
                print_error "Deployment failed to become healthy"
                exit 1
            fi
            ;;
        "rollback")
            if [ -z "$environment" ]; then
                print_error "Environment required for rollback command"
                show_help
                exit 1
            fi
            
            validate_environment "$environment"
            check_prerequisites
            rollback "$environment"
            ;;
        "status")
            if ! status; then
                exit 1
            fi
            ;;
        "health")
            if [ -z "$environment" ]; then
                print_error "Environment required for health command"
                show_help
                exit 1
            fi
            
            validate_environment "$environment"
            if ! post_deployment_verification "$environment"; then
                exit 1
            fi
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 