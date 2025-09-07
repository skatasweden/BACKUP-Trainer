-- Add program access for the current user to test the functionality
INSERT INTO program_access (
    user_id, 
    program_id, 
    access_type, 
    coach_id,
    source
) 
SELECT 
    '01df802f-58f6-4267-82a2-5972e566bb39',  -- User ID from auth logs
    '279c13de-5e7e-4ae1-b7b2-9fe2dba64f70',  -- Program ID from URL
    'granted',
    (SELECT coach_id FROM programs WHERE id = '279c13de-5e7e-4ae1-b7b2-9fe2dba64f70'),
    'manual'
WHERE NOT EXISTS (
    SELECT 1 FROM program_access 
    WHERE user_id = '01df802f-58f6-4267-82a2-5972e566bb39' 
    AND program_id = '279c13de-5e7e-4ae1-b7b2-9fe2dba64f70'
);