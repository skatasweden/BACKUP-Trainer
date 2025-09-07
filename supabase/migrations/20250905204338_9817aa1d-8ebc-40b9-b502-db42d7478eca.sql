-- Check if the trigger already exists
DROP TRIGGER IF EXISTS protocols_coach_id_trigger ON protocols;

-- Create trigger to automatically set coach_id on insert
CREATE TRIGGER protocols_coach_id_trigger
  BEFORE INSERT ON protocols
  FOR EACH ROW
  EXECUTE FUNCTION set_coach_id_on_protocols();