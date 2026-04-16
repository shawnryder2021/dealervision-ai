-- Super Admin Management
-- Defines which users have platform-wide admin access to configure pricing and Stripe

CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by TEXT,                 -- Email of admin who granted this access
  revoked_at TIMESTAMPTZ,          -- NULL = active, set when revoking
  notes TEXT,

  CONSTRAINT active_revoked_check CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);

CREATE INDEX idx_super_admins_email ON super_admins(email) WHERE revoked_at IS NULL;
CREATE INDEX idx_super_admins_active ON super_admins(revoked_at) WHERE revoked_at IS NULL;

-- Seed initial super admin
INSERT INTO super_admins (email, granted_by, notes)
VALUES ('shawn@shawnryder.com', 'system', 'Platform operator - can manage pricing and Stripe configuration')
ON CONFLICT (email) DO NOTHING;

-- No RLS on this table - it's system-wide
-- Access control happens in application layer via middleware
