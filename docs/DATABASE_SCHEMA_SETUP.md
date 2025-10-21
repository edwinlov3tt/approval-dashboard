# Database Schema Setup

## ⚠️ Important: Database Tables Need to Be Created

The error message shows:
```
relation "user_profiles" does not exist
```

This means the PostgreSQL database exists, but the tables haven't been created yet.

## Solution Options

### Option 1: Copy Schema from Creative Spec App (Recommended)

Since this app shares the database with the Creative Spec application, the tables should already exist there. Check if the Creative Spec app has:

1. A migrations folder
2. SQL schema files
3. A setup script

You can run those migrations against this shared database.

### Option 2: Create Tables Manually

If the Creative Spec app doesn't have migrations yet, here's the basic schema needed:

```sql
-- Advertisers (Companies)
CREATE TABLE advertisers (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    website TEXT,
    facebook_page TEXT,
    facebook_page_id VARCHAR(100),
    instagram_account TEXT,
    category VARCHAR(100),
    company_overview TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Profiles
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    advertiser_id INTEGER REFERENCES advertisers(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    profile_photo_url TEXT,
    password_hash TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    is_on_vacation BOOLEAN DEFAULT FALSE,
    vacation_delegate_id INTEGER REFERENCES user_profiles(id),
    vacation_start_date DATE,
    vacation_end_date DATE,
    vacation_auto_reply TEXT,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns
CREATE TABLE campaigns (
    id SERIAL PRIMARY KEY,
    advertiser_id INTEGER REFERENCES advertisers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'waiting',
    start_date DATE,
    end_date DATE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ads
CREATE TABLE ads (
    id SERIAL PRIMARY KEY,
    short_id VARCHAR(20) UNIQUE,
    ad_copy JSONB NOT NULL,
    approval_status VARCHAR(50) DEFAULT 'waiting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Ads (Junction Table)
CREATE TABLE campaign_ads (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    ad_id INTEGER REFERENCES ads(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    notes TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, ad_id)
);

-- Indexes for performance
CREATE INDEX idx_campaigns_advertiser ON campaigns(advertiser_id);
CREATE INDEX idx_user_profiles_advertiser ON user_profiles(advertiser_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_campaign_ads_campaign ON campaign_ads(campaign_id);
CREATE INDEX idx_campaign_ads_ad ON campaign_ads(ad_id);
CREATE INDEX idx_ads_status ON ads(approval_status);
```

### Option 3: Ask Creative Spec Developer for Schema

Since the databases are shared, coordinate with whoever set up the Creative Spec application to:

1. Get the current database schema
2. Ensure all necessary tables exist
3. Add any missing tables for the approval dashboard features

## Quick Test

To verify which tables exist, you can run this query:

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

## Seed Data

After creating tables, you'll need some test data. Here's a minimal dataset:

```sql
-- Create test advertiser
INSERT INTO advertisers (company_name, category)
VALUES ('Test Company', 'Technology')
RETURNING id; -- Note this ID

-- Create test user (use the advertiser ID from above)
INSERT INTO user_profiles (advertiser_id, first_name, last_name, email, password_hash)
VALUES (1, 'John', 'Doe', 'john@test.com', '$2a$10$dummy.hash')
RETURNING id; -- Note this ID

-- Create test campaign
INSERT INTO campaigns (advertiser_id, name, description, status)
VALUES (1, 'Summer Sale 2025', 'Q3 promotional campaign', 'in_progress')
RETURNING id;

-- Create test ad
INSERT INTO ads (short_id, ad_copy, approval_status)
VALUES (
    'abc123',
    '{"adName": "Test Ad", "primaryText": "Test primary text", "headline": "Test Headline"}',
    'waiting'
)
RETURNING id;

-- Link ad to campaign
INSERT INTO campaign_ads (campaign_id, ad_id, display_order)
VALUES (1, 1, 0);
```

## After Schema is Ready

Once the tables exist:

1. Restart the dev servers: `npm run dev`
2. Navigate to http://localhost:5174
3. Login with the test user email
4. Dashboard should now load real data!

## Migration Tools (Future)

Consider using a migration tool for production:
- **node-pg-migrate** - Node.js migrations for PostgreSQL
- **Flyway** - Database migration tool
- **Prisma** - Modern ORM with migrations

## Troubleshooting

### Tables Still Don't Exist
- Check that you're connected to the correct database
- Verify you have CREATE TABLE permissions
- Run `\dt` in psql to list tables

### Cannot Connect to Database
- Verify DATABASE_URL in `.env`
- Check network connectivity to database
- Confirm credentials are correct

### Data Type Errors
- Ensure JSONB columns are used for `ad_copy` and `metadata`
- Check that timestamp fields use `TIMESTAMP` or `TIMESTAMPTZ`

---

**Next Step**: Create the database schema, then the approval dashboard will work with real data!
