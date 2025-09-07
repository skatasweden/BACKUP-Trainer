-- Update Premium Träningsprogram to have a price above Stripe minimum for testing
UPDATE programs 
SET price = 49.99 
WHERE name = 'Premium Träningsprogram';