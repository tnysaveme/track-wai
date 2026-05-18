-- Migration 009: Allow the anon role to call the vote RPC functions.
--
-- Migration 003 revoked execute from public (which includes anon) to prevent
-- unauthenticated callers from touching the vote counts directly.  Now that
-- the public actions use the anon key instead of the service role key, we
-- need to grant execute back to anon.
--
-- The functions are still SECURITY DEFINER so the actual UPDATE on tracks
-- runs with the function owner's privileges — anon never touches the table
-- directly and RLS on tracks is not relaxed in any way.

GRANT EXECUTE ON FUNCTION increment_likes(uuid)    TO anon;
GRANT EXECUTE ON FUNCTION decrement_likes(uuid)    TO anon;
GRANT EXECUTE ON FUNCTION increment_dislikes(uuid) TO anon;
GRANT EXECUTE ON FUNCTION decrement_dislikes(uuid) TO anon;
