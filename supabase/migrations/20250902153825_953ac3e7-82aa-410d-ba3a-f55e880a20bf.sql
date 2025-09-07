-- Fix any programs with prices below Stripe minimum (3.00 SEK)
UPDATE programs 
SET price = 3.00 
WHERE is_purchasable = true 
  AND (price IS NULL OR price < 3.00);

-- Ensure all purchasable programs have valid prices
UPDATE programs 
SET price = 29.00 
WHERE is_purchasable = true 
  AND price IS NULL;