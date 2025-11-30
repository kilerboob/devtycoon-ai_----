-- LAYER 15: Security Layer Schema
-- Tables: security_events, intrusions, security_guild_members, security_contracts

CREATE TABLE IF NOT EXISTS security_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(64) UNIQUE NOT NULL,
  type VARCHAR(64) NOT NULL,
  severity VARCHAR(16) NOT NULL,
  status VARCHAR(16) NOT NULL,
  timestamp BIGINT NOT NULL,
  source_id VARCHAR(64),
  source_name VARCHAR(128),
  target_path VARCHAR(256),
  description TEXT NOT NULL,
  blocked BOOLEAN DEFAULT FALSE,
  damage_dealt INTEGER DEFAULT 0,
  honeypot_id VARCHAR(64),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events (timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events (type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events (severity);

-- Intrusions (aggregated incidents)
CREATE TABLE IF NOT EXISTS intrusions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(128) NOT NULL,
  attacker_id VARCHAR(64),
  attacker_name VARCHAR(128),
  severity VARCHAR(16) NOT NULL,
  started_at BIGINT NOT NULL,
  resolved_at BIGINT,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intrusions_status ON intrusions (status);
CREATE INDEX IF NOT EXISTS idx_intrusions_started ON intrusions (started_at);

-- Security Guild Members
CREATE TABLE IF NOT EXISTS security_guild_members (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  username VARCHAR(128) NOT NULL,
  rank VARCHAR(32) NOT NULL DEFAULT 'recruit',
  joined_at TIMESTAMP DEFAULT NOW(),
  reputation INTEGER DEFAULT 0,
  UNIQUE(user_id)
);

-- Security Contracts
CREATE TABLE IF NOT EXISTS security_contracts (
  id SERIAL PRIMARY KEY,
  contract_id VARCHAR(64) UNIQUE NOT NULL,
  corporation_id VARCHAR(64) NOT NULL,
  title VARCHAR(128) NOT NULL,
  description TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  reward_money INTEGER DEFAULT 0,
  reward_rep INTEGER DEFAULT 0,
  assigned_to VARCHAR(64), -- user_id
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_contracts_status ON security_contracts (status);
