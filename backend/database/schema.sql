-- Users table (SME sellers and investors)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(255) UNIQUE NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('seller', 'investor', 'both')),
    email VARCHAR(255) UNIQUE,
    company_name VARCHAR(255),
    did VARCHAR(255) UNIQUE,
    kyc_verified BOOLEAN DEFAULT FALSE,
    credit_score INTEGER DEFAULT 0,
    total_invoices INTEGER DEFAULT 0,
    on_time_payments INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(100) NOT NULL,
    seller_id UUID REFERENCES users(id),
    buyer_name VARCHAR(255) NOT NULL,
    buyer_did VARCHAR(255),
    amount DECIMAL(20, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'RLUSD',
    due_date DATE NOT NULL,
    discount_rate DECIMAL(5, 2) NOT NULL, -- e.g., 5.00 for 5%
    selling_price DECIMAL(20, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'listed', 'funded', 'completed', 'defaulted')),
    nft_token_id VARCHAR(255) UNIQUE,
    document_hash VARCHAR(255), -- IPFS hash
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id),
    investor_id UUID REFERENCES users(id),
    amount DECIMAL(20, 2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'payment', 'refund')),
    xrpl_tx_hash VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Escrows table
CREATE TABLE escrows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id),
    investor_id UUID REFERENCES users(id),
    amount DECIMAL(20, 2) NOT NULL,
    escrow_sequence INTEGER,
    xrpl_escrow_id VARCHAR(255) UNIQUE,
    finish_after TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'released', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP
);

-- Credit history table
CREATE TABLE credit_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    invoice_id UUID REFERENCES invoices(id),
    payment_status VARCHAR(20) CHECK (payment_status IN ('on_time', 'late', 'default')),
    days_late INTEGER DEFAULT 0,
    score_change INTEGER,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_invoices_seller ON invoices(seller_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_transactions_invoice ON transactions(invoice_id);
CREATE INDEX idx_transactions_investor ON transactions(investor_id);
CREATE INDEX idx_escrows_invoice ON escrows(invoice_id);
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_did ON users(did);

-- Function to update credit score
CREATE OR REPLACE FUNCTION update_credit_score()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET 
        credit_score = (
            SELECT CASE 
                WHEN total_invoices = 0 THEN 0
                ELSE (on_time_payments::FLOAT / total_invoices::FLOAT * 100)::INTEGER
            END
            FROM (
                SELECT 
                    COUNT(*) as total_invoices,
                    COUNT(*) FILTER (WHERE payment_status = 'on_time') as on_time_payments
                FROM credit_history
                WHERE user_id = NEW.user_id
            ) stats
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update credit score
CREATE TRIGGER trigger_update_credit_score
AFTER INSERT ON credit_history
FOR EACH ROW
EXECUTE FUNCTION update_credit_score();