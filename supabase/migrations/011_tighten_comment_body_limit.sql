ALTER TABLE comments DROP CONSTRAINT comments_body_check;
ALTER TABLE comments ADD CONSTRAINT comments_body_check CHECK (char_length(body) BETWEEN 1 AND 200);
