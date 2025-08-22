# SQL Migrations for Workspace Members

## Step 1: Check Prerequisites
Run this to verify your tables exist:
```sql
-- Check if workspaces table exists
SELECT * FROM workspaces LIMIT 1;

-- Check if profiles table exists  
SELECT * FROM profiles LIMIT 1;
```

## Step 2: Create workspace_members Table
```sql
-- Drop table if it exists (in case of issues)
DROP TABLE IF EXISTS workspace_members;

-- Create the workspace_members table
CREATE TABLE workspace_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);
```

## Step 3: Set Up Row Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Only workspace owners can manage members
CREATE POLICY "Workspace owners can manage members" ON workspace_members
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM workspaces WHERE created_by = auth.uid()
        )
    );

-- Members can view other members in their workspaces
CREATE POLICY "Members can view workspace members" ON workspace_members
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );
```

## Step 4: Test the Setup
```sql
-- Test by checking the table structure
\d workspace_members;

-- Or just verify it exists
SELECT COUNT(*) FROM workspace_members;
```

## Troubleshooting

### If you get "relation does not exist" errors:
1. Make sure you're connected to the right database
2. Make sure you run this in the Supabase SQL Editor (not the CLI)
3. Check if the `workspaces` and `profiles` tables exist first

### If you get foreign key errors:
The references to `workspaces(id)` and `profiles(id)` need those tables to exist first.

### Common Issues:
- **profiles table**: Should be created automatically by Supabase Auth when users sign up
- **workspaces table**: Should have been created when you implemented workspace feature
- **user_id format**: Make sure the user you're trying to add has actually signed up and has a profile

## Notes
- Run each section step by step in your Supabase SQL editor
- The `profiles` table should already exist from Supabase Auth
- The `workspaces` table should already exist from previous implementation
