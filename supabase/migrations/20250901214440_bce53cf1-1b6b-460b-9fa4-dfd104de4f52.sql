-- Create test data to verify the system works

-- Update one existing program to be purchasable with a price
UPDATE programs 
SET price = 99.99, is_purchasable = true, is_archived = false
WHERE id = 'e64b6721-c81a-474b-948c-12d400f88a02';

-- Create a test program access record (simulate a purchase)
INSERT INTO program_access (user_id, program_id, access_type, stripe_session_id)
VALUES (
  '3c1b0f85-d8f1-4aa0-950f-1414e9e85025', -- athlete user
  'e64b6721-c81a-474b-948c-12d400f88a02', -- the program we made purchasable
  'purchased',
  'cs_test_123456789'
);

-- Create another test program access record (simulate a coach assignment)  
INSERT INTO program_access (user_id, program_id, access_type, coach_id)
VALUES (
  'cb1d3fd0-ca01-4ed2-9987-5e8b37402be0', -- another athlete user
  'e64b6721-c81a-474b-948c-12d400f88a02', -- same program
  'assigned',
  'd7f6d87d-cd36-4838-9583-dbf47a5823fb'  -- coach user
);

-- Create one more purchasable program for testing
UPDATE programs 
SET price = 49.99, is_purchasable = true, is_archived = false, name = 'Premium Träningsprogram'
WHERE id = '504ca64f-bfd0-42f2-beef-33c11159d387';